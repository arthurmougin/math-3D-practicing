import type { Euler, Matrix4, Quaternion, Vector3 } from "three";


export type ParameterType = "Vector3" | "Euler" | "Quaternion" | "Matrix4" | "number";


export type MathDataType =
  | Vector3
  | Quaternion
  | Matrix4
  | Euler
  | number[]
  | number;

export type RepresentationType = "vertex" | "cube"; //TODO | 'mesh' | 'line' | 'plane' ;

export interface ParameterRepresentation {
  type: RepresentationType;
  color: string;
}

export interface ScenarioParameter {
  id: string;
  name: string;
  value: MathDataType;
  representation: ParameterRepresentation;
}

export interface ScenarioAnswer {
  value: MathDataType;
  representation: ParameterRepresentation;
}

export interface MathScenario {
  id: string;
  title: string;
  description: string;
  tags: string[];
  parameters: ScenarioParameter[];
  equation: string; // Function name or description (e.g., "applyQuaternion", "multiplyMatrices")
  answer: ScenarioAnswer;
  timelineProgress: number; // 0 to 1 for lerp visualization
}

export interface EquationExecutionMode {
  type: "instance" | "static";
  callerParameterId?: string; // For instance methods, the parameter that owns the method
  callerParameterName?: string;
  argumentParameterIds?: string[]; // The other parameters used as arguments
}


export interface CameraState {
  target: THREE.Vector3;
  setTarget: (target: THREE.Vector3) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
