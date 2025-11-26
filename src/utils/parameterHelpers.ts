import {
  Euler,
  Matrix3,
  Matrix4,
  Quaternion,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import type {
  ScenarioParameter,
  ValueType,
  ValueTypeName,
} from "../../types/types";
import {
  PARAMETER_SPACING,
  PARAMETER_BREATHING_ROOM,
  PARAMETER_NAMES,
  PARAMETER_COLORS,
} from "../constants/parameterConstants";

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
        switch (param.type) {
          case "Vector4":
            return (
              new Vector3().copy(param.value as Vector4).distanceTo(position) <
              PARAMETER_BREATHING_ROOM
            );
          case "Vector3":
            return (
              (param.value as Vector3).distanceTo(position) <
              PARAMETER_BREATHING_ROOM
            );
          case "Vector2":
            return (
              (param.value as Vector2).distanceTo(position) <
              PARAMETER_BREATHING_ROOM
            );
          case "Number":
            return (
              Math.abs((param.value as number) - position.x) <
              PARAMETER_BREATHING_ROOM
            );
          case "Matrix4": {
            const matrixPos = new Vector3().setFromMatrixPosition(
              param.value as Matrix4
            );
            return matrixPos.distanceTo(position) < PARAMETER_BREATHING_ROOM;
          }
          case "Matrix3": {
            const m4 = new Matrix4();
            (param.value as Matrix3).getNormalMatrix(m4);
            const matrixPos = new Vector3().setFromMatrixPosition(m4);
            return matrixPos.distanceTo(position) < PARAMETER_BREATHING_ROOM;
          }
          //case "Euler":
          default:
            throw new Error(
              `inImplemented parameter type for position overlap check: ${param.type}`
            );
        }
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
  const existingNames = new Set(
    parameters.map((param) => param.name.split(" ")[0])
  );
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

/**
 * Finds a non-overlapping color for a new parameter
 * Cycles through predefined high-contrast colors
 */
export function findNonOverlappingColor(
  parameters: ScenarioParameter[]
): string {
  const existingColors = new Set(
    parameters.map((param) => param.representation.color)
  );
  for (const color of PARAMETER_COLORS) {
    if (!existingColors.has(color)) {
      return color;
    }
  }
  // If all predefined colors are taken, return a default color
  return "#888888"; // Grey
}

/**
 * Converts any valueType to a Matrix4 for unified transformation handling
 *
 * @param value - The value to convert (Vector3, Quaternion, Euler, Matrix4, number[], or number)
 * @returns A Matrix4 representing the transformation
 *
 * @example
 * ```ts
 * const vec = new Vector3(1, 2, 3);
 * const matrix = valueToMatrix4(vec); // Translation matrix
 *
 * const quat = new Quaternion(0, 0, 0, 1);
 * const matrix2 = valueToMatrix4(quat); // Rotation matrix
 * ```
 */
export function valueToMatrix4(value: ValueType, type: ValueTypeName): Matrix4 {
  const matrix = new Matrix4();

  switch (type) {
    case "Matrix4":
      return (value as Matrix4).clone();
    case "Matrix3":
      const m4 = new Matrix4();
      (value as Matrix3).getNormalMatrix(m4);
      return m4;
    case "Vector3":
      const vec = value as Vector3;
      matrix.makeTranslation(vec.x, vec.y, vec.z);
      return matrix;
    case "Vector2":
      const vec2 = value as Vector2;
      matrix.makeTranslation(vec2.x, vec2.y, 0);
      return matrix;
    case "Vector4":
      const vec4 = value as Vector4;
      matrix.makeTranslation(vec4.x, vec4.y, vec4.z);
      return matrix;
    case "Quaternion":
      const quat = value as Quaternion;
      matrix.makeRotationFromQuaternion(quat);
      return matrix;
    case "Euler":
      const euler = value as Euler;
      matrix.makeRotationFromEuler(euler);
      return matrix;
    case "Number":
      const num = value as number;
      matrix.makeTranslation(num, 0, 0);
      return matrix;
    case "Boolean":
      const boolNum = (value as boolean) ? 1 : 0;
      matrix.makeTranslation(boolNum, 0, 0);
      return matrix;
    default:
      throw new Error(`Unsupported value type for matrix conversion: ${type}`);
  }
}


export function matrix4ToValue(matrix: Matrix4, value : ValueType, type: ValueTypeName): ValueType {
  switch (type) {
    case "Matrix4":
      value.copy(matrix);
      return value;
    case "Matrix3":
      const m3 = value as Matrix3;
      m3.setFromMatrix4(matrix);
      return m3;
    case "Vector3":
      const vec = value as Vector3;
      vec.setFromMatrixPosition(matrix);
      return vec;
    case "Vector2":
      const vec2 = value as Vector2;
      const pos2 = new Vector3().setFromMatrixPosition(matrix);
      vec2.set(pos2.x, pos2.y);
      return vec2;
    case "Vector4":
      const vec4 = value as Vector4;
      const pos4 = new Vector3().setFromMatrixPosition(matrix);
      vec4.set(pos4.x, pos4.y, pos4.z, 0);
      return vec4;
    case "Quaternion":
      const quat = value as Quaternion;
      quat.setFromRotationMatrix(matrix);
      return quat;
    case "Euler":
      const euler = value as Euler;
      euler.setFromRotationMatrix(matrix);
      return euler;
    case "Number":
      const posNum = new Vector3().setFromMatrixPosition(matrix);
      return posNum.x;
    case "Boolean":
      const posBool = new Vector3().setFromMatrixPosition(matrix);
      return posBool.x !== 0;
    default:
      throw new Error(`Unsupported value type for matrix conversion: ${type}`);
  }
}