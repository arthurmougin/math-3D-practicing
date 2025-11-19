/**
 * Predefined list of parameter names to cycle through
 * Based on Greek alphabet letters commonly used in mathematics
 */
export const PARAMETER_NAMES = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Theta",
  "Lambda",
  "Sigma",
  "Omega",
] as const;

/**
 * Predefined list of colors to cycle through for parameters
 * Provides high contrast colors for easy visual distinction
 */
export const PARAMETER_COLORS = [
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ff8800", // Orange
  "#8800ff", // Purple
  "#00ff88", // Teal
  "#ff0088", // Pink
] as const;

/**
 * Default spacing between parameters in 3D space
 */
export const PARAMETER_SPACING = 1.5;

/**
 * Minimum distance between two parameters to avoid overlapping
 */
export const PARAMETER_BREATHING_ROOM = 1.1;
