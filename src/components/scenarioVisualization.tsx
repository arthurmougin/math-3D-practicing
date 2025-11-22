import { Suspense } from "react";
import { useScenarioStore } from "../stores/scenarioStore";
import { Result } from "./result";
import { Parameter } from "./parameter";

interface ScenarioVisualizationProps {
  showresult?: boolean; // Whether to show the result
  resultOpacity?: number; // Opacity of the result (useful for showing expected result)
}

/**
 * Visualizes the current active scenario with all its parameters and result
 * Automatically syncs with the scenario store
 */
export function ScenarioVisualization({
  showresult = true,
  resultOpacity = 0.3,
}: ScenarioVisualizationProps) {
  const currentScenario = useScenarioStore((state) =>
    state.getCurrentScenario()
  );

  // No scenario selected
  if (!currentScenario) {
    return null;
  }

  const { parameters, result } = currentScenario;

  return (
    <group name="scenario-visualization">
      {/* Render all parameters */}
      {parameters.map((parameter) => (
        <Suspense key={parameter.id} fallback={null}>
          <Parameter key={parameter.id} parameter={parameter} />
        </Suspense>
      ))}

      {/* Render result if enabled */}
      {showresult && result && <Result result={result} opacity={resultOpacity} />}
    </group>
  );
}
