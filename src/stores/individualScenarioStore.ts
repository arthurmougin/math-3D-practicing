import { create } from "zustand";
import type { MathScenario } from "../../types/types";
import { computeScenarioEquation } from "../utils/parameterHelpers";

export interface ScenarioStore {
  scenario: MathScenario | null;
  setScenario: (scenario: MathScenario | null) => void;
  clearScenario: () => void;
  updateParameter: (
    parameterId: string,
    updatedFields: Partial<MathScenario["parameters"][0]>
  ) => void;
}

export const useIndividualScenarioStore = create<ScenarioStore>((set) => ({
  scenario: null,
  setScenario: (scenario) => set({ scenario }),
  clearScenario: () => set({ scenario: null }),
  updateParameter: (parameterId, updatedFields) =>
    set((state) => {
      if (!state.scenario) {
        throw new Error("Scenario not found");
      }
      const updatedParameters = state.scenario.parameters.map((p) =>
        p.id === parameterId ? { ...p, ...updatedFields } : p
      );
      const updatedScenario = {
        ...state.scenario,
        parameters: updatedParameters,
      };

      // Recompute the scenario result after parameter update
      computeScenarioEquation(updatedScenario);

      return {
        scenario: updatedScenario,
      };
    }),
}));
