import { useEffect, useLayoutEffect, useRef } from "react";
import type { Mesh } from "three";
import type { ScenarioParameter } from "../../../types/types";
import { AMBox } from "../box";
import { ParameterLabel } from "../common/ParameterLabel";
import { PivotControls } from "@react-three/drei";
import { useCameraControlHandlers } from "../../utils/cameraControl";
import { matrix4ToValue, valueToMatrix4 } from "../../utils/parameterHelpers";
import { Matrix4 } from "three";
import { useIndividualScenarioStore } from "../../stores/individualScenarioStore";
import { invalidate } from "@react-three/fiber";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value, type } = parameter;
  if (!representation) {
    return null;
  }

  const meshRef = useRef<Mesh>(null);
  const individualScenarioStore = useIndividualScenarioStore();
  const { disableCameraControl, enableCameraControl } =
    useCameraControlHandlers();

  /** Allows you to switch individual axes off */
  const activeAxes = useRef<[boolean, boolean, boolean]>([true, true, true]);
  /** Allows you to disable translation via axes arrows */
  const disableAxes = useRef(false);
  /** Allows you to disable translation via axes planes */
  const disableSliders = useRef(false);
  /** Allows you to disable rotation */
  const disableRotations = useRef(true);
  /** Allows you to disable scaling */
  const disableScaling = useRef(true);
  const matrix = useRef(new Matrix4());
  const firstframe = useRef(true);

  useEffect(() => {
    valueToMatrix4(value, matrix.current, type);
  }, [value, matrix]);

  function updateParameter(newMatrix: Matrix4) {
    const newValue = matrix4ToValue(newMatrix, value, type);
    individualScenarioStore.updateParameter(parameter.id, newValue);
  }

  function updatePivotControls(effect: boolean) {
    if (!effect && !firstframe.current) {
      return;
    }
    firstframe.current = false;
    switch (type) {
      case "Vector3":
        // All controls enabled
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = true;
        disableScaling.current = true;
        break;
      case "Vector2":
        // Disable Z axis
        activeAxes.current = [true, false, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = true;
        disableScaling.current = true;
        break;
      // @ts-ignore
      case "Vector4":
        // Disable rotation and scaling for Vector4
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = true;
        disableScaling.current = true;
        break;
      case "Euler":
      case "Quaternion":
        // Disable translation and scaling for rotations
        activeAxes.current = [true, true, true];
        disableAxes.current = true;
        disableSliders.current = true;
        disableRotations.current = false;
        disableScaling.current = true;
        break;
      case "Matrix4":
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = false;
        disableScaling.current = false;
        break;
      case "Matrix3":
        // Disable scaling for matrices
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = false;
        disableScaling.current = true;
        break;
      // @ts-ignore
      case "Number":
      // @ts-ignore
      case "Boolean":
        // Disable all but one axis for numbers and booleans
        activeAxes.current = [true, false, false];
        disableAxes.current = false;
        disableSliders.current = true;
        disableRotations.current = true;
        disableScaling.current = true;
        break;
      default:
        throw new Error(
          `Unsupported parameter type for visualization: ${type}`
        );
    }
    invalidate();
  }

  useLayoutEffect(() => updatePivotControls(true), [type]);

  updatePivotControls(false);
  // Render based on representation type
  switch (representation.type) {
    case "cube":
      return (
        <PivotControls
          matrix={matrix.current}
          onDragEnd={() => enableCameraControl()}
          onDrag={updateParameter}
          onDragStart={() => disableCameraControl()}
          activeAxes={activeAxes.current}
          disableAxes={disableAxes.current}
          disableSliders={disableSliders.current}
          disableRotations={disableRotations.current}
          disableScaling={disableScaling.current}
        >
          <ParameterLabel
            text={parameter.name}
            position={[0, 0.9, 0]}
            borderColor={representation.color}
            useSuspense={false}
          />
          <AMBox
            ref={meshRef}
            color={representation.color}
            onClick={onClick}
            scale={0.5}
          >
            <meshStandardMaterial
              transparent={true}
              opacity={0.5}
            ></meshStandardMaterial>
          </AMBox>
        </PivotControls>
      );

    case "vertex":
      return (
        <PivotControls
          matrix={matrix.current}
          onDragEnd={() => enableCameraControl()}
          onDrag={updateParameter}
          onDragStart={() => disableCameraControl()}
          activeAxes={activeAxes.current}
          disableAxes={disableAxes.current}
          disableSliders={disableSliders.current}
          disableRotations={disableRotations.current}
          disableScaling={disableScaling.current}
        >
          <ParameterLabel
            text={parameter.name}
            position={[0.5, 0.5, 0.5]}
            borderColor={representation.color}
            useSuspense={true}
          />
        </PivotControls>
      );

    default:
      throw new Error(`Unknown representation type: ${representation.type}`);
  }
}
