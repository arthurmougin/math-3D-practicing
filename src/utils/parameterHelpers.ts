import { Vector3 } from "three";
import type { ScenarioParameter } from "../types";
import {
  PARAMETER_SPACING,
  PARAMETER_BREATHING_ROOM,
  PARAMETER_NAMES,
} from "../constants/parameters";

/**
 * Finds a non-overlapping position for a new parameter in 3D space
 * Uses predefined positions first, then shifts incrementally if needed
 * 
 * @param parameters - Existing parameters to check for overlaps
 * @returns A Vector3 position that doesn't overlap with existing parameters
 * 
 * @example
 * ```ts
 * const position = findNonOverlappingPosition(existingParameters);
 * const newParam = {
 *   id: "param-1",
 *   name: "Alpha",
 *   value: position,
 *   // ...
 * };
 * ```
 */
export function findNonOverlappingPosition(
  parameters: ScenarioParameter[]
): Vector3 {
  let shift = 0;

  do {
    // Predefined positions close to origin for up to 8 parameters
    const predefinedPositions = [
      [0 + shift, 0, 0], // First parameter at origin
      [PARAMETER_SPACING + shift, 0, 0], // Second on X axis
      [0 + shift, PARAMETER_SPACING, 0], // Third on Y axis
      [0 + shift, 0, PARAMETER_SPACING], // Fourth on Z axis
      [PARAMETER_SPACING + shift, PARAMETER_SPACING, 0], // Fifth diagonal XY
      [PARAMETER_SPACING + shift, 0, PARAMETER_SPACING], // Sixth diagonal XZ
      [0 + shift, PARAMETER_SPACING, PARAMETER_SPACING], // Seventh diagonal YZ
      [PARAMETER_SPACING + shift, PARAMETER_SPACING, PARAMETER_SPACING], // Eighth corner
    ];

    for (const pos of predefinedPositions) {
      const position = new Vector3(...(pos as [number, number, number]));
      const overlapping = parameters.some((param) => {
        if (param.value instanceof Vector3) {
          return param.value.distanceTo(position) < PARAMETER_BREATHING_ROOM;
        }
        return false;
      });

      if (!overlapping) {
        return position;
      }
    }

    shift += 3; // Increase spacing and try again
  } while (true);
}

/**
 * Finds a non-overlapping name for a new parameter
 * Uses Greek alphabet letters, adding numeric suffixes if needed
 * 
 * @param parameters - Existing parameters to check for name conflicts
 * @returns A unique parameter name
 * 
 * @example
 * ```ts
 * const name = findNonOverlappingName(existingParameters);
 * // Returns "Alpha", "Beta", etc., or "Alpha (1)" if all names are taken
 * ```
 */
export function findNonOverlappingName(
  parameters: ScenarioParameter[]
): string {
  const existingNames = new Set(parameters.map((param) => param.name));
  let increment = 0;

  do {
    for (const baseName of PARAMETER_NAMES) {
      const name = increment > 0 ? `${baseName} (${increment})` : baseName;
      if (!existingNames.has(name)) {
        return name;
      }
    }
    increment++;
  } while (true);
}
