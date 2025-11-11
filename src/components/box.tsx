import { useTexture } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import { Vector3, type Color, type Mesh } from "three";
import { useCameraStore } from "../stores/cameraStore";

export const AMBox = forwardRef<
  Mesh,
  ThreeElements["mesh"] & { color: string | Color }
>(({ color, ...props }, ref) => {
  const cameraStore = useCameraStore();
  const internalRef = useRef<Mesh>(null);
  const meshRef = (ref as React.RefObject<Mesh>) || internalRef;
  const [aomap, diffmap, normap, roughmap] = useTexture([
    "./assets/beige_wall/beige_wall_001_ao_2k.jpg",
    "./assets/beige_wall/beige_wall_001_diff_2k.jpg",
    "./assets/beige_wall/beige_wall_001_nor_gl_2k.jpg",
    "./assets/beige_wall/beige_wall_001_rough_2k.jpg",
  ]);

  return (
    <>
      <mesh
        ref={meshRef}
        castShadow
        onDoubleClick={(e) =>
          cameraStore.setTarget(e.object.getWorldPosition(new Vector3()))
        }
        onPointerOver={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerLeave={() => meshRef.current?.scale.set(1, 1, 1)}
        onPointerEnter={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerOut={() => meshRef.current?.scale.set(1, 1, 1)}
        {...props}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={diffmap}
          aoMap={aomap}
          normalMap={normap}
          roughnessMap={roughmap}
        />
      </mesh>
    </>
  );
});
