import { Container, Text } from "@react-three/uikit";
import { Button, Label } from "@react-three/uikit-default";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { MathDataType } from "../../stores/scenarioStore";
import type { ParameterType } from "./types";

interface ParameterTypeSelectorProps {
  currentType: ParameterType;
  onTypeChange: (newValue: MathDataType) => void;
}

export function ParameterTypeSelector({
  currentType,
  onTypeChange,
}: ParameterTypeSelectorProps) {
  const handleTypeChange = (type: ParameterType) => {
    const defaults: Record<ParameterType, MathDataType> = {
      Vector3: new Vector3(0, 0, 0),
      Euler: new Euler(0, 0, 0),
      Quaternion: new Quaternion(0, 0, 0, 1),
      Matrix4: new Matrix4(),
      number: 0,
    };
    onTypeChange(defaults[type]);
  };

  return (
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
            variant={currentType === type ? "default" : "outline"}
            onClick={() => handleTypeChange(type)}
          >
            <Text fontSize={11}>{type}</Text>
          </Button>
        ))}
      </Container>
    </Container>
  );
}
