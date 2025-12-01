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
  MathScenario,
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
  parameters: ScenarioParameter[],
  isPositional: boolean = true
): Vector3 {
  let shift = 0;

  do {
    // Predefined positions close to origin for up to 8 parameters
    let predefinedPositions = [
      [PARAMETER_SPACING + shift, 0, 0], // Second on X axis
      [0 + shift, PARAMETER_SPACING, 0], // Third on Y axis
      [0 + shift, 0, PARAMETER_SPACING], // Fourth on Z axis
      [PARAMETER_SPACING + shift, PARAMETER_SPACING, 0], // Fifth diagonal XY
      [PARAMETER_SPACING + shift, 0, PARAMETER_SPACING], // Sixth diagonal XZ
      [0 + shift, PARAMETER_SPACING, PARAMETER_SPACING], // Seventh diagonal YZ
      [PARAMETER_SPACING + shift, PARAMETER_SPACING, PARAMETER_SPACING], // Eighth corner
    ];

    if (!isPositional) {
      //only on X and Z in the negative X space
      predefinedPositions = [[0, 0, -PARAMETER_SPACING - shift]];
    }

    for (const pos of predefinedPositions) {
      const position = new Vector3(...(pos as [number, number, number]));
      const overlapping = parameters.some((param) => {
        switch (param.type) {
          // @ts-ignore
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
              (param.value as Vector2).distanceTo(
                new Vector2(position.x, position.y)
              ) < PARAMETER_BREATHING_ROOM
            );
          // @ts-ignore
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
          case "Euler":
          case "Quaternion": {
            if (param.position) {
              return (
                param.position.distanceTo(position) < PARAMETER_BREATHING_ROOM
              );
            } else {
              console.warn(
                `Parameter ${param.name} of type ${param.type} is missing position for overlap check.`
              );
              return false;
            }
          }
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
  parameters: ScenarioParameter[],
  isInvoker: boolean = false,
  isReturn: boolean = false
): string {
  const existingColors = new Set(
    parameters.map((param) => param.representation.color)
  );
  if (isInvoker) return "green";
  if (isReturn) return "#ff00ff";
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
export function valueToMatrix4(
  value: ValueType,
  matrix: Matrix4,
  type: ValueTypeName,
  position?: Vector3
): void {
  switch (type) {
    case "Matrix4":
      matrix.copy(value as Matrix4);
      return;
    case "Matrix3":
      (value as Matrix3).getNormalMatrix(matrix);
      return;
    case "Vector3":
      const vec = value as Vector3;
      matrix.makeTranslation(vec.x, vec.y, vec.z);
      return;
    case "Vector2":
      const vec2 = value as Vector2;
      matrix.makeTranslation(vec2.x, 0, vec2.y);
      return;
    // @ts-ignore
    case "Vector4":
      const vec4 = value as Vector4;
      matrix.makeTranslation(vec4.x, vec4.y, vec4.z);
      return;
    case "Quaternion":
      matrix.makeRotationFromQuaternion(value as Quaternion);
      matrix.setPosition(position || new Vector3(0, 0, 0));
      return;
    case "Euler":
      matrix.makeRotationFromEuler(value as Euler);
      matrix.setPosition(position || new Vector3(0, 0, 0));
      return;
    // @ts-ignore
    case "Number":
      const num = value as number;
      matrix.setPosition(position || new Vector3(0, 0, 0));
      matrix.makeTranslation(num, 0, 0);
      return;
    // @ts-ignore
    case "Boolean":
      const boolNum = (value as boolean) ? 1 : 0;
      matrix.setPosition(position || new Vector3(0, 0, 0));
      matrix.makeTranslation(boolNum, 0, 0);
      return;
    default:
      throw new Error(`Unsupported value type for matrix conversion: ${type}`);
  }
}

export function matrix4ToValue(
  matrix: Matrix4,
  value: ValueType,
  type: ValueTypeName,
  position?: Vector3
): ValueType {
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
      const pos3 = new Vector3().setFromMatrixPosition(matrix);
      vec2.set(pos3.x, pos3.z);
      return vec2;
    // @ts-ignore
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
    // @ts-ignore
    case "Number":
      const posNum = new Vector3().setFromMatrixPosition(matrix);
      return posNum.x;
    // @ts-ignore
    case "Boolean":
      const posBool = new Vector3().setFromMatrixPosition(matrix);
      return posBool.x !== 0;
    default:
      throw new Error(`Unsupported value type for matrix conversion: ${type}`);
  }
}

export function computeScenarioEquation(scenario: MathScenario) {
  try {
    // Building the list of parameters to pass to the function
    const params = scenario.parameters.map((p) => {
      if (!p.isMutated) return p.value;

      // If the parameter is mutated, we dont want the visualized parameter to move.
      // So we trigger the function with a clone of it.
      // Tthis tertiary handles most common three.js types with clone or copy methods.
      return p.value.clone
        ? p.value.clone()
        : p.value.copy
        ? new p.value.constructor().copy(p.value)
        : new p.value.constructor(p.value);
    });

    // Handling invoker type and mutation
    // If there are no invoker, then it's a pure function
    let invoker = scenario.invoker?.value;
    // If the invoker is mutated, we create a clone to avoid moving the visualized invoker
    if (invoker && scenario.invoker?.isMutated) {
      // To gain performance, we will use the result value as invoker.
      if (scenario.result.value != null) {
        invoker = scenario.result.value;
        invoker.copy ? invoker.copy(scenario.invoker.value) : null;
      } else {
        // The first time, the result is null, so we clone the invoker value.
        invoker = scenario.invoker.value.clone
          ? scenario.invoker.value.clone()
          : scenario.invoker.value.copy
          ? new scenario.invoker.value.constructor().copy(
              scenario.invoker.value
            )
          : new scenario.invoker.value.constructor(scenario.invoker.value);
      }
    }

    const equationName = scenario.equation;
    let method;
    if (invoker != null) {
      // Method called on an object
      method = (invoker as any)[equationName];
    } else {
      // Any standalone function can be called this way
      method = (window as any)[equationName];
    }

    if (typeof method === "function") {
      scenario.result.value = method.apply(invoker, params);
    } else {
      throw new Error(`Method ${equationName} not found on invoker`);
    }
  } catch (e) {
    console.error("Error computing result:", e);
  }
}
