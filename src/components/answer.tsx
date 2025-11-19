import { useRef } from "react";
import type { Mesh } from "three";
import { AMBox } from "./box";
import type { ScenarioAnswer } from "../types";
import { valueToMatrix4 } from "../utils/mathTransforms";

interface AnswerProps {
  answer: ScenarioAnswer;
  onClick?: () => void;
  opacity?: number; // Optional opacity for showing expected answer
}

/**
 * Visual representation of a scenario answer in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 * Can be rendered with transparency to show expected result
 */
export function Answer({ answer, onClick, opacity = 1 }: AnswerProps) {
  const { representation, value } = answer;
  const meshRef = useRef<Mesh>(null);

  // Convert value to matrix
  const matrix = valueToMatrix4(value);

  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <AMBox
          ref={meshRef}
          matrix={matrix}
          matrixAutoUpdate={false}
          color={representation.color}
          onClick={onClick}
          scale={0.5}
        >
          <meshStandardMaterial
            color={representation.color}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </AMBox>
      );

    case "vertex":
      return (
        <mesh
          ref={meshRef}
          matrix={matrix}
          matrixAutoUpdate={false}
          onClick={onClick}
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={representation.color}
            transparent={opacity < 1}
            opacity={opacity}
            emissive={representation.color}
            emissiveIntensity={0.3}
          />
        </mesh>
      );

    default:
      return null;
  }
}
