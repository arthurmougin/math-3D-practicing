import { Container, Text } from "@react-three/uikit";
import { colors, Input, Label } from "@react-three/uikit-default";

interface MatrixValueGridProps {
  matrixValues: number[];
  onValueChange: (newMatrix: number[]) => void;
}

export function MatrixValueGrid({
  matrixValues,
  onValueChange,
}: MatrixValueGridProps) {
  return (
    <Container flexDirection="column" gap={8}>
      <Label>
        <Text>Matrix Values (4x4)</Text>
      </Label>
      <Container flexDirection="column" gap={4}>
        {[0, 1, 2, 3].map((row) => (
          <Container key={row} flexDirection="row" gap={4}>
            {[0, 1, 2, 3].map((col) => {
              const index = col * 4 + row;

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
                    type="number"
                    value={String(matrixValues[index])}
                    onValueChange={(value) => {
                      const newMatrix = [...matrixValues];
                      newMatrix[index] = parseFloat(value) || 0;
                      onValueChange(newMatrix);
                    }}
                  />
                </Container>
              );
            })}
          </Container>
        ))}
      </Container>
    </Container>
  );
}
