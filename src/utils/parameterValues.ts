import { Euler, Matrix4, Quaternion, Vector2, Vector3, Vector4 } from "three";
import type { ValueType, ValueTypeName, ScenarioParameter } from "../types";
import { Matrix3 } from "three";

/**
 * Structure representing parameter values for UI display and editing
 */
export type ParameterValue = {
  type: ValueTypeName;
  list: number[];
  order?: "XYZ" | "YZX" | "ZXY" | "XZY" | "YXZ" | "ZYX";
};

/**
 * Extracts readable values from a parameter for UI display
 * Converts complex math types to simple number arrays
 * 
 * @param param - The parameter to extract values from
 * @returns A ParameterValue object with type and numeric values
 * 
 * @example
 * ```ts
 * const param = { value: new Vector3(1, 2, 3), ... };
 * const values = getParameterValues(param);
 * // Returns: { type: "Vector3", list: [1, 2, 3] }
 * ```
 */
export function getParameterValues(param: ScenarioParameter): ParameterValue {
  const value = param.value;

  if (value instanceof Vector3) {
    return {
      type: "Vector3" as ValueTypeName,
      list: [value.x, value.y, value.z],
    };
  } else if (value instanceof Quaternion) {
    return {
      type: "Quaternion" as ValueTypeName,
      list: [value.x, value.y, value.z, value.w],
    };
  } else if (value instanceof Euler) {
    return {
      type: "Euler" as ValueTypeName,
      list: [value.x, value.y, value.z],
      order: value.order,
    };
  } else if (value instanceof Matrix4) {
    return { type: "Matrix4" as ValueTypeName, list: value.toArray() };
  } else if (typeof value === "number") {
    return { type: "number" as ValueTypeName, list: [value] };
  }
  return { type: "number" as ValueTypeName, list: [0] };
}

/**
 * Converts ParameterValue back to appropriate valueType
 * 
 * @param paramValue - The parameter value to convert
 * @returns A Three.js math object or number
 * 
 * @example
 * ```ts
 * const value = parameterValueToMathType({
 *   type: "Vector3",
 *   list: [1, 2, 3]
 * });
 * // Returns: Vector3(1, 2, 3)
 * ```
 */
export function parameterValueToMathType(
  paramValue: ParameterValue
): ValueType {
  const { type, list, order } = paramValue;

  switch (type) {
    case "Vector3":
      return new Vector3(...(list.length === 3 ? (list as [number, number, number]) : [0, 0, 0]));
    case "Quaternion":
      return new Quaternion(...(list.length === 4 ? (list as [number, number, number, number]) : [0, 0, 0, 1]));
    case "Euler":
      return new Euler(
        list?.[0] ?? 0,
        list?.[1] ?? 0,
        list?.[2] ?? 0,
        order ?? "XYZ"
      );
    case "Matrix4":
      if (list.length === 16) {
        return new Matrix4().fromArray(list);
      }
      return new Matrix4();
    case "number":
      return list[0] ?? 0;
    default:
      return 0;
  }
}

/**
 * Gets default values for each parameter type
 * Useful when creating new parameters or changing types
 * 
 * @returns Record mapping parameter types to their default values
 */
export function getDefaultParameterValues(): Record<ValueTypeName, ValueType> {
  return {
  Matrix4: new Matrix4(),
  Matrix3: new Matrix3(),
  Quaternion: new Quaternion(0, 0, 0, 1),
  Euler: new Euler(0, 0, 0),
  Vector4: new Vector4(0, 0, 0, 0),
  Vector3: new Vector3(0, 0, 0),
  Vector2: new Vector2(0, 0),
  number: 0,
};
}
