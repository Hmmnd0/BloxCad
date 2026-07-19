---
name: feedback-angles
description: Always use diagonal walls for angular/rotated buildings — don't default to orthogonal unless the drawing is clearly orthogonal
metadata:
  type: feedback
---

When a floor plan is clearly drawn on a diagonal or triangular grid (e.g. Frank Lloyd Wright's 30° module), assume EVERY wall needs an angle. Do not default to orthogonal walls and wait to be corrected.

**Why:** The Price Tower floor plan is a 30° triangular module building. Three of the four wings (Gyno, Surgeon, Dentist) have walls at steep diagonals (~80° from horizontal). Defaulting to x1,y1,x2,y2 orthogonal placement completely misrepresents the geometry. Joe had to explicitly call this out twice.

**How to apply:** Before placing any wall in an angular building, look at the drawing and identify the wall angles. If the plan is rotated or on a triangular/hexagonal grid, use diagonal x1,y1 → x2,y2 coordinates from the start — for every wall, including interior partitions. The place_wall tool supports any angle.
