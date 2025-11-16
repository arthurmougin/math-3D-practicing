import { Container, Text } from "@react-three/uikit";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  colors,
  Input,
  Label,
} from "@react-three/uikit-default";
import { ChevronDown, ChevronRight, Trash2 } from "@react-three/uikit-lucide";
import type {
  MathDataType,
  ParameterType,
  RepresentationType,
  ScenarioParameter,
} from "../../types";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { useState } from "react";
import { useScenarioStore } from "../../stores/scenarioStore";

/**
 * Predefined list of parameter names to cycle through
 */


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
 * Helper to extract readable values from a parameter for the UI
 */

type ParameterValue = {
  type: ParameterType;
  list: number[];
  order?: "XYZ" | "YZX" | "ZXY" | "XZY" | "YXZ" | "ZYX";
};

function findNonOverlappingPosition(parameters: ScenarioParameter[]): Vector3 {
  const SPACING = 1.5; // Compact spacing between positions
  const breathingRoom = 1.1; // min space between parameters
  let shift = 0;

  do {
    // Predefined positions close to origin for up to 8 parameters
    const predefinedPositions = [
      [0 + shift, 0, 0], // First parameter at origin
      [SPACING + shift, 0, 0], // Second on X axis
      [0 + shift, SPACING, 0], // Third on Y axis
      [0 + shift, 0, SPACING], // Fourth on Z axis
      [SPACING + shift, SPACING, 0], // Fifth diagonal XY
      [SPACING + shift, 0, SPACING], // Sixth diagonal XZ
      [0 + shift, SPACING, SPACING], // Seventh diagonal YZ
      [SPACING + shift, SPACING, SPACING], // Eighth corner
    ];
    for (let pos of predefinedPositions) {
      const position = new Vector3(...pos);
      const overlapping = parameters.some((param) => {
        if (param.value instanceof Vector3) {
          return param.value.distanceTo(position) < breathingRoom;
        }
        return false;
      });
      if (!overlapping) {
        return position;
      }
    }

    shift += 3; // Increase spacing and try again
  } while (true);
}

function findNonOverlappingName(Parameters : ScenarioParameter[]): string {
  const existingNames = new Set(Parameters.map((param) => param.name));
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
  let increment = 0;
  do
  {
    for (let name of PARAMETER_NAMES) {
      if (increment > 0) {
        name = `${name} (${increment})`;
      }
      if (!existingNames.has(name)) {
        return name;
      }
    }
    increment++;
  } while (true);

}

function getParameterValues(param: ScenarioParameter): ParameterValue {
  const value = param.value;

  if (value instanceof Vector3) {
    return {
      type: "Vector3" as ParameterType,
      list: [value.x, value.y, value.z],
    };
  } else if (value instanceof Quaternion) {
    return {
      type: "Quaternion" as ParameterType,
      list: [value.x, value.y, value.z, value.w],
    };
  } else if (value instanceof Euler) {
    return {
      type: "Euler" as ParameterType,
      list: [value.x, value.y, value.z],
      order: value.order,
    };
  } else if (value instanceof Matrix4) {
    return { type: "Matrix4" as ParameterType, list: value.toArray() };
  } else if (typeof value === "number") {
    return { type: "number" as ParameterType, list: [value] };
  }
  return { type: "number" as ParameterType, list: [0] };
}

export function ParameterUI({ scenarioId }: { scenarioId: string }) {
  const scenarioStore = useScenarioStore();
  const parameters = scenarioStore.getScenario(scenarioId)?.parameters || [];
  const parameterTypes: ParameterType[] = [
    "Vector3",
    "Euler",
    "Quaternion",
    "Matrix4",
    "number",
  ];

  const [collapsedParams, setCollapsedParams] = useState<Set<string>>(
    new Set()
  );

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
    if (!scenarioId) return;

    const paramCount = parameters.length ?? 0;
    const color = PARAMETER_COLORS[paramCount % PARAMETER_COLORS.length];

    const newParam: ScenarioParameter = {
      id: `param-${Date.now()}`,
      name: findNonOverlappingName(parameters),
      value: findNonOverlappingPosition(parameters),
      representation: { type: "cube", color },
    };

    scenarioStore.addParameter(scenarioId, newParam);
  };

  const onChangeParameter = (type: ParameterType, paramId: string) => {
    // Change type with default values
    const defaults: Record<ParameterType, MathDataType> = {
      Vector3: new Vector3(0, 0, 0),
      Euler: new Euler(0, 0, 0),
      Quaternion: new Quaternion(0, 0, 0, 1),
      Matrix4: new Matrix4(),
      number: 0,
    };
    if (scenarioId) {
      scenarioStore.updateParameter(scenarioId, paramId, {
        value: defaults[type],
      });
    }
  };

  const handleRemoveParameter = (parameterId: string) => {
    if (!scenarioId) return;
    scenarioStore.removeParameter(scenarioId, parameterId);
  };

  const handleUpdateParameterValue = (
    parameterId: string,
    { type, list, order }: ParameterValue
  ): void => {
    if (!scenarioId) return;

    let newValue: MathDataType;

    switch (type) {
      case "Vector3":
        newValue = new Vector3(...(list.length === 3 ? list : [0, 0, 0]));
        break;
      case "Quaternion":
        newValue = new Quaternion(...(list.length === 4 ? list : [0, 0, 0, 1]));
        break;
      case "Euler":
        newValue = new Euler(
          list?.[0] ?? 0,
          list?.[1] ?? 0,
          list?.[2] ?? 0,
          order ?? "XYZ"
        );
        break;
      case "Matrix4":
        newValue = new Matrix4();
        if (list && list.length === 16) {
          newValue.fromArray(list);
        }
        break;
      case "number":
        newValue = list?.[0] ?? 0;
        break;
      default:
        newValue = new Vector3();
    }

    scenarioStore.updateParameter(scenarioId, parameterId, { value: newValue });
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
            const paramValues = getParameterValues(param);

            return (
              <Card key={param.id} borderWidth={1} borderColor={colors.border}>
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
                        scenarioId &&
                        scenarioStore.updateParameter(scenarioId, param.id, {
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
                                scenarioId &&
                                scenarioStore.updateParameter(
                                  scenarioId,
                                  param.id,
                                  {
                                    representation: {
                                      ...param.representation,
                                      type,
                                    },
                                  }
                                )
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
                              scenarioId &&
                              scenarioStore.updateParameter(
                                scenarioId,
                                param.id,
                                {
                                  representation: {
                                    ...param.representation,
                                    color: value,
                                  },
                                }
                              )
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
                        {parameterTypes.map((type) => (
                          <Button
                            key={type}
                            size="sm"
                            variant={
                              paramValues.type === type ? "default" : "outline"
                            }
                            onClick={() => onChangeParameter(type, param.id)}
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
                          {paramValues.list
                            .slice(0, paramValues.type === "Quaternion" ? 4 : 3)
                            .map((value, index) => {
                              const labels = ["X", "Y", "Z", "W"];
                              return (
                                <Container
                                  key={index}
                                  flexGrow={1}
                                  flexDirection="column"
                                  gap={2}
                                >
                                  <Text
                                    fontSize={11}
                                    color={colors.mutedForeground}
                                  >
                                    {labels[index]}
                                  </Text>
                                  <Input
                                    value={String(value ?? 0)}
                                    onValueChange={(inputValue) => {
                                      paramValues.list[index] =
                                        parseFloat(inputValue) || 0;
                                      handleUpdateParameterValue(
                                        param.id,
                                        paramValues
                                      );
                                    }}
                                  />
                                </Container>
                              );
                            })}
                        </Container>
                      </Container>
                    )}

                    {paramValues.type === "number" && (
                      <Container flexDirection="column" gap={8}>
                        <Label>
                          <Text>Value</Text>
                        </Label>
                        <Input
                          value={String(paramValues.list?.[0] ?? 0)}
                          onValueChange={(value) => {
                            paramValues.list[0] = parseFloat(value) || 0;
                            handleUpdateParameterValue(param.id, paramValues);
                          }}
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
                            <Container key={row} flexDirection="row" gap={4}>
                              {[0, 1, 2, 3].map((col) => {
                                const index = col * 4 + row;
                                const matrixValues =
                                  paramValues.list || Array(16).fill(0);
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
                                      value={String(matrixValues[index])}
                                      onValueChange={(value) => {
                                        paramValues.list[index] =
                                          parseFloat(value) || 0;
                                        handleUpdateParameterValue(
                                          param.id,
                                          paramValues
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
      ;
    </>
  );
}
