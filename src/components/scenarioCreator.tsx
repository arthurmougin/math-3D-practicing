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
import { useState } from "react";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  useScenarioStore,
  type MathDataType,
  type MathScenario,
  type RepresentationType,
  type ScenarioParameter,
} from "../stores/scenarioStore";

type ParameterType = "Vector3" | "Quaternion" | "Matrix4" | "Euler" | "number";

interface ParameterDraft {
  id: string;
  name: string;
  type: ParameterType;
  representationType: RepresentationType;
  color: string;
  // Type-specific values
  x?: number;
  y?: number;
  z?: number;
  w?: number;
  value?: number;
  order?: string;
  matrixValues?: number[]; // 16 values for Matrix4
}

/**
 * UI for creating and editing math scenarios
 * Built with @react-three/uikit for in-scene interface
 */
export function ScenarioCreator() {
  const addScenario = useScenarioStore((state) => state.addScenario);
  const setCurrentScenario = useScenarioStore(
    (state) => state.setCurrentScenario
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [equation, setEquation] = useState("");
  const [parameters, setParameters] = useState<ParameterDraft[]>([]);
  const [collapsedParams, setCollapsedParams] = useState<Set<string>>(
    new Set()
  );
  const [editingField, setEditingField] = useState<{
    type: string;
    paramId?: string;
    field?: string;
    value: string;
  } | null>(null);

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

  const addParameter = () => {
    const newParam: ParameterDraft = {
      id: `param-${Date.now()}`,
      name: "New Parameter",
      type: "Vector3",
      representationType: "cube",
      color: "#ff0000",
      x: 0,
      y: 0,
      z: 0,
    };
    setParameters([...parameters, newParam]);
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter((p) => p.id !== id));
  };

  const updateParameter = (id: string, updates: Partial<ParameterDraft>) => {
    setParameters(
      parameters.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const convertParameterToScenarioParameter = (
    draft: ParameterDraft
  ): ScenarioParameter => {
    let value: MathDataType;

    switch (draft.type) {
      case "Vector3":
        value = new Vector3(draft.x ?? 0, draft.y ?? 0, draft.z ?? 0);
        break;
      case "Quaternion":
        value = new Quaternion(
          draft.x ?? 0,
          draft.y ?? 0,
          draft.z ?? 0,
          draft.w ?? 1
        );
        break;
      case "Euler":
        value = new Euler(
          draft.x ?? 0,
          draft.y ?? 0,
          draft.z ?? 0,
          (draft.order as "XYZ" | "YZX" | "ZXY" | "XZY" | "YXZ" | "ZYX") ??
            "XYZ"
        );
        break;
      case "Matrix4":
        value = new Matrix4();
        if (draft.matrixValues && draft.matrixValues.length === 16) {
          value.fromArray(draft.matrixValues);
        }
        break;
      case "number":
        value = draft.value ?? 0;
        break;
      default:
        value = new Vector3();
    }

    return {
      id: draft.id,
      name: draft.name,
      value,
      representation: {
        type: draft.representationType,
        color: draft.color,
      },
    };
  };

  const handleCreateScenario = () => {
    if (parameters.length === 0) {
      // Show error in UI instead of alert
      setEditingField({
        type: "error",
        value: "Please add at least one parameter",
      });
      setTimeout(() => setEditingField(null), 3000);
      return;
    }

    const scenarioParams = parameters.map(convertParameterToScenarioParameter);

    // Default answer (first parameter for now)
    const defaultAnswer = scenarioParams[0];

    const scenario: MathScenario = {
      id: `scenario-${Date.now()}`,
      title: title || "New Scenario",
      description: description || "A math scenario",
      tags: [],
      parameters: scenarioParams,
      equation: equation || "add",
      answer: {
        value: defaultAnswer.value,
        representation: {
          type: "vertex",
          color: "#ffff00",
        },
      },
      timelineProgress: 0,
    };

    addScenario(scenario);
    setCurrentScenario(scenario.id);

    // Reset form
    setTitle("");
    setDescription("");
    setEquation("");
    setParameters([]);
  };

  return (
    <>
      {/* Error/Success Message */}
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

      {/* Main Form */}
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
            {/* Title Input */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Title</Text>
              </Label>
              <Input
                value={title}
                onValueChange={setTitle}
                placeholder="Enter scenario title"
              />
            </Container>

            {/* Description Input */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Description</Text>
              </Label>
              <Input
                value={description}
                onValueChange={setDescription}
                placeholder="Enter scenario description"
              />
            </Container>

            {/* Equation Input */}
            <Container flexDirection="column" gap={4}>
              <Label>
                <Text>Equation (method name)</Text>
              </Label>
              <Input
                value={equation}
                onValueChange={setEquation}
                placeholder="e.g., add, multiply"
              />
            </Container>

            <Separator marginY={8} />

            {/* Parameters Section */}
            <Container flexDirection="column" gap={8}>
              <Container
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize={16} fontWeight="bold">
                  Parameters ({parameters.length})
                </Text>
                <Button onClick={addParameter} size="sm">
                  <Text>+ Add Parameter</Text>
                </Button>
              </Container>

              {/* Parameter List */}
              {parameters.map((param) => (
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
                          updateParameter(param.id, { name: value })
                        }
                        placeholder="Parameter name"
                      />
                    </Container>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeParameter(param.id)}
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
                                  param.representationType === type
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  updateParameter(param.id, {
                                    representationType: type,
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
                            backgroundColor={param.color}
                            borderRadius={6}
                            borderWidth={2}
                            borderColor={colors.border}
                          />
                          <Container flexGrow={1}>
                            <Input
                              value={param.color}
                              onValueChange={(value) =>
                                updateParameter(param.id, { color: value })
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
                        <Container flexDirection="row" gap={8} flexWrap="wrap">
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
                                param.type === type ? "default" : "outline"
                              }
                              onClick={() =>
                                updateParameter(param.id, { type })
                              }
                            >
                              <Text fontSize={11}>{type}</Text>
                            </Button>
                          ))}
                        </Container>
                      </Container>

                      {/* Type-specific values */}
                      {(param.type === "Vector3" ||
                        param.type === "Quaternion" ||
                        param.type === "Euler") && (
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
                                value={String(param.x ?? 0)}
                                onValueChange={(value) =>
                                  updateParameter(param.id, {
                                    x: parseFloat(value) || 0,
                                  })
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
                                value={String(param.y ?? 0)}
                                onValueChange={(value) =>
                                  updateParameter(param.id, {
                                    y: parseFloat(value) || 0,
                                  })
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
                                value={String(param.z ?? 0)}
                                onValueChange={(value) =>
                                  updateParameter(param.id, {
                                    z: parseFloat(value) || 0,
                                  })
                                }
                              />
                            </Container>
                            {param.type === "Quaternion" && (
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
                                  value={String(param.w ?? 1)}
                                  onValueChange={(value) =>
                                    updateParameter(param.id, {
                                      w: parseFloat(value) || 1,
                                    })
                                  }
                                />
                              </Container>
                            )}
                          </Container>
                        </Container>
                      )}

                      {param.type === "number" && (
                        <Container flexDirection="column" gap={8}>
                          <Label>
                            <Text>Value</Text>
                          </Label>
                          <Input
                            type="number"
                            value={String(param.value ?? 0)}
                            onValueChange={(value) =>
                              updateParameter(param.id, {
                                value: parseFloat(value) || 0,
                              })
                            }
                          />
                        </Container>
                      )}

                      {param.type === "Matrix4" && (
                        <Container flexDirection="column" gap={8}>
                          <Label>
                            <Text>Matrix Values (4x4)</Text>
                          </Label>
                          <Container flexDirection="column" gap={4}>
                            {[0, 1, 2, 3].map((row) => (
                              <Container key={row} flexDirection="row" gap={4}>
                                {[0, 1, 2, 3].map((col) => {
                                  const index = col * 4 + row;
                                  const matrixValues = param.matrixValues || [
                                    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                                    1,
                                  ];
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
                                          updateParameter(param.id, {
                                            matrixValues: newMatrix,
                                          });
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
              ))}
            </Container>
          </CardContent>
        </Container>

        {/* Create Button */}
        <CardFooter flexShrink={0}>
          <Button onClick={handleCreateScenario} width="100%">
            <Text>Create Scenario</Text>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
