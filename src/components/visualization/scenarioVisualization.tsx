import { Suspense } from "react";
import { useScenarioStore } from "../../stores/scenarioStore";
import { Result } from "./result";
import { Parameter } from "./parameter";
/**
 * TODO List of all types of representation to implement
 * - Position (free vertex for vector2, vector3)
 *     - on 1 or more axes
 *     - possibly with arrows (for offsets)
 *     - possibly normalized (for direction vectors )
 * - Rotation (axes with rotation ?) 
 *     - on 1 or more axes
 * - Scale
 *     - on 1 or more axes
 * - Position + rotation (free rotating vertex for normals)
 * - Full transform (matrix) box
 * - Projection ?
 * - Non geometric values ?
 *    - float, int, interpolation factors (0-1) ?
 */

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
