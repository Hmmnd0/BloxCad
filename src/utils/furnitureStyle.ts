// Shared by canvas furniture and its SVG library previews. Unknown/material
// colors pass through; geometry and architectural line-weight tiers stay intact.
const COLORS: Record<string, string> = {
  '#d0c8bc': '#d8dee5', '#d4ccc0': '#d8dee5', '#d8d4cf': '#e0e5eb',
  '#e8e0d4': '#eef1f5', '#ece6dc': '#f8f9fb', '#f0ece4': '#f1f4f7',
  '#f5f0e8': '#f1f4f7', '#f5f5f0': '#fafbfc',
  '#aaa': '#8e99a8', '#bbb': '#a3adb9', '#ccc': '#b8c0ca',
  '#e8e4dc': '#edf0f4', '#f0f0f0': '#f0f3f6', '#f5f5f5': '#f6f8fa',
  '#f0f8ff': '#edf4f8', '#888': '#7c8898',
}
export function furnitureColor(color?: string): string | undefined {
  return color ? COLORS[color.toLowerCase()] ?? color : color
}
