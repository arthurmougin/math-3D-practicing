import { create } from "zustand";
import type {
  ValueType,
  MathScenario,
  EquationSignature,
  ScenarioParameter,
  ValueTypeName,
  ParameterRepresentation,
  EquationParameter,
} from "../../types/types";
import { Euler, Quaternion, Matrix4, Vector2, Vector4 } from "three";
import {
  findNonOverlappingColor,
  findNonOverlappingName,
  findNonOverlappingPosition,
} from "../utils/parameterHelpers";
import { Matrix3 } from "three";

//findNonOverlappingName
//findNonOverlappingPosition

export function mapEquationParamToScenario(
  param: EquationParameter,
  allParams: ScenarioParameter[]
): ScenarioParameter {
  let value: ValueType = 0;
  let newPosition;

  switch (param.type) {
    case "Vector3":
      value = findNonOverlappingPosition(allParams);
      break;
    case "Vector2":
      newPosition = findNonOverlappingPosition(allParams);
      value = new Vector2(newPosition.x, newPosition.y);
      break;
    // @ts-ignore
    case "Vector4":
      newPosition = findNonOverlappingPosition(allParams);
      value = new Vector4(newPosition.x, newPosition.y, newPosition.z, 0);
      break;
    case "Euler":
      value = new Euler();
      break;
    case "Quaternion":
      value = new Quaternion().identity();
      break;
    case "Matrix4":
      value = new Matrix4().makeTranslation(
        findNonOverlappingPosition(allParams)
      );
      break;
    case "Matrix3":
      const m4 = new Matrix4().makeTranslation(
        findNonOverlappingPosition(allParams)
      );
      value = new Matrix3().setFromMatrix4(m4);
      break;
    case "Number":
      value = 0;
      break;
    default:
      throw new Error(`unImplemented parameter type: ${param.type}`);
  }
  return {
    id: `${param.name}`,
    name:
      findNonOverlappingName(allParams) +
      (param.name !== "" ? " (" + param.name + ")" : ""),
    type: param.type,
    value,
    optional: param.optional,
    representation: generateRepresentationFromType(param.type, allParams),
    isMutated: param.isMutated,
  };
}

export function generateRepresentationFromType(
  type: ValueTypeName,
  allParams: ScenarioParameter[]
): ParameterRepresentation {
  if (!type) {
    throw new Error("Type is required to generate ScenarioResult");
  }
  const color = findNonOverlappingColor(allParams);

  switch (type) {
    // @ts-ignore
    case "Vector4":
      return {
        type: "vertex",
        color,
      };
    case "Vector3":
      return {
        type: "vertex",
        color,
      };
    case "Vector2":
      return {
        type: "vertex",
        color,
      };
    case "Euler":
      return {
        type: "cube",
        color,
      };
    case "Quaternion":
      return {
        type: "cube",
        color,
      };
    case "Matrix4":
      return {
        type: "cube",
        color,
      };
    case "Matrix3":
      return {
        type: "cube",
        color,
      };
    case "Number":
      return {
        type: "cube",
        color,
      };
    default:
      throw new Error(`unImplemented parameter type: ${type}`);
  }
}
/*    //TODO : Handle non-cloneable values
    const params = scenario.parameters.map((p) => {
      return p.value.clone
        ? p.value.clone()
        : p.value.copy
        ? new p.value.constructor().copy(p.value)
        : p.value;
    });
    let invoker;
    if (scenario?.invoker && scenario.invoker?.isMutated) {
      invoker = scenario.invoker.value.clone
        ? scenario.invoker.value.clone()
        : scenario.invoker.value.copy
        ? new scenario.invoker.value.constructor().copy(scenario.invoker.value)
        : scenario.invoker.value;
    } else {
      invoker = scenario.invoker ? scenario.invoker.value : null;
    }*/

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

  //addParameter: (scenarioId: string, parameter: ScenarioParameter) => void;
  //removeParameter: (scenarioId: string, parameterId: string) => void;
  updateParameter: (
    scenarioId: string,
    parameterId: string,
    updatedFields: Partial<ScenarioParameter>
  ) => void;

  addScenarioUsingMethod: (EquationSignature: EquationSignature) => void;
}

export const useScenarioStore = create<ScenarioStore>((set, get) => ({
  scenarios: new Map(),
  currentScenarioId: null,
  addScenario: (scenario) =>
    set((state) => {
      computeScenarioEquation(scenario);
      return {
        scenarios: new Map(state.scenarios).set(scenario.id, scenario),
      };
    }),
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

      computeScenarioEquation(updatedScenario);
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
  /*
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
  */
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

      // Recompute the scenario result after parameter update
      computeScenarioEquation(updatedScenario);

      return {
        scenarios: new Map(state.scenarios).set(scenarioId, updatedScenario),
      };
    }),
  addScenarioUsingMethod: (equationSignature: EquationSignature) => {
    // Implementation for adding a scenario using a method signature

    const parameters: MathScenario["parameters"] = [];
    let invoker = null;
    if (
      !equationSignature.equationType.isStatic &&
      equationSignature.className !== "MathUtils"
    ) {
      invoker = mapEquationParamToScenario(
        {
          name: "This",
          type: equationSignature.className,
          optional: false,
          isMutated: equationSignature.equationType.isMutatingInvoker,
        },
        parameters
      );
    }

    for (let i = 0; i < equationSignature.parameters.length; i++) {
      const param = mapEquationParamToScenario(
        equationSignature.parameters[i],
        parameters.concat(invoker ? [invoker] : [])
      );
      parameters.push(param);
    }

    const result = {
      value: null,
      type: equationSignature.returnType,
      representation: generateRepresentationFromType(
        equationSignature.returnType,
        parameters.concat(invoker ? [invoker] : [])
      ),
    };

    const tagsFromTypeKeys = Object.keys(equationSignature.equationType).filter(
      (key) => (equationSignature.equationType as any)[key] === true
    );

    const newScenario: MathScenario = {
      id: crypto.randomUUID(),
      title: `Scenario for ${equationSignature.methodName}`,
      tags: [
        equationSignature.className,
        equationSignature.returnType,
        ...tagsFromTypeKeys,
      ],
      description: equationSignature.description || "",
      equation: equationSignature.methodName,
      parameters,
      invoker,
      result,
      timelineProgress: 0,
    };

    computeScenarioEquation(newScenario);
    get().addScenario(newScenario);
    get().setCurrentScenario(newScenario.id);
  },
}));
