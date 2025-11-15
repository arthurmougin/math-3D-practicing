import type { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { create } from "zustand";

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

/**
 * Helper function to validate if two values have matching types
 */
function typesMatch(value1: unknown, value2: unknown): boolean {
  // Check for primitive number types
  if (typeof value1 === "number" && typeof value2 === "number") {
    return true;
  }

  // Check for arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return true;
  }

  // Check for objects with same constructor
  if (
    value1 &&
    value2 &&
    typeof value1 === "object" &&
    typeof value2 === "object" &&
    (value1 as object).constructor === (value2 as object).constructor
  ) {
    return true;
  }

  return false;
}

export interface EquationExecutionMode {
  type: "instance" | "static";
  callerParameterId?: string; // For instance methods, the parameter that owns the method
  callerParameterName?: string;
  argumentParameterIds?: string[]; // The other parameters used as arguments
}

/**
 * Validates if a scenario's equation is valid:
 * 1. Checks if the equation exists as a method on at least one parameter (instance method)
 * 2. Validates that the number of arguments matches the available parameters (excluding the calling object)
 * 3. Tests the method execution with actual parameter values
 * 4. Verifies that the return type matches the expected answer type
 *
 * @param scenario - The math scenario to validate
 * @returns An object with `isValid` boolean, optional `error` message, and `executionMode` if valid
 *
 * @example
 * // Valid scenario: vector1.add(vector2)
 * const result = validateScenarioEquation({
 *   equation: "add",
 *   parameters: [
 *     { id: "1", value: new Vector3(1, 0, 0), ... },
 *     { id: "2", value: new Vector3(0, 1, 0), ... }
 *   ],
 *   answer: { value: new Vector3(1, 1, 0), ... }
 * });
 * // result: { isValid: true, executionMode: { type: "instance", callerParameterId: "1", ... } }
 */
export function validateScenarioEquation(scenario: MathScenario): {
  isValid: boolean;
  error?: string;
  executionMode?: EquationExecutionMode;
} {
  const { equation, parameters, answer } = scenario;

  // Try to find the method on one of the parameters (instance method)
  for (const param of parameters) {
    const value = param.value;

    // Skip non-object values or arrays
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    // Check if this parameter has the equation as a method
    if (!(equation in value)) {
      continue;
    }

    const method = (value as unknown as Record<string, unknown>)[equation];

    // Skip if it's not a function
    if (typeof method !== "function") {
      continue;
    }

    // Instance method found: validate it
    const otherParams = parameters.filter((p) => p.id !== param.id);
    const methodFunc = method as (...args: unknown[]) => unknown;
    const expectedArgCount = methodFunc.length;

    // Check argument count
    if (expectedArgCount !== otherParams.length) {
      continue; // Try next parameter
    }

    // Test execution with other parameters as arguments
    try {
      const argValues = otherParams.map((p) => p.value);
      const result = methodFunc.call(value, ...argValues);

      // Validate return type matches answer type
      if (typesMatch(result, answer.value)) {
        return {
          isValid: true,
          executionMode: {
            type: "instance",
            callerParameterId: param.id,
            callerParameterName: param.name,
            argumentParameterIds: otherParams.map((p) => p.id),
          },
        };
      }

      // Type mismatch, continue to try next parameter
      continue;
    } catch {
      // Execution error, continue to try next parameter
      continue;
    }
  }

  // TODO: Check for static methods on Three.js classes
  // This would require async handling or synchronous imports

  // No valid method found
  return {
    isValid: false,
    error: `Method "${equation}" not found or validation failed on all parameters`,
  };
}

interface ScenarioStore {
  scenarios: MathScenario[];
  currentScenarioId: string | null;

  addScenario: (scenario: MathScenario) => void;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, updates: Partial<MathScenario>) => void;
  setCurrentScenario: (id: string | null) => void;
  getCurrentScenario: () => MathScenario | undefined;
  updateTimelineProgress: (id: string, progress: number) => void;
  updateCurrentScenarioParameter: (
    parameterId: string,
    updates: Partial<ScenarioParameter>
  ) => void;

  // Parameter management functions
  addParameter: (scenarioId: string, parameter: ScenarioParameter) => void;
  removeParameter: (scenarioId: string, parameterId: string) => void;
  updateParameter: (
    scenarioId: string,
    parameterId: string,
    updates: Partial<ScenarioParameter>
  ) => void;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  scenarios: [],
  currentScenarioId: null,

  addScenario: (scenario) =>
    set((state) => ({
      scenarios: [...state.scenarios, scenario],
    })),

  removeScenario: (id) =>
    set((state) => ({
      scenarios: state.scenarios.filter((s) => s.id !== id),
      currentScenarioId:
        state.currentScenarioId === id ? null : state.currentScenarioId,
    })),

  updateScenario: (id, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  setCurrentScenario: (id) => set({ currentScenarioId: id }),

  getCurrentScenario: () => {
    const { scenarios, currentScenarioId } = get();
    return scenarios.find((s) => s.id === currentScenarioId);
  },

  updateTimelineProgress: (id, progress) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === id
          ? { ...s, timelineProgress: Math.max(0, Math.min(1, progress)) }
          : s
      ),
    })),

  updateCurrentScenarioParameter: (parameterId, updates) =>
    set((state) => {
      if (!state.currentScenarioId) return state;

      return {
        scenarios: state.scenarios.map((s) =>
          s.id === state.currentScenarioId
            ? {
                ...s,
                parameters: s.parameters.map((p) =>
                  p.id === parameterId ? { ...p, ...updates } : p
                ),
              }
            : s
        ),
      };
    }),

  addParameter: (scenarioId, parameter) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId
          ? { ...s, parameters: [...s.parameters, parameter] }
          : s
      ),
    })),

  removeParameter: (scenarioId, parameterId) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              parameters: s.parameters.filter((p) => p.id !== parameterId),
            }
          : s
      ),
    })),

  updateParameter: (scenarioId, parameterId, updates) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) =>
        s.id === scenarioId
          ? {
              ...s,
              parameters: s.parameters.map((p) =>
                p.id === parameterId ? { ...p, ...updates } : p
              ),
            }
          : s
      ),
    })),
}));
