import { useEffect, useLayoutEffect, useRef } from "react";
import type { ScenarioParameter } from "../../../types/types";
import { AMBox } from "../box";
import { PivotControls } from "@react-three/drei";
import { useCameraControlHandlers } from "../../utils/cameraControl";
import { matrix4ToValue, valueToMatrix4 } from "../../utils/parameterHelpers";
import { Matrix4 } from "three";
import { useIndividualScenarioStore } from "../../stores/individualScenarioStore";
import { invalidate } from "@react-three/fiber";
import { TextLabel } from "../common/TextLabel";

interface ParameterProps {
  parameter: ScenarioParameter;
  onClick?: () => void;
}

/**
 * Visual representation of a scenario parameter in the 3D scene
 * Uses Matrix4 under the hood for all transformations regardless of value type
 */
export function Parameter({ parameter, onClick }: ParameterProps) {
  const { representation, value, type, position } = parameter;
  if (!representation) {
    return null;
  }
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
  const textPosition = useRef<[number, number, number]>([0, 1.2, 0]);

  useEffect(() => {
    valueToMatrix4(value, matrix.current, type, position);
  }, [value, matrix, position]);

  function updateParameter(newMatrix: Matrix4) {
    const newValue = matrix4ToValue(newMatrix, value, type, position);
    individualScenarioStore.updateParameter(parameter.id, newValue);
  }

  function updateType(effect: boolean) {
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
        textPosition.current = [0, 1.2, 0];
        break;
      case "Vector2":
        // Disable Z axis
        activeAxes.current = [true, false, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = true;
        disableScaling.current = true;
        textPosition.current = [0, 0.3, 0];
        break;
      // @ts-ignore
      case "Vector4":
        // Disable rotation and scaling for Vector4
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = true;
        disableScaling.current = true;
        textPosition.current = [0, 1.2, 0];
        break;
      case "Euler":
      case "Quaternion":
        // Disable translation and scaling for rotations
        activeAxes.current = [true, true, true];
        disableAxes.current = true;
        disableSliders.current = true;
        disableRotations.current = false;
        disableScaling.current = true;
        textPosition.current = [0, 1.2, 0];
        break;
      case "Matrix4":
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = false;
        disableScaling.current = false;
        textPosition.current = [0, 1.2, 0];
        break;
      case "Matrix3":
        // Disable scaling for matrices
        activeAxes.current = [true, true, true];
        disableAxes.current = false;
        disableSliders.current = false;
        disableRotations.current = false;
        disableScaling.current = false;
        textPosition.current = [0, 1.2, 0];
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

  useLayoutEffect(() => updateType(true), [type]);

  updateType(false);
  // Render based on representation type

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
      {representation.type == "cube" && (
        <AMBox
          color={representation.color}
          onClick={onClick}
          scale={0.5}
        ></AMBox>
      )}
      <TextLabel
        text={parameter.name}
        position={textPosition.current}
        borderColor={representation.color}
        useSuspense={false}
      />
    </PivotControls>
  );
}
