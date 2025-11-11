import { useScenarioStore } from "../stores/scenarioStore";
import { Answer } from "./answer";
import { Parameter } from "./parameter";

interface ScenarioVisualizationProps {
  showAnswer?: boolean; // Whether to show the answer
  answerOpacity?: number; // Opacity of the answer (useful for showing expected result)
}

/**
 * Visualizes the current active scenario with all its parameters and answer
 * Automatically syncs with the scenario store
 */
export function ScenarioVisualization({
  showAnswer = true,
  answerOpacity = 0.3,
}: ScenarioVisualizationProps) {
  const currentScenario = useScenarioStore((state) =>
    state.getCurrentScenario()
  );

  // No scenario selected
  if (!currentScenario) {
    return null;
  }

  const { parameters, answer } = currentScenario;

  return (
    <group name="scenario-visualization">
      {/* Render all parameters */}
      {parameters.map((parameter) => (
        <Parameter key={parameter.id} parameter={parameter} />
      ))}

      {/* Render answer if enabled */}
      {showAnswer && <Answer answer={answer} opacity={answerOpacity} />}
    </group>
  );
}
