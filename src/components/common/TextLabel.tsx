import { Billboard, Text } from "@react-three/drei";
import { geometry } from "maath";
import { extend } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { Vector3, type Mesh } from "three";
import { useCameraStore } from "../../stores/cameraStore";

// Extend R3F with RoundedPlaneGeometry
extend({ RoundedPlaneGeometry: geometry.RoundedPlaneGeometry });

interface TextLabelProps {
  /**
   * The text to display on the label
   */
  text: string;
  /**
   * Position of the label in 3D space [x, y, z]
   */
  position: [number, number, number];
  /**
   * Background color of the label border
   */
  borderColor: string;
  /**
   * Whether to wrap the label in Suspense (default: true)
   */
  useSuspense?: boolean;
}

/**
 * A 3D billboard label component that always faces the camera
 * Features a white background with colored border
 * Automatically calculates width based on text length
 *
 * @example
 * ```tsx
 * <TextLabel
 *   text="Vector A"
 *   position={[1, 2, 3]}
 *   borderColor="#ff0000"
 * />
 * ```
 */
export function TextLabel({
  text,
  position,
  borderColor,
  useSuspense = true,
}: TextLabelProps) {
  const meshRef = useRef<Mesh>(null);
  const cameraStore = useCameraStore();
  const textRef = useRef<Mesh>(null);

  // Calculate label dimensions based on text
  const txtBBx = textRef.current?.geometry.boundingBox?.max.x;
  const widthByMath = text.length * 0.09;
  let textWidth = widthByMath;
  if (txtBBx && txtBBx * 2 < widthByMath) {
    textWidth = txtBBx * 2;
  }

  const labelWidth = textWidth + 0.2;
  const labelHeight = 0.25;
  const borderRadius = 0.03;

  const content = (
    <>
      <Text
        fontSize={0.15}
        ref={textRef}
        color="black"
        anchorX="center"
        anchorY="middle"
        depthOffset={-1}
      >
        {text}
      </Text>
      {/* White background */}
      <mesh position={[0, 0, 0]}>
        {/* @ts-ignore - roundedPlaneGeometry is extended */}
        <roundedPlaneGeometry args={[labelWidth, labelHeight, borderRadius]} />
        <meshBasicMaterial color="white" transparent opacity={0.95} />
      </mesh>
      {/* Colored border */}
      <mesh
        ref={meshRef}
        position={[0, 0, -0.01]}
        onDoubleClick={(e) =>
          cameraStore.setTarget(e.object.getWorldPosition(new Vector3()))
        }
        onPointerOver={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerLeave={() => meshRef.current?.scale.set(1, 1, 1)}
        onPointerEnter={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerOut={() => meshRef.current?.scale.set(1, 1, 1)}
      >
        {/* @ts-ignore - roundedPlaneGeometry is extended */}
        <roundedPlaneGeometry
          args={[labelWidth + 0.02, labelHeight + 0.02, borderRadius]}
        />
        <meshBasicMaterial color={borderColor} />
      </mesh>
    </>
  );

  return (
    <Billboard position={position}>
      {useSuspense ? <Suspense>{content}</Suspense> : content}
    </Billboard>
  );
}
