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
import { useEffect, useRef, useState } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  useScenarioStore,
  type MathDataType,
  type RepresentationType,
  type ScenarioParameter,
} from "../../stores/scenarioStore";
import { ParameterCard } from "./parameterCard";
import type { ParameterType, ParameterValues } from "./types";

/**
 * Predefined list of parameter names to cycle through
 */
const PARAMETER_NAMES = [
  "Alpha",
  "Beta",
  "Gamma",
  "Delta",
  "Epsilon",
  "Zeta",
  "Theta",
  "Lambda",
  "Sigma",
  "Omega",
];

/**
 * Predefined list of colors to cycle through
 */
const PARAMETER_COLORS = [
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ff8800", // Orange
  "#8800ff", // Purple
  "#00ff88", // Teal
  "#ff0088", // Pink
];

/**
 * Find a non-overlapping position for a new parameter
 * Parameters are considered to have a size of 1x1x1
 * Positions are kept close to origin (max 5 parameters expected)
 * @param existingParameters - Array of existing parameters with Vector3 values
 * @returns A Vector3 position that doesn't overlap with existing parameters
 */
function findNonOverlappingPosition(
  existingParameters: ScenarioParameter[]
): Vector3 {
  const MIN_DISTANCE = 1.1; // Minimum distance between parameter centers
  const SPACING = 1.5; // Compact spacing between positions

  // Extract existing positions (only from Vector3 parameters)
  const existingPositions = existingParameters
    .map((p) => p.value)
    .filter((v): v is Vector3 => v instanceof Vector3);

  // Start with origin if no parameters exist
  if (existingPositions.length === 0) {
    return new Vector3(0, 0, 0);
  }

  // Predefined positions close to origin for up to 8 parameters
  const predefinedPositions = [
    new Vector3(0, 0, 0), // First parameter at origin
    new Vector3(SPACING, 0, 0), // Second on X axis
    new Vector3(0, SPACING, 0), // Third on Y axis
    new Vector3(0, 0, SPACING), // Fourth on Z axis
    new Vector3(SPACING, SPACING, 0), // Fifth diagonal XY
    new Vector3(SPACING, 0, SPACING), // Sixth diagonal XZ
    new Vector3(0, SPACING, SPACING), // Seventh diagonal YZ
    new Vector3(SPACING, SPACING, SPACING), // Eighth corner
  ];

  // Try predefined positions first
  for (const candidate of predefinedPositions) {
    const isFarEnough = existingPositions.every((existing) => {
      return candidate.distanceTo(existing) >= MIN_DISTANCE;
    });

    if (isFarEnough) {
      return candidate.clone();
    }
  }

  // Fallback: place it on the x-axis
  return new Vector3((existingPositions.length + 1) * SPACING, 0, 0);
}

/**
 * Helper to extract readable values from a parameter for the UI
 */
function getParameterValues(param: ScenarioParameter): ParameterValues {
  const value = param.value;

  if (value instanceof Vector3) {
    return {
      type: "Vector3" as ParameterType,
      x: value.x,
      y: value.y,
      z: value.z,
    };
  } else if (value instanceof Quaternion) {
    return {
      type: "Quaternion" as ParameterType,
      x: value.x,
      y: value.y,
      z: value.z,
      w: value.w,
    };
  } else if (value instanceof Euler) {
    return {
      type: "Euler" as ParameterType,
      x: value.x,
      y: value.y,
      z: value.z,
      order: value.order,
    };
  } else if (value instanceof Matrix4) {
    return { type: "Matrix4" as ParameterType, matrixValues: value.toArray() };
  } else if (typeof value === "number") {
    return { type: "number" as ParameterType, value };
  }

  return { type: "number" as ParameterType, value: 0 };
}

/**
 * UI for creating and editing math scenarios
 * Works directly with the store - creates a temporary scenario on mount
 */
export function ScenarioCreator() {
  const addScenario = useScenarioStore((state) => state.addScenario);
  const removeScenario = useScenarioStore((state) => state.removeScenario);
  const updateScenario = useScenarioStore((state) => state.updateScenario);
  const setCurrentScenario = useScenarioStore(
    (state) => state.setCurrentScenario
  );
  const addParameter = useScenarioStore((state) => state.addParameter);
  const removeParameter = useScenarioStore((state) => state.removeParameter);
  const updateParameter = useScenarioStore((state) => state.updateParameter);

  // Subscribe to the current scenario so the component re-renders when it changes
  const currentScenario = useScenarioStore((state) => {
    const currentId = state.currentScenarioId;
    if (!currentId) return null;
    return state.scenarios.find((s) => s.id === currentId);
  });

  const [tempScenarioId, setTempScenarioId] = useState<string | null>(null);
  const savedRef = useRef(false);
  const [collapsedParams, setCollapsedParams] = useState<Set<string>>(
    new Set()
  );
  const [editingField, setEditingField] = useState<{
    type: string;
    value: string;
  } | null>(null);

  // Create temporary scenario on mount
  useEffect(() => {
    const tempId = `temp-${Date.now()}`;
    const tempScenario = {
      id: tempId,
      title: "New Scenario",
      description: "",
      tags: [],
      parameters: [],
      equation: "",
      answer: {
        value: 0,
        representation: {
          type: "vertex" as RepresentationType,
          color: "#ffff00",
        },
      },
      timelineProgress: 0,
    };

    addScenario(tempScenario);
    setCurrentScenario(tempId);
    setTempScenarioId(tempId);

    return () => {
      if (!savedRef.current && tempId) {
        removeScenario(tempId);
        setCurrentScenario(null);
      }
    };
  }, [addScenario, removeScenario, setCurrentScenario]);

  const toggleParamCollapse = (id: string) => {
    setCollapsedParams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddParameter = () => {
    if (!tempScenarioId || !currentScenario) return;

    // Get index for cycling through names and colors
    const paramCount = currentScenario.parameters.length;
    const name = PARAMETER_NAMES[paramCount % PARAMETER_NAMES.length];
    const color = PARAMETER_COLORS[paramCount % PARAMETER_COLORS.length];

    // Find a non-overlapping position
    const position = findNonOverlappingPosition(currentScenario.parameters);

    const newParam: ScenarioParameter = {
      id: `param-${Date.now()}`,
      name,
      value: position,
      representation: { type: "cube", color },
    };

    addParameter(tempScenarioId, newParam);
  };

  const handleRemoveParameter = (parameterId: string) => {
    if (!tempScenarioId) return;
    removeParameter(tempScenarioId, parameterId);
  };

  const handleUpdateParameterValue = (
    parameterId: string,
    type: ParameterType,
    values: {
      x?: number;
      y?: number;
      z?: number;
      w?: number;
      value?: number;
      order?: string;
      matrixValues?: number[];
    }
  ) => {
    if (!tempScenarioId) return;

    let newValue: MathDataType;

    switch (type) {
      case "Vector3":
        newValue = new Vector3(values.x ?? 0, values.y ?? 0, values.z ?? 0);
        break;
      case "Quaternion":
        newValue = new Quaternion(
          values.x ?? 0,
          values.y ?? 0,
          values.z ?? 0,
          values.w ?? 1
        );
        break;
      case "Euler":
        newValue = new Euler(
          values.x ?? 0,
          values.y ?? 0,
          values.z ?? 0,
          (values.order as "XYZ" | "YZX" | "ZXY" | "XZY" | "YXZ" | "ZYX") ??
            "XYZ"
        );
        break;
      case "Matrix4":
        newValue = new Matrix4();
        if (values.matrixValues && values.matrixValues.length === 16) {
          newValue.fromArray(values.matrixValues);
        }
        break;
      case "number":
        newValue = values.value ?? 0;
        break;
      default:
        newValue = new Vector3();
    }

    updateParameter(tempScenarioId, parameterId, { value: newValue });
  };

  const handleCreateScenario = () => {
    if (!currentScenario) return;

    if (currentScenario.parameters.length === 0) {
      setEditingField({
        type: "error",
        value: "Please add at least one parameter",
      });
      setTimeout(() => setEditingField(null), 3000);
      return;
    }

    savedRef.current = true;

    // Create new temp scenario for next creation
    const newTempId = `temp-${Date.now()}`;
    const newTempScenario = {
      id: newTempId,
      title: "New Scenario",
      description: "",
      tags: [],
      parameters: [],
      equation: "",
      answer: {
        value: 0,
        representation: {
          type: "vertex" as RepresentationType,
          color: "#ffff00",
        },
      },
      timelineProgress: 0,
    };

    addScenario(newTempScenario);
    setCurrentScenario(newTempId);
    setTempScenarioId(newTempId);
    savedRef.current = false;
  };

  /**
   * Cancel scenario creation and remove it from the store
   */
  const handleCancel = () => {
    if (tempScenarioId) {
      removeScenario(tempScenarioId);
      setCurrentScenario(null);
    }
  };

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
        positionTop={20}
        positionLeft={20}
        width={400}
        height="90vh"
        flexDirection="column"
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
                  updateScenario(tempScenarioId, { title: value })
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
                  updateScenario(tempScenarioId, { description: value })
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
                  updateScenario(tempScenarioId, { equation: value })
                }
                placeholder="e.g., add, multiply"
              />
            </Container>

            <Separator marginY={8} />

            {/* Parameters */}
            <Container flexDirection="column" gap={8}>
              <Container
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize={16} fontWeight="bold">
                  Parameters ({currentScenario.parameters.length})
                </Text>
                <Button onClick={handleAddParameter} size="sm">
                  <Text>+ Add Parameter</Text>
                </Button>
              </Container>

              {currentScenario.parameters.map((param) => {
                const paramValues = getParameterValues(param);

                return (
                  <ParameterCard
                    key={param.id}
                    param={param}
                    paramValues={paramValues}
                    isCollapsed={collapsedParams.has(param.id)}
                    onToggleCollapse={() => toggleParamCollapse(param.id)}
                    onNameChange={(name) =>
                      tempScenarioId &&
                      updateParameter(tempScenarioId, param.id, { name })
                    }
                    onRepresentationChange={(type) =>
                      tempScenarioId &&
                      updateParameter(tempScenarioId, param.id, {
                        representation: { ...param.representation, type },
                      })
                    }
                    onColorChange={(color) =>
                      tempScenarioId &&
                      updateParameter(tempScenarioId, param.id, {
                        representation: { ...param.representation, color },
                      })
                    }
                    onTypeChange={(value) =>
                      tempScenarioId &&
                      updateParameter(tempScenarioId, param.id, { value })
                    }
                    onValueChange={(values) =>
                      handleUpdateParameterValue(param.id, values.type, values)
                    }
                    onMatrixChange={(matrix) =>
                      handleUpdateParameterValue(param.id, "Matrix4", {
                        matrixValues: matrix,
                      })
                    }
                    onRemove={() => handleRemoveParameter(param.id)}
                  />
                );
              })}
            </Container>
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
