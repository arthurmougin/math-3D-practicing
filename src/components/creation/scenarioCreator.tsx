import { Container, Text } from "@react-three/uikit";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  colors,
  Input,
  Label,
  Separator,
} from "@react-three/uikit-default";
import { ChevronDown, ChevronRight, Trash2 } from "@react-three/uikit-lucide";
import { useEffect, useRef, useState } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  useScenarioStore,
  type MathDataType,
  type RepresentationType,
  type ScenarioParameter,
} from "../stores/scenarioStore";

type ParameterType = "Vector3" | "Euler" | "Quaternion" | "Matrix4" | "number";

/**
 * Helper to extract readable values from a parameter for the UI
 */
function getParameterValues(param: ScenarioParameter) {
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
    if (!tempScenarioId) return;

    const newParam: ScenarioParameter = {
      id: `param-${Date.now()}`,
      name: "New Parameter",
      value: new Vector3(0, 0, 0),
      representation: { type: "cube", color: "#ff0000" },
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
                  <Card
                    key={param.id}
                    borderWidth={1}
                    borderColor={colors.border}
                  >
                    <CardHeader
                      flexDirection="row"
                      justifyContent="space-between"
                      alignItems="center"
                      padding={8}
                    >
                      <Container
                        flexGrow={1}
                        flexDirection="row"
                        gap={8}
                        alignItems="center"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleParamCollapse(param.id)}
                          paddingX={4}
                        >
                          {collapsedParams.has(param.id) ? (
                            <ChevronRight />
                          ) : (
                            <ChevronDown />
                          )}
                        </Button>
                        <Input
                          value={param.name}
                          onValueChange={(value) =>
                            tempScenarioId &&
                            updateParameter(tempScenarioId, param.id, {
                              name: value,
                            })
                          }
                          placeholder="Parameter name"
                        />
                      </Container>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveParameter(param.id)}
                      >
                        <Trash2 />
                      </Button>
                    </CardHeader>

                    {!collapsedParams.has(param.id) && (
                      <CardContent flexDirection="column" gap={16}>
                        {/* Representation Type */}
                        <Container flexDirection="column" gap={8}>
                          <Label>
                            <Text>Representation</Text>
                          </Label>
                          <Container flexDirection="row" gap={8}>
                            {(["cube", "vertex"] as RepresentationType[]).map(
                              (type) => (
                                <Button
                                  key={type}
                                  size="sm"
                                  variant={
                                    param.representation.type === type
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    tempScenarioId &&
                                    updateParameter(tempScenarioId, param.id, {
                                      representation: {
                                        ...param.representation,
                                        type,
                                      },
                                    })
                                  }
                                  flexGrow={1}
                                >
                                  <Text fontSize={11}>{type}</Text>
                                </Button>
                              )
                            )}
                          </Container>
                        </Container>

                        {/* Color */}
                        <Container flexDirection="column" gap={8}>
                          <Label>
                            <Text>Color (hex)</Text>
                          </Label>
                          <Container
                            flexDirection="row"
                            gap={8}
                            alignItems="center"
                          >
                            <Container
                              width={40}
                              height={40}
                              backgroundColor={param.representation.color}
                              borderRadius={6}
                              borderWidth={2}
                              borderColor={colors.border}
                            />
                            <Container flexGrow={1}>
                              <Input
                                value={param.representation.color}
                                onValueChange={(value) =>
                                  tempScenarioId &&
                                  updateParameter(tempScenarioId, param.id, {
                                    representation: {
                                      ...param.representation,
                                      color: value,
                                    },
                                  })
                                }
                                placeholder="#ff0000"
                              />
                            </Container>
                          </Container>
                        </Container>

                        {/* Type Selection */}
                        <Container flexDirection="column" gap={8}>
                          <Label>
                            <Text>Type</Text>
                          </Label>
                          <Container
                            flexDirection="row"
                            gap={8}
                            flexWrap="wrap"
                          >
                            {(
                              [
                                "Vector3",
                                "Euler",
                                "Quaternion",
                                "Matrix4",
                                "number",
                              ] as ParameterType[]
                            ).map((type) => (
                              <Button
                                key={type}
                                size="sm"
                                variant={
                                  paramValues.type === type
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => {
                                  // Change type with default values
                                  const defaults: Record<
                                    ParameterType,
                                    MathDataType
                                  > = {
                                    Vector3: new Vector3(0, 0, 0),
                                    Euler: new Euler(0, 0, 0),
                                    Quaternion: new Quaternion(0, 0, 0, 1),
                                    Matrix4: new Matrix4(),
                                    number: 0,
                                  };
                                  if (tempScenarioId) {
                                    updateParameter(tempScenarioId, param.id, {
                                      value: defaults[type],
                                    });
                                  }
                                }}
                              >
                                <Text fontSize={11}>{type}</Text>
                              </Button>
                            ))}
                          </Container>
                        </Container>

                        {/* Type-specific values */}
                        {(paramValues.type === "Vector3" ||
                          paramValues.type === "Quaternion" ||
                          paramValues.type === "Euler") && (
                          <Container flexDirection="column" gap={8}>
                            <Label>
                              <Text>Values</Text>
                            </Label>
                            <Container flexDirection="row" gap={8}>
                              <Container
                                flexGrow={1}
                                flexDirection="column"
                                gap={2}
                              >
                                <Text
                                  fontSize={11}
                                  color={colors.mutedForeground}
                                >
                                  X
                                </Text>
                                <Input
                                  type="number"
                                  value={String(paramValues.x ?? 0)}
                                  onValueChange={(value) =>
                                    handleUpdateParameterValue(
                                      param.id,
                                      paramValues.type,
                                      {
                                        ...paramValues,
                                        x: parseFloat(value) || 0,
                                      }
                                    )
                                  }
                                />
                              </Container>
                              <Container
                                flexGrow={1}
                                flexDirection="column"
                                gap={2}
                              >
                                <Text
                                  fontSize={11}
                                  color={colors.mutedForeground}
                                >
                                  Y
                                </Text>
                                <Input
                                  type="number"
                                  value={String(paramValues.y ?? 0)}
                                  onValueChange={(value) =>
                                    handleUpdateParameterValue(
                                      param.id,
                                      paramValues.type,
                                      {
                                        ...paramValues,
                                        y: parseFloat(value) || 0,
                                      }
                                    )
                                  }
                                />
                              </Container>
                              <Container
                                flexGrow={1}
                                flexDirection="column"
                                gap={2}
                              >
                                <Text
                                  fontSize={11}
                                  color={colors.mutedForeground}
                                >
                                  Z
                                </Text>
                                <Input
                                  type="number"
                                  value={String(paramValues.z ?? 0)}
                                  onValueChange={(value) =>
                                    handleUpdateParameterValue(
                                      param.id,
                                      paramValues.type,
                                      {
                                        ...paramValues,
                                        z: parseFloat(value) || 0,
                                      }
                                    )
                                  }
                                />
                              </Container>
                              {paramValues.type === "Quaternion" && (
                                <Container
                                  flexGrow={1}
                                  flexDirection="column"
                                  gap={2}
                                >
                                  <Text
                                    fontSize={11}
                                    color={colors.mutedForeground}
                                  >
                                    W
                                  </Text>
                                  <Input
                                    type="number"
                                    value={String(paramValues.w ?? 1)}
                                    onValueChange={(value) =>
                                      handleUpdateParameterValue(
                                        param.id,
                                        paramValues.type,
                                        {
                                          ...paramValues,
                                          w: parseFloat(value) || 1,
                                        }
                                      )
                                    }
                                  />
                                </Container>
                              )}
                            </Container>
                          </Container>
                        )}

                        {paramValues.type === "number" && (
                          <Container flexDirection="column" gap={8}>
                            <Label>
                              <Text>Value</Text>
                            </Label>
                            <Input
                              type="number"
                              value={String(paramValues.value ?? 0)}
                              onValueChange={(value) =>
                                handleUpdateParameterValue(
                                  param.id,
                                  paramValues.type,
                                  {
                                    value: parseFloat(value) || 0,
                                  }
                                )
                              }
                            />
                          </Container>
                        )}

                        {paramValues.type === "Matrix4" && (
                          <Container flexDirection="column" gap={8}>
                            <Label>
                              <Text>Matrix Values (4x4)</Text>
                            </Label>
                            <Container flexDirection="column" gap={4}>
                              {[0, 1, 2, 3].map((row) => (
                                <Container
                                  key={row}
                                  flexDirection="row"
                                  gap={4}
                                >
                                  {[0, 1, 2, 3].map((col) => {
                                    const index = col * 4 + row;
                                    const matrixValues =
                                      paramValues.matrixValues ||
                                      Array(16).fill(0);
                                    matrixValues[0] =
                                      matrixValues[5] =
                                      matrixValues[10] =
                                      matrixValues[15] =
                                        1;

                                    return (
                                      <Container
                                        key={col}
                                        flexGrow={1}
                                        flexDirection="column"
                                        gap={2}
                                      >
                                        <Text
                                          fontSize={10}
                                          color={colors.mutedForeground}
                                        >
                                          [{row},{col}]
                                        </Text>
                                        <Input
                                          type="number"
                                          value={String(matrixValues[index])}
                                          onValueChange={(value) => {
                                            const newMatrix = [...matrixValues];
                                            newMatrix[index] =
                                              parseFloat(value) || 0;
                                            handleUpdateParameterValue(
                                              param.id,
                                              "Matrix4",
                                              {
                                                matrixValues: newMatrix,
                                              }
                                            );
                                          }}
                                        />
                                      </Container>
                                    );
                                  })}
                                </Container>
                              ))}
                            </Container>
                          </Container>
                        )}
                      </CardContent>
                    )}
                  </Card>
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
