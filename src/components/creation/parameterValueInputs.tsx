import { Container, Text } from "@react-three/uikit";
import { colors, Input, Label } from "@react-three/uikit-default";
import type { ParameterValues } from "./types";

interface ParameterValueInputsProps {
  paramValues: ParameterValues;
  onValueChange: (values: ParameterValues) => void;
}

export function ParameterValueInputs({
  paramValues,
  onValueChange,
}: ParameterValueInputsProps) {
  if (paramValues.type === "number") {
    return (
      <Container flexDirection="column" gap={8}>
        <Label>
          <Text>Value</Text>
        </Label>
        <Input
          type="number"
          value={String(paramValues.value ?? 0)}
          onValueChange={(value) =>
            onValueChange({
              ...paramValues,
              value: parseFloat(value) || 0,
            })
          }
        />
      </Container>
    );
  }

  if (
    paramValues.type === "Vector3" ||
    paramValues.type === "Quaternion" ||
    paramValues.type === "Euler"
  ) {
    return (
      <Container flexDirection="column" gap={8}>
        <Label>
          <Text>Values</Text>
        </Label>
        <Container flexDirection="row" gap={8}>
          <Container flexGrow={1} flexDirection="column" gap={2}>
            <Text fontSize={11} color={colors.mutedForeground}>
              X
            </Text>
            <Input
              type="number"
              value={String(paramValues.x ?? 0)}
              onValueChange={(value) =>
                onValueChange({
                  ...paramValues,
                  x: parseFloat(value) || 0,
                })
              }
            />
          </Container>
          <Container flexGrow={1} flexDirection="column" gap={2}>
            <Text fontSize={11} color={colors.mutedForeground}>
              Y
            </Text>
            <Input
              type="number"
              value={String(paramValues.y ?? 0)}
              onValueChange={(value) =>
                onValueChange({
                  ...paramValues,
                  y: parseFloat(value) || 0,
                })
              }
            />
          </Container>
          <Container flexGrow={1} flexDirection="column" gap={2}>
            <Text fontSize={11} color={colors.mutedForeground}>
              Z
            </Text>
            <Input
              type="number"
              value={String(paramValues.z ?? 0)}
              onValueChange={(value) =>
                onValueChange({
                  ...paramValues,
                  z: parseFloat(value) || 0,
                })
              }
            />
          </Container>
          {paramValues.type === "Quaternion" && (
            <Container flexGrow={1} flexDirection="column" gap={2}>
              <Text fontSize={11} color={colors.mutedForeground}>
                W
              </Text>
              <Input
                type="number"
                value={String(paramValues.w ?? 1)}
                onValueChange={(value) =>
                  onValueChange({
                    ...paramValues,
                    w: parseFloat(value) || 1,
                  })
                }
              />
            </Container>
          )}
        </Container>
      </Container>
    );
  }

  return null;
}
