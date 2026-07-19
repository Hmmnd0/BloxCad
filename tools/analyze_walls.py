#!/usr/bin/env python3
"""
Analyze a floor plan or elevation underlay image using OpenCV Hough line detection.
Outputs wall segment coordinates in canvas feet ready for place_wall() MCP calls.

Improvements over v1:
  - Bilateral filter instead of Gaussian (preserves sharp wall edges)
  - Larger morphological close kernel (bridges double-line wall gaps)
  - Adaptive Hough parameters scaled to image resolution
  - Angle snapping to dominant building-grid angles
  - Collinear segment merging (combines door/window-interrupted wall fragments)
"""

import cv2
import numpy as np
import argparse
import json
import sys
import math


def px_to_ft(px_val, scale_ft_per_px):
    return round(px_val * scale_ft_per_px, 2)


def preprocess_floor_plan(gray):
    """
    Bilateral filter preserves wall edges while smoothing interior noise.
    5×5 morphological close bridges the gap between double-line walls
    (vs old 3×3 which was too small to join them).
    """
    bilateral = cv2.bilateralFilter(gray, d=5, sigmaColor=40, sigmaSpace=5)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    return cv2.morphologyEx(bilateral, cv2.MORPH_CLOSE, kernel)


def preprocess_elevation(gray):
    """Preserve thin single architectural lines while handling JPEG artifacts."""
    denoised = cv2.fastNlMeansDenoising(gray, h=6, templateWindowSize=7, searchWindowSize=21)
    adaptive = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=21, C=8
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 1))
    return cv2.dilate(adaptive, kernel, iterations=1)


# ── Geometry helpers ──────────────────────────────────────────────────────────

def angle_diff(a, b):
    """Minimum angular difference between two line angles in [0, 180)."""
    d = abs(a - b) % 180
    return min(d, 180 - d)


def point_to_line_dist(x1, y1, x2, y2, px, py):
    """Perpendicular distance from (px, py) to the infinite line through (x1,y1)-(x2,y2)."""
    dx, dy = x2 - x1, y2 - y1
    denom = math.hypot(dx, dy)
    if denom < 1e-6:
        return math.hypot(px - x1, py - y1)
    return abs(dy * px - dx * py + x2 * y1 - y2 * x1) / denom


# ── Stage 1: dominant angle detection ────────────────────────────────────────

def find_dominant_angles(segments, bin_deg=5, min_frac=0.04):
    """
    Find angles that represent at least min_frac of total segments.
    Uses 5° bins for finer resolution than the 15° display buckets.
    """
    if not segments:
        return []
    bins = {}
    for s in segments:
        bucket = round(s[4] / bin_deg) * bin_deg % 180
        bins[bucket] = bins.get(bucket, 0) + 1
    min_count = max(2, int(len(segments) * min_frac))
    return sorted(ang for ang, cnt in bins.items() if cnt >= min_count)


# ── Stage 2: angle snapping ───────────────────────────────────────────────────

def snap_segments_to_dominant(segments, dominant_angles, snap_tol_deg=12.0):
    """
    Snap each segment's angle to the nearest dominant angle if within snap_tol_deg.
    Segment is rotated around its midpoint so length is preserved.
    Segments outside snap_tol_deg of any dominant angle are left unchanged.
    """
    if not dominant_angles:
        return segments
    result = []
    for x1, y1, x2, y2, ang in segments:
        best = min(dominant_angles, key=lambda d: angle_diff(ang, d))
        if angle_diff(ang, best) > snap_tol_deg:
            result.append((x1, y1, x2, y2, ang))
            continue
        # Rotate to snapped angle, keeping midpoint and length fixed
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        half = math.hypot(x2 - x1, y2 - y1) / 2
        rad = math.radians(best % 180)
        dx, dy = math.cos(rad) * half, math.sin(rad) * half
        result.append((mx - dx, my - dy, mx + dx, my + dy, best % 180))
    return result


# ── Stage 3: collinear merging ────────────────────────────────────────────────

def merge_collinear_segments(segments, angle_tol_deg=5.0, perp_tol_px=8.0, gap_tol_px=25.0):
    """
    Merge wall fragments that lie on the same infinite line into single segments.
    Uses union-find so transitive merges (A-B, B-C → A-B-C) work correctly.

    Two segments are considered the same wall if:
      1. Their angles differ by less than angle_tol_deg
      2. The midpoint of one sits within perp_tol_px of the other's infinite line
      3. Their along-direction extents overlap or are within gap_tol_px (bridging doors/windows)
    """
    n = len(segments)
    if n < 2:
        return segments

    # Union-find with path compression
    parent = list(range(n))

    def find(x):
        root = x
        while parent[root] != root:
            root = parent[root]
        while parent[x] != root:
            parent[x], x = root, parent[x]
        return root

    def union(a, b):
        parent[find(a)] = find(b)

    for i in range(n):
        x1, y1, x2, y2, ai = segments[i]
        rad_i = math.radians(ai)
        ux, uy = math.cos(rad_i), math.sin(rad_i)
        i_min = min(x1 * ux + y1 * uy, x2 * ux + y2 * uy)
        i_max = max(x1 * ux + y1 * uy, x2 * ux + y2 * uy)

        for j in range(i + 1, n):
            ox1, oy1, ox2, oy2, aj = segments[j]

            if angle_diff(ai, aj) > angle_tol_deg:
                continue

            jmx, jmy = (ox1 + ox2) / 2, (oy1 + oy2) / 2
            if point_to_line_dist(x1, y1, x2, y2, jmx, jmy) > perp_tol_px:
                continue

            j_min = min(ox1 * ux + oy1 * uy, ox2 * ux + oy2 * uy)
            j_max = max(ox1 * ux + oy1 * uy, ox2 * ux + oy2 * uy)
            gap = max(i_min, j_min) - min(i_max, j_max)
            if gap > gap_tol_px:
                continue

            union(i, j)

    # Collect components
    groups = {}
    for i in range(n):
        groups.setdefault(find(i), []).append(i)

    result = []
    for indices in groups.values():
        if len(indices) == 1:
            result.append(segments[indices[0]])
            continue

        group_segs = [segments[k] for k in indices]

        # Canonical direction: average angle of the group
        avg_angle = sum(s[4] for s in group_segs) / len(group_segs)
        rad = math.radians(avg_angle)
        ux, uy = math.cos(rad), math.sin(rad)
        px, py = -uy, ux  # perpendicular direction

        # Average perpendicular offset (position of the shared line)
        avg_perp = (sum(s[0] * px + s[1] * py for s in group_segs) / len(group_segs))

        # Extent: min/max along-direction across all endpoints
        all_along = []
        for gx1, gy1, gx2, gy2, _ in group_segs:
            all_along.append(gx1 * ux + gy1 * uy)
            all_along.append(gx2 * ux + gy2 * uy)
        along_min, along_max = min(all_along), max(all_along)

        # Reconstruct merged segment from line coordinates
        nx1 = along_min * ux + avg_perp * px
        ny1 = along_min * uy + avg_perp * py
        nx2 = along_max * ux + avg_perp * px
        ny2 = along_max * uy + avg_perp * py

        result.append((nx1, ny1, nx2, ny2, avg_angle))

    return result


# ── Stage 4: deduplication ────────────────────────────────────────────────────

def deduplicate_segments(segments, dist_px=8.0, angle_tol_deg=4.0):
    """Remove near-duplicate segments (same line detected multiple times by Hough)."""
    kept = []
    for x1, y1, x2, y2, angle in segments:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        is_dup = any(
            angle_diff(angle, ka) < angle_tol_deg and
            math.hypot(mx - (kx1+kx2)/2, my - (ky1+ky2)/2) < dist_px
            for kx1, ky1, kx2, ky2, ka in kept
        )
        if not is_dup:
            kept.append((x1, y1, x2, y2, angle))
    return kept


# ── Main analysis ─────────────────────────────────────────────────────────────

def analyze(image_path, real_width_ft, min_length_px, max_length_ft, top_n, mode, debug_out):
    img = cv2.imread(image_path)
    if img is None:
        print(f"ERROR: Could not read image at {image_path}", file=sys.stderr)
        sys.exit(1)

    h, w = img.shape[:2]
    scale = real_width_ft / w       # ft per pixel
    px_per_ft = w / real_width_ft   # pixels per foot
    max_length_px = max_length_ft / scale

    print(f"Image: {w}×{h}px  |  {px_per_ft:.1f} px/ft  |  "
          f"Real: {real_width_ft:.1f} × {h*scale:.1f} ft", file=sys.stderr)
    print(f"Mode: {mode}", file=sys.stderr)
    print(f"Length filter: {min_length_px*scale:.1f}–{max_length_ft:.1f} ft  "
          f"({min_length_px:.0f}–{max_length_px:.0f} px)", file=sys.stderr)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Adaptive Hough parameters — scale to image resolution so the same real-world
    # thresholds apply regardless of scan DPI or image size.
    hough_threshold = max(20, int(px_per_ft * 1.2))   # ~1.2 votes per foot of wall
    max_line_gap    = max(6,  int(px_per_ft * 0.4))   # bridge gaps up to ~0.4 ft
    perp_tol_px     = max(6,  int(px_per_ft * 0.4))   # ~0.4 ft perp tolerance for merge
    gap_tol_px      = max(20, int(px_per_ft * 2.0))   # bridge door/window gaps up to ~2 ft

    if mode == 'elevation':
        preprocessed = preprocess_elevation(gray)
        hough_threshold = max(15, int(px_per_ft * 0.8))
        max_line_gap    = max(20, int(px_per_ft * 0.6))
        edges = preprocessed
        unique = set(np.unique(preprocessed))
        if not unique.issubset({0, 255}):
            edges = cv2.Canny(preprocessed, 30, 100, apertureSize=3)
    else:
        preprocessed = preprocess_floor_plan(gray)
        edges = cv2.Canny(preprocessed, 50, 150, apertureSize=3)

    if debug_out:
        cv2.imwrite(debug_out.replace('.png', '_edges.png'), edges)

    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=hough_threshold,
        minLineLength=min_length_px,
        maxLineGap=max_line_gap,
    )

    if lines is None:
        print("No lines detected.", file=sys.stderr)
        sys.exit(1)

    print(f"\nRaw Hough: {len(lines)} segments", file=sys.stderr)

    # Filter by length → (x1, y1, x2, y2, angle_deg)
    segments = []
    for line in lines:
        x1, y1, x2, y2 = map(float, line[0])
        length = math.hypot(x2 - x1, y2 - y1)
        if min_length_px <= length <= max_length_px:
            angle_deg = math.degrees(math.atan2(y2 - y1, x2 - x1)) % 180
            segments.append((x1, y1, x2, y2, angle_deg))

    print(f"After length filter: {len(segments)}", file=sys.stderr)

    # ── Stage 1: dominant angle detection ─────────────────────────────────────
    dominant = find_dominant_angles(segments)
    print(f"Dominant angles: {[f'{a}°' for a in dominant]}", file=sys.stderr)

    # ── Stage 2: snap to dominant angles ──────────────────────────────────────
    if dominant:
        segments = snap_segments_to_dominant(segments, dominant, snap_tol_deg=12.0)
        print(f"After angle snap: {len(segments)} (angles regularised)", file=sys.stderr)

    # ── Stage 3: merge collinear fragments ────────────────────────────────────
    before = len(segments)
    segments = merge_collinear_segments(
        segments,
        angle_tol_deg=5.0,
        perp_tol_px=perp_tol_px,
        gap_tol_px=gap_tol_px,
    )
    print(f"After collinear merge: {before} → {len(segments)} segments", file=sys.stderr)

    # Re-apply length filter — merged segments can overshoot max_length_ft
    segments = [s for s in segments
                if min_length_px <= math.hypot(s[2]-s[0], s[3]-s[1]) <= max_length_px]
    print(f"After re-filter: {len(segments)}", file=sys.stderr)

    # ── Stage 4: deduplicate ──────────────────────────────────────────────────
    before = len(segments)
    segments = deduplicate_segments(segments, dist_px=8.0, angle_tol_deg=4.0)
    print(f"After dedup: {before} → {len(segments)}", file=sys.stderr)

    # Sort by length descending and take top N
    segments.sort(key=lambda s: -math.hypot(s[2]-s[0], s[3]-s[1]))
    top = segments[:top_n]

    # Angle distribution display
    angle_bins = {}
    for s in segments:
        bucket = round(s[4] / 15) * 15
        angle_bins[bucket] = angle_bins.get(bucket, 0) + 1
    print("\nAngle distribution (15° buckets):", file=sys.stderr)
    for ang in sorted(angle_bins):
        bar = '█' * min(angle_bins[ang], 40)
        print(f"  {ang:3d}°: {bar} {angle_bins[ang]}", file=sys.stderr)

    # Build output
    walls = []
    for x1, y1, x2, y2, angle in top:
        if x1 > x2:
            x1, y1, x2, y2 = x2, y2, x1, y1
        length_ft = math.hypot(x2 - x1, y2 - y1) * scale
        walls.append({
            'x1_ft':     px_to_ft(x1, scale),
            'y1_ft':     px_to_ft(y1, scale),
            'x2_ft':     px_to_ft(x2, scale),
            'y2_ft':     px_to_ft(y2, scale),
            'angle_deg': round(angle, 1),
            'length_ft': round(length_ft, 2),
        })

    print(f"\nTop {len(walls)} wall segments:", file=sys.stderr)
    for i, wl in enumerate(walls):
        print(f"  {i+1:2d}. ({wl['x1_ft']}, {wl['y1_ft']}) → ({wl['x2_ft']}, {wl['y2_ft']})"
              f"  {wl['length_ft']:.1f}ft  {wl['angle_deg']}°", file=sys.stderr)

    print(json.dumps(walls, indent=2))

    if debug_out:
        vis = img.copy()
        for wl in walls:
            p1 = (int(wl['x1_ft'] / scale), int(wl['y1_ft'] / scale))
            p2 = (int(wl['x2_ft'] / scale), int(wl['y2_ft'] / scale))
            cv2.line(vis, p1, p2, (0, 0, 255), 2)
            cv2.circle(vis, p1, 4, (0, 255, 0), -1)
            cv2.circle(vis, p2, 4, (255, 0, 0), -1)
        cv2.imwrite(debug_out, vis)
        print(f"Debug image written: {debug_out}", file=sys.stderr)

    return walls


def main():
    parser = argparse.ArgumentParser(
        description='Detect wall segments in a floor plan or elevation using OpenCV Hough lines')
    parser.add_argument('image', help='Path to image file')
    parser.add_argument('--real-width-ft', type=float, default=88.0,
                        help='Real-world width of the image in feet (from underlay calibration)')
    parser.add_argument('--min-length-px', type=float, default=30.0,
                        help='Minimum segment length in pixels')
    parser.add_argument('--max-length-ft', type=float, default=40.0,
                        help='Maximum segment length in feet (filters image-spanning artifacts)')
    parser.add_argument('--top-n', type=int, default=50,
                        help='Number of top segments to return (sorted by length)')
    parser.add_argument('--mode', choices=['floor-plan', 'elevation'], default='floor-plan',
                        help='Detection mode')
    parser.add_argument('--debug-out', type=str, default=None,
                        help='Write a debug overlay image to this path')
    args = parser.parse_args()

    analyze(args.image, args.real_width_ft, args.min_length_px, args.max_length_ft,
            args.top_n, args.mode, args.debug_out)


if __name__ == '__main__':
    main()
