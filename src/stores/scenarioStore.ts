import { create } from "zustand";
import type {
  valueType,
  MathScenario,
  EquationSignature,
  ScenarioParameter,
  ScenarioValue,
} from "../types";
import { Vector3, Euler, Quaternion, Matrix4 } from "three";
import { EqualIcon } from "@react-three/uikit-lucide";

function mapEquationParamToScenario(param: {
  name: string;
  type: string;
}): ScenarioParameter {
  let value: valueType = 0;

  switch (param.type) {
    case "Vector3":
      value = new Vector3(1, 0, 0);
      break;
    case "Euler":
      value = new Euler(0, 0, 0);
      break;
    case "Quaternion":
      value = new Quaternion(0, 0, 0, 1);
      break;
    case "Matrix4":
      value = new Matrix4().identity();
      break;
    case "number":
      value = 0;
      break;
  }
  return {
    id: `${param.name}`,
    name: param.name,
    value,
    representation: {
      type: "vertex",
      color: "#ffffff",
    },
  };
}

interface ScenarioStore {
  scenarios: Map<string, MathScenario>;
  currentScenarioId: string | null;

  addScenario: (scenario: MathScenario) => void;
  removeScenario: (scenarioId: string) => void;
  updateScenario: (
    scenarioId: string,
    updatedFields: Partial<MathScenario>
  ) => void;
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

  addScenarioUsingMethod: (EquationSignature: EquationSignature) => void;

  computeresult: (scenario: MathScenario) => ScenarioValue;
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
  addScenarioUsingMethod: (equationSignature: EquationSignature) => {
    // Implementation for adding a scenario using a method signature

    const parameters: MathScenario["parameters"] = [];
    for (let i = 0; i < equationSignature.parameters.length; i++) {
      const param = mapEquationParamToScenario(equationSignature.parameters[i]);
      parameters.push(param);
    }

    let invoker = null;
    if (equationSignature.className !== "MathUtils") {
      invoker = mapEquationParamToScenario({
        name: equationSignature.className,
        type: equationSignature.className,
      });
    }

    const newUnComputedScenario: Partial<MathScenario> = {
      id: crypto.randomUUID(),
      title: `Scenario for ${equationSignature.methodName}`,
      tags: [
        equationSignature.className,
        equationSignature.returnType,
        equationSignature.mutatesThis ? "transformation" : "calculation",
      ],
      description: equationSignature.description || "",
      equation: equationSignature.methodName,
      parameters,
      invoker,
      result: undefined,
      timelineProgress: 0,
    };

    const newScenario: MathScenario = {
      ...newUnComputedScenario,
      result: get().computeresult(newUnComputedScenario as MathScenario),
    } as MathScenario;

    get().addScenario(newScenario);
    get().setCurrentScenario(newScenario.id);
  },
  computeresult: (scenario: MathScenario) => {
    try {
      const params = scenario.parameters.map((p) => p.value);
      const invoker = scenario.invoker ? scenario.invoker.value : null;
      const equationName = scenario.equation;

      let resultValue: valueType = null;

      let method;
      if (invoker) {
        // Method called on an object
        method = (invoker as any)[equationName];
      } else {
        // Any standalone function can be called this way
        method = (window as any)[equationName];
      }

      if (typeof method === "function") {
        resultValue = method.apply(invoker, params);
      } else {
        throw new Error(`Method ${equationName} not found on invoker`);
      }
      return resultValue;
    } catch (e) {
      console.error("Error computing result:", e);
      return null;
    }
  },
}));
