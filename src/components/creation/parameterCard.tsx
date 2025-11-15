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
  RepresentationType,
  ScenarioParameter,
} from "../../stores/scenarioStore";
import { MatrixValueGrid } from "./matrixValueGrid";
import { ParameterTypeSelector } from "./parameterTypeSelector";
import { ParameterValueInputs } from "./parameterValueInputs";
import type { ParameterValues } from "./types";

interface ParameterCardProps {
  param: ScenarioParameter;
  paramValues: ParameterValues;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNameChange: (name: string) => void;
  onRepresentationChange: (type: RepresentationType) => void;
  onColorChange: (color: string) => void;
  onTypeChange: (
    newValue: import("../../stores/scenarioStore").MathDataType
  ) => void;
  onValueChange: (values: ParameterValues) => void;
  onMatrixChange: (matrix: number[]) => void;
  onRemove: () => void;
}

export function ParameterCard({
  param,
  paramValues,
  isCollapsed,
  onToggleCollapse,
  onNameChange,
  onRepresentationChange,
  onColorChange,
  onTypeChange,
  onValueChange,
  onMatrixChange,
  onRemove,
}: ParameterCardProps) {
  return (
    <Card borderWidth={1} borderColor={colors.border}>
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
            onClick={onToggleCollapse}
            paddingX={4}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </Button>
          <Input
            value={param.name}
            onValueChange={onNameChange}
            placeholder="Parameter name"
          />
        </Container>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 />
        </Button>
      </CardHeader>

      {!isCollapsed && (
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
                  onClick={() => onRepresentationChange(type)}
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
                  onValueChange={onColorChange}
                  placeholder="#ff0000"
                />
              </Container>
            </Container>
          </Container>

          {/* Type Selection */}
          <ParameterTypeSelector
            currentType={paramValues.type}
            onTypeChange={onTypeChange}
          />

          {/* Type-specific values */}
          {paramValues.type !== "Matrix4" && (
            <ParameterValueInputs
              paramValues={paramValues}
              onValueChange={onValueChange}
            />
          )}

          {paramValues.type === "Matrix4" && (
            <MatrixValueGrid
              matrixValues={
                paramValues.matrixValues || [
                  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
                ]
              }
              onValueChange={onMatrixChange}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}
