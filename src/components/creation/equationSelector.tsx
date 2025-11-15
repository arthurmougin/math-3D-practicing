import { Container, Text } from "@react-three/uikit";
import { Button, Label } from "@react-three/uikit-default";
import { useEffect, useState } from "react";
import {
  findEquationsByMethodName,
  findEquationsByParameters,
  getEquationSignatureString,
  getTypeName,
  type MethodSignature,
  type SupportedType,
} from "../../data/equationDatabaseHelper";
import type { ScenarioParameter } from "../../stores/scenarioStore";

interface EquationSelectorProps {
  /**
   * Current equation method name
   */
  equation: string;

  /**
   * Parameters of the scenario
   */
  parameters: ScenarioParameter[];

  /**
   * Callback when equation is selected
   */
  onEquationChange: (methodName: string) => void;
}

/**
 * Component to select an equation with suggestions based on parameters
 */
export function EquationSelector({
  equation,
  parameters,
  onEquationChange,
}: EquationSelectorProps) {
  const [suggestions, setSuggestions] = useState<MethodSignature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update suggestions when parameters change
  useEffect(() => {
    if (parameters.length === 0) {
      setSuggestions([]);
      return;
    }

    // Get parameter types
    const paramTypes = parameters.map((p) =>
      getTypeName(p.value)
    ) as SupportedType[];

    // Find matching equations
    const matches = findEquationsByParameters(paramTypes);

    // Limit to first 10 suggestions
    setSuggestions(matches.slice(0, 10));
  }, [parameters]);

  // Get current equation signatures if equation is set
  const currentEquationSignatures =
    equation.trim() !== "" ? findEquationsByMethodName(equation) : [];

  return (
    <Container flexDirection="column" gap={4}>
      <Label>
        <Text>Equation (method name)</Text>
      </Label>

      {/* Show current equation info */}
      {currentEquationSignatures.length > 0 && (
        <Container
          flexDirection="column"
          gap={3}
          padding={8}
          backgroundColor="#1a1a2e"
          borderRadius={4}
        >
          <Text fontSize={12} fontWeight="bold">
            Available signatures:
          </Text>
          {currentEquationSignatures.slice(0, 3).map((sig, idx) => (
            <Container key={idx} flexDirection="column" gap={2}>
              <Text fontSize={10} opacity={0.8}>
                {getEquationSignatureString(sig)}
              </Text>
              {sig.description && (
                <Text fontSize={9} opacity={0.6}>
                  {sig.description}
                </Text>
              )}
              {sig.parameters.length > 0 &&
                sig.parameters.some((p) => p.description) && (
                  <Container flexDirection="column" gap={1} paddingLeft={8}>
                    <Text fontSize={8} opacity={0.5} fontWeight="bold">
                      Parameters:
                    </Text>
                    {sig.parameters.map(
                      (param, pIdx) =>
                        param.description && (
                          <Container key={pIdx} flexDirection="row" gap={2}>
                            <Text fontSize={8} opacity={0.5}>
                              • {param.name}:
                            </Text>
                            <Text fontSize={8} opacity={0.5} maxWidth={250}>
                              {param.description}
                            </Text>
                          </Container>
                        )
                    )}
                  </Container>
                )}
            </Container>
          ))}
          {currentEquationSignatures.length > 3 && (
            <Text fontSize={10} opacity={0.6}>
              +{currentEquationSignatures.length - 3} more...
            </Text>
          )}
        </Container>
      )}

      {/* Suggestions based on current parameters */}
      {suggestions.length > 0 && (
        <Container flexDirection="column" gap={4}>
          <Container
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text fontSize={12} fontWeight="bold">
              Suggested equations ({suggestions.length})
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Text fontSize={10}>{showSuggestions ? "Hide" : "Show"}</Text>
            </Button>
          </Container>

          {showSuggestions && (
            <Container
              flexDirection="column"
              gap={2}
              maxHeight={200}
              overflow="scroll"
            >
              {suggestions.map((sig, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEquationChange(sig.methodName);
                    setShowSuggestions(false);
                  }}
                  justifyContent="flex-start"
                >
                  <Container
                    flexDirection="column"
                    gap={2}
                    alignItems="flex-start"
                    paddingY={4}
                  >
                    <Container flexDirection="column" gap={1}>
                      <Text fontSize={10} fontWeight="bold">
                        {sig.methodName}
                      </Text>
                      <Text fontSize={9} opacity={0.7}>
                        {getEquationSignatureString(sig)}
                      </Text>
                    </Container>
                    {sig.description && (
                      <Text fontSize={8} opacity={0.6} maxWidth={300}>
                        {sig.description}
                      </Text>
                    )}
                    {sig.parameters.length > 0 &&
                      sig.parameters.some((p) => p.description) && (
                        <Container
                          flexDirection="column"
                          gap={1}
                          paddingLeft={8}
                          marginTop={2}
                        >
                          {sig.parameters.map(
                            (param, pIdx) =>
                              param.description && (
                                <Container
                                  key={pIdx}
                                  flexDirection="row"
                                  gap={2}
                                >
                                  <Text
                                    fontSize={7}
                                    opacity={0.5}
                                    fontWeight="bold"
                                  >
                                    {param.name}:
                                  </Text>
                                  <Text
                                    fontSize={7}
                                    opacity={0.5}
                                    maxWidth={250}
                                  >
                                    {param.description}
                                  </Text>
                                </Container>
                              )
                          )}
                        </Container>
                      )}
                  </Container>
                </Button>
              ))}
            </Container>
          )}
        </Container>
      )}

      {/* No parameters message */}
      {parameters.length === 0 && (
        <Container padding={8} backgroundColor="#2a2a3e" borderRadius={4}>
          <Text fontSize={11} opacity={0.7}>
            Add parameters to see equation suggestions
          </Text>
        </Container>
      )}

      {/* Parameters don't match any equation */}
      {parameters.length > 0 && suggestions.length === 0 && (
        <Container padding={8} backgroundColor="#3a2a2e" borderRadius={4}>
          <Text fontSize={11} opacity={0.7}>
            No equations found for current parameter types
          </Text>
        </Container>
      )}
    </Container>
  );
}
