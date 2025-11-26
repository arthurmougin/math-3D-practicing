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
// TODO : Add strings very useful for euler
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
 // Vector4 = "Vector4", // Vector4 type is currently not supported due to unclear mathematical representation implementation
  Quaternion = "Quaternion",
  Euler = "Euler",
  Matrix4 = "Matrix4",
  Matrix3 = "Matrix3",
  Number = "Number",
  Boolean = "Boolean",
} 

export type ClassNames = "MathUtils" | Exclude<ValueTypeName, "Number">;
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
  isMutated: boolean;
}

/**
 * Method type classification
 */
export interface EquationType {
  isStatic: boolean; // true for static methods (e.g., MathUtils), false for instance methods
  isMutatingInvoker: boolean; // true if the method mutates the instance (this), false otherwise
  isMutatingParameter: boolean; // true if the method mutates any of its parameters, false otherwise
  isReturningInstance: boolean; // true if the method returns the instance (this), false otherwise
  isPureFunction: boolean; // true if the method does not mutate any input and returns a new value, false otherwise
};

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
  equationType: EquationType;
}

export interface CameraState {
  target: THREE.Vector3;
  setTarget: (target: THREE.Vector3) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
