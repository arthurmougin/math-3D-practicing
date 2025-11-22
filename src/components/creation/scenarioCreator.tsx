import { Container, Text } from "@react-three/uikit";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Label,
  Separator,
} from "@react-three/uikit-default";
import { useEffect, useState } from "react";
import {
  ValueTypeName,
  type MathScenario,
  type RepresentationType,
} from "../../types.d";
import { useScenarioStore } from "../../stores/scenarioStore";
import { useCameraStore } from "../../stores/cameraStore";
import { ParameterListUI } from "./parameterListUI";
import { useCameraControlHandlers } from "../../utils/cameraControl";

const tempScenario : MathScenario = {
  id: `temp-${Date.now()}`,
  title: "New Scenario",
  description: "",
  tags: [],
  parameters: [],
  equation: "",
  invoker: null,
  result: {
    value: 0,
    type: ValueTypeName.number,
    representation: {
      type: "vertex" as RepresentationType,
      color: "#ffff00",
    },
  },
  timelineProgress: 0,
};

/**
 * UI for creating and editing math scenarios
 * Works directly with the store - creates a temporary scenario on mount
 */
export function ScenarioCreator() {
  const scenarioStore = useScenarioStore();
  const cameraStore = useCameraStore();

  const [tempScenarioId, setTempScenarioId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{
    type: string;
    value: string;
  } | null>(null);

 useEffect(() => {
    console.log("Mounting ScenarioCreator");
    scenarioStore.addScenario(tempScenario);
    scenarioStore.setCurrentScenario(tempScenario.id);
    setTempScenarioId(tempScenario.id);
    return () => { 
      console.log("Unmounting ScenarioCreator")
     }
  }, []);

  const handleCreateScenario = () => {
    cameraStore.setEnabled(true);
    const currentScenario = scenarioStore.getCurrentScenario();
    if (!currentScenario) return;

    if (currentScenario.parameters.length === 0) {
      setEditingField({
        type: "error",
        value: "Please add at least one parameter",
      });
      setTimeout(() => setEditingField(null), 3000);
      return;
    }
  };

  /**
   * Cancel scenario creation and remove it from the store
   */
  const handleCancel = () => {
    cameraStore.setEnabled(true);
    if (tempScenarioId) {
      scenarioStore.removeScenario(tempScenarioId);
      scenarioStore.setCurrentScenario(null);
    }
  };

  const { disableCameraControl, enableCameraControl } = useCameraControlHandlers();

  const currentScenario = scenarioStore.getCurrentScenario();

  if (!currentScenario) return null;

  return (
    <>
      {editingField?.type === "error" && (
        <Alert
          positionType="absolute"
          positionTop={20}
          positionRight={20}
          width={300}
        >
          <AlertDescription>
            <Text>{editingField.value}</Text>
          </AlertDescription>
        </Alert>
      )}

      <Card
        positionType="absolute"
        id="test"
        positionTop={20}
        positionLeft={20}
        width={400}
        height="90vh"
        flexDirection="column"
        onPointerEnter={disableCameraControl}
        onPointerLeave={enableCameraControl}
      >
        <CardHeader flexShrink={0}>
          <Text fontSize={20} fontWeight="bold">
            Create Scenario
          </Text>
        </CardHeader>

        <Container flexGrow={1} overflow="scroll" flexDirection="column">
          <CardContent flexDirection="column" gap={16} flexShrink={0}>
            {/* Title */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Title</Text>
              </Label>
              <Input
                value={currentScenario.title}
                onValueChange={(value) =>
                  tempScenarioId &&
                  scenarioStore.updateScenario(tempScenarioId, { title: value })
                }
                placeholder="Enter scenario title"
              />
            </Container>

            {/* Description */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Description</Text>
              </Label>
              <Input
                value={currentScenario.description}
                onValueChange={(value) =>
                  tempScenarioId &&
                  scenarioStore.updateScenario(tempScenarioId, { description: value })
                }
                placeholder="Enter scenario description"
              />
            </Container>

            {/* Equation */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Equation (method name)</Text>
              </Label>
              <Input
                value={currentScenario.equation}
                onValueChange={(value) =>
                  tempScenarioId &&
                  scenarioStore.updateScenario(tempScenarioId, { equation: value })
                }
                placeholder="e.g., add, multiply"
              />
            </Container>

            <Separator marginY={8} />

            <ParameterListUI scenarioId={currentScenario.id} />
          </CardContent>
        </Container>

        <CardFooter flexShrink={0} gap={8}>
          <Button onClick={handleCancel} variant="outline" flexGrow={1}>
            <Text>Cancel</Text>
          </Button>
          <Button onClick={handleCreateScenario} flexGrow={1}>
            <Text>Create Scenario</Text>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
