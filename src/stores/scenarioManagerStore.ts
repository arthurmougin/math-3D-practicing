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
  computeScenarioEquation,
  findNonOverlappingColor,
  findNonOverlappingName,
  findNonOverlappingPosition,
} from "../utils/parameterHelpers";
import { Matrix3 } from "three";
import { useIndividualScenarioStore } from "./individualScenarioStore";

export function mapEquationParamToScenario(
  param: EquationParameter,
  allParams: ScenarioParameter[]
): ScenarioParameter {
  let value: ValueType = 0;
  let position = undefined;
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
      position = findNonOverlappingPosition(allParams);
      break;
    case "Quaternion":
      position = findNonOverlappingPosition(allParams);
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
    // @ts-ignore
    case "Number":
      position = findNonOverlappingPosition(allParams);
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
    position,
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
    // @ts-ignore
    case "Number":
      return {
        type: "cube",
        color,
      };
    default:
      throw new Error(`unImplemented parameter type: ${type}`);
  }
}

interface ScenarioManagerStore {
  scenarios: Map<string, MathScenario>;
  addScenario: (scenario: MathScenario) => void;
  removeScenario: (scenarioId: string) => void;
  setCurrentScenario: (scenarioId: string | null) => void;
  getScenario: (scenarioId: string) => MathScenario | undefined;
  addScenarioUsingMethod: (EquationSignature: EquationSignature) => void;
}

export const useScenarioManagerStore = create<ScenarioManagerStore>(
  (set, get) => ({
    scenarios: new Map(),
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
    setCurrentScenario: (scenarioId) => {
      useIndividualScenarioStore().setScenario(
        scenarioId ? get().scenarios.get(scenarioId) || null : null
      );
    },
    getScenario: (scenarioId) => get().scenarios.get(scenarioId),
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

      const tagsFromTypeKeys = Object.keys(
        equationSignature.equationType
      ).filter((key) => (equationSignature.equationType as any)[key] === true);

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
      useIndividualScenarioStore.getState().setScenario(newScenario);
    },
  })
);
