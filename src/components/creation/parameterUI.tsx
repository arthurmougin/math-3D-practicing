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
import { ValueTypeName, type RepresentationType } from "../../types";
import { useState } from "react";
import { useScenarioStore } from "../../stores/scenarioStore";
import {
  getParameterValues,
  parameterValueToMathType,
  getDefaultParameterValues,
  type ParameterValue,
} from "../../utils/parameterValues";

export function ParameterUI({
  scenarioId,
  parameterId,
}: {
  scenarioId: string;
  parameterId: string;
}) {
  const scenarioStore = useScenarioStore();
  const param = scenarioStore
    .getScenario(scenarioId)
    ?.parameters.find((param) => param.id === parameterId);

  if (!param) return null;

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
  const handleUpdateParameterValue = (
    parameterId: string,
    paramValue: ParameterValue
  ): void => {
    if (!scenarioId) return;

    const newValue = parameterValueToMathType(paramValue);
    scenarioStore.updateParameter(scenarioId, parameterId, { value: newValue });
  };

  const onChangeParameter = (type: ValueTypeName, paramId: string) => {
    // Change type with default values
    const defaults = getDefaultParameterValues();
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

  const paramValues = getParameterValues(param);

  return (
    <Card key={param.id} borderWidth={1} borderColor={colors.border}>
      <CardHeader
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        padding={8}
      >
        <Container flexGrow={1} flexDirection="row" gap={8} alignItems="center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleParamCollapse(param.id)}
            paddingX={4}
          >
            {collapsedParams.has(param.id) ? <ChevronRight /> : <ChevronDown />}
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
              {(["cube", "vertex"] as RepresentationType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={
                    param.representation.type === type ? "default" : "outline"
                  }
                  onClick={() =>
                    scenarioId &&
                    scenarioStore.updateParameter(scenarioId, param.id, {
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
              ))}
            </Container>
          </Container>

          {/* Color */}
          <Container flexDirection="column" gap={8}>
            <Label>
              <Text>Color (hex)</Text>
            </Label>
            <Container flexDirection="row" gap={8} alignItems="center">
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
                    scenarioStore.updateParameter(scenarioId, param.id, {
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
            <Container flexDirection="row" gap={8} flexWrap="wrap">
              {Object.values(ValueTypeName).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={paramValues.type === type ? "default" : "outline"}
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
                        <Text fontSize={11} color={colors.mutedForeground}>
                          {labels[index]}
                        </Text>
                        <Input
                          value={String(value ?? 0)}
                          onValueChange={(inputValue) => {
                            paramValues.list[index] =
                              parseFloat(inputValue) || 0;
                            handleUpdateParameterValue(param.id, paramValues);
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
                          <Text fontSize={10} color={colors.mutedForeground}>
                            [{row},{col}]
                          </Text>
                          <Input
                            value={String(matrixValues[index])}
                            onValueChange={(value) => {
                              paramValues.list[index] = parseFloat(value) || 0;
                              handleUpdateParameterValue(param.id, paramValues);
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
}
