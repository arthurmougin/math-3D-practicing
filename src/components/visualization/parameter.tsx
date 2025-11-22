import { useRef } from "react";
import type { Mesh } from "three";
import { Color, Vector3 } from "three";
import type { ScenarioParameter } from "../../types";
import { AMBox } from "../box";
import { valueToMatrix4 } from "../../utils/mathTransforms";
import { ParameterLabel } from "../common/ParameterLabel";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value } = parameter;
  const meshRef = useRef<Mesh>(null);

  // Convert value to matrix
  const matrix = valueToMatrix4(value);
  const computedPosition = new Vector3().setFromMatrixPosition(matrix);

  const representationColor = new Color(representation.color);
  const dimmedColor = representationColor.multiplyScalar(0.2);
  const xColor = new Color(0xff0000).add(dimmedColor);
  const yColor = new Color(0x00ff00).add(dimmedColor);
  const zColor = new Color(0x0000ff).add(dimmedColor);

  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <group>
          <ParameterLabel
            text={parameter.name}
            position={[
              computedPosition.x,
              computedPosition.y + 0.8,
              computedPosition.z,
            ]}
            borderColor={representation.color}
            useSuspense={false}
          />
          <AMBox
            ref={meshRef}
            matrix={matrix}
            matrixAutoUpdate={false}
            color={representation.color}
            onClick={onClick}
            scale={0.5}
          />
        </group>
      );

    case "vertex":
      return (
        <group>
          <ParameterLabel
            text={parameter.name}
            position={[
              computedPosition.x,
              computedPosition.y + 0.3,
              computedPosition.z,
            ]}
            borderColor={representation.color}
            useSuspense={true}
          />
          <mesh matrix={matrix} matrixAutoUpdate={false}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={representation.color} />
            <arrowHelper
              args={[
                new Vector3(1, 0, 0),
                new Vector3(0, 0, 0),
                1,
                xColor,
                0.1,
                0.05,
              ]}
            />
            <arrowHelper
              args={[
                new Vector3(0, 1, 0),
                new Vector3(0, 0, 0),
                1,
                yColor,
                0.1,
                0.05,
              ]}
            />
            <arrowHelper
              args={[
                new Vector3(0, 0, 1),
                new Vector3(0, 0, 0),
                1,
                zColor,
                0.1,
                0.05,
              ]}
            />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}
