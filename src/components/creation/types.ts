export type ParameterType =
  | "Vector3"
  | "Euler"
  | "Quaternion"
  | "Matrix4"
  | "number";

export interface ParameterValues {
  type: ParameterType;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
  value?: number;
  order?: string;
  matrixValues?: number[];
}
