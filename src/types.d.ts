import type { Euler, Matrix4, Quaternion, Vector3 } from "three";

/**
 * Enhanced equation database (NEW FORMAT)
 */
export interface EnhancedEquationDatabase {
  version: string;
  generatedAt: string;
  source: string;
  methods: EquationSignature[];
}

/** Code for the whole codebase */

/**
 * Possible value types for parameters and results
 */
export type ValueType =
  | Vector3
  | Vector2
  | Vector4
  | Quaternion
  | Euler
  | Matrix4
  | Matrix3
  | number;

/**
 * Names of possible value types
 */
export enum ValueTypeName {
  Vector3 = "Vector3",
  Vector2 = "Vector2",
  Vector4 = "Vector4",
  Quaternion = "Quaternion",
  Euler = "Euler",
  Matrix4 = "Matrix4",
  Matrix3 = "Matrix3",
  number = "number",
} 

export type ClassNames = Exclude<ValueTypeName, "number"> | "MathUtils";

/**
 * Types of representations for parameters and results
 */ export type RepresentationType = "vertex" | "cube"; //TODO | 'mesh' | 'line' | 'plane' ;

/**
 * Representation details for parameters and results
 */
export interface ParameterRepresentation {
  type: RepresentationType;
  color: string;
}

/**
 * Scenario parameter definition
 */
export interface ScenarioParameter extends EquationParameter {
  id: string;
  value: ValueType;
  representation: ParameterRepresentation;
}

export interface ScenarioResult {
  value: ValueType;
  type: ValueTypeName;
  representation: ParameterRepresentation;
  description?: string;
}

export interface MathScenario {
  id: string;
  title: string;
  description: string;
  // If the methode is called by a particular object (like a Vector3), it is stored here
  invoker: ScenarioParameter | null;
  tags: string[];
  parameters: ScenarioParameter[];
  equation: string; // Function name or description (e.g., "applyQuaternion", "multiplyMatrices")
  result: ScenarioResult;
  timelineProgress: number; // 0 to 1 for lerp visualization
}


/**
 * Method parameter from source analysis
 */
export interface EquationParameter {
  name: string;
  type: ValueTypeName;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Method type classification
 */
export type EquationType = "calculation" | "transformation" | "mutation";

/**
 * Method signature with documentation (NEW FORMAT)
 */
export interface EquationSignature {
  className: ClassNames;
  methodName: string;
  description: string;
  parameters: EquationParameter[];
  returnType: ValueTypeName;
  returnDescription?: string;
  example?: string;
  EquationType: EquationType;
  mutatesThis: boolean;
}

export interface CameraState {
  target: THREE.Vector3;
  setTarget: (target: THREE.Vector3) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
