import { create } from "zustand";
import type {
  EquationExecutionMode,
  MathScenario,
  ScenarioParameter,
} from "../types";

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
  scenarios: Map<string, MathScenario>;
  currentScenarioId: string | null;

  addScenario: (scenario: MathScenario) => void;
  removeScenario: (scenarioId: string) => void;
  updateScenario: (scenarioId: string, updatedFields: Partial<MathScenario>) => void;
  setCurrentScenario: (scenarioId: string | null) => void;
  getCurrentScenario: () => MathScenario | null;
  getScenario: (scenarioId: string) => MathScenario | undefined;

  addParameter: (scenarioId: string, parameter: ScenarioParameter) => void;
  removeParameter: (scenarioId: string, parameterId: string) => void;
  updateParameter: (
    scenarioId: string,
    parameterId: string,
    updatedFields: Partial<ScenarioParameter>
  ) => void;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  scenarios: new Map(),
  currentScenarioId: null,
  addScenario: (scenario) =>
    set((state) => ({
      scenarios: new Map(state.scenarios).set(scenario.id, scenario),
    })),
  removeScenario: (scenarioId) =>
    set((state) => {
      const newScenarios = new Map(state.scenarios);
      newScenarios.delete(scenarioId);
      return { scenarios: newScenarios };
    }),
  updateScenario: (scenarioId, updatedFields) =>
    set((state) => {
      const scenario = state.scenarios.get(scenarioId);
      if (!scenario) throw new Error("Scenario not found");
      const updatedScenario = { ...scenario, ...updatedFields };
      return {
        scenarios: new Map(state.scenarios).set(scenarioId, updatedScenario),
      };
    }),
  setCurrentScenario: (scenarioId) => set({ currentScenarioId: scenarioId }),
  getCurrentScenario: () => {
    const { currentScenarioId, scenarios } = get();
    if (!currentScenarioId) return null;
    return scenarios.get(currentScenarioId) || null;
  },
  getScenario: (scenarioId) => get().scenarios.get(scenarioId), 
  addParameter: (scenarioId, parameter) =>
    set((state) => {
      const scenario = state.scenarios.get(scenarioId);
      if (!scenario) throw new Error("Scenario not found");
      const updatedScenario = {
        ...scenario,
        parameters: [...scenario.parameters, parameter],
      };
      return {
        scenarios: new Map(state.scenarios).set(scenarioId, updatedScenario),
      };
    }),
  removeParameter: (scenarioId, parameterId) =>
    set((state) => {
      const scenario = state.scenarios.get(scenarioId);
      if (!scenario) throw new Error("Scenario not found");
      const updatedScenario = {
        ...scenario,
        parameters: scenario.parameters.filter((p) => p.id !== parameterId),
      };
      return {
        scenarios: new Map(state.scenarios).set(scenarioId, updatedScenario),
      };
    }),
  updateParameter: (scenarioId, parameterId, updatedFields) =>
    set((state) => {
      const scenario = state.scenarios.get(scenarioId);
      if (!scenario) throw new Error("Scenario not found");
      const updatedParameters = scenario.parameters.map((p) =>
        p.id === parameterId ? { ...p, ...updatedFields } : p
      );
      const updatedScenario = {
        ...scenario,
        parameters: updatedParameters,
      };
      return {
        scenarios: new Map(state.scenarios).set(scenarioId, updatedScenario),
      };
    }),
}));
