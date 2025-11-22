import { Container, Text } from "@react-three/uikit";
import {
  Button,
} from "@react-three/uikit-default";
import {
  ValueTypeName,
  type ScenarioParameter,
} from "../../types";
import { useScenarioStore } from "../../stores/scenarioStore";
import { PARAMETER_COLORS } from "../../constants/parameters";
import {
  findNonOverlappingPosition,
  findNonOverlappingName,
} from "../../utils/parameterHelpers";
import { ParameterUI } from "./parameterUI";

export function ParameterListUI({ scenarioId }: { scenarioId: string }) {
  const scenarioStore = useScenarioStore();
  const parameters = scenarioStore.getScenario(scenarioId)?.parameters || [];

  const handleAddParameter = () => {
    if (!scenarioId) return;

    const paramCount = parameters.length ?? 0;
    const color = PARAMETER_COLORS[paramCount % PARAMETER_COLORS.length];

    const newParam: ScenarioParameter = {
      id: `param-${Date.now()}`,
      name: findNonOverlappingName(parameters),
      type: ValueTypeName.Vector3,
      optional: false,
      value: findNonOverlappingPosition(parameters),
      representation: { type: "cube", color },
    };

    scenarioStore.addParameter(scenarioId, newParam);
  };

  return (
    <>
      <Container flexDirection="column" gap={8}>
        <Container
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize={16} fontWeight="bold">
            Parameters (
            {parameters.length ?? 0})
          </Text>
          <Button onClick={handleAddParameter} size="sm">
            <Text>+ Add Parameter</Text>
          </Button>
        </Container>

        {parameters.map((param: ScenarioParameter) => {
            return (
              <ParameterUI parameterId={param.id} scenarioId={scenarioId} />
            );
          })}
      </Container>
      ;
    </>
  );
}
