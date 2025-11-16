import { useTexture } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { forwardRef, useRef, Suspense } from "react";
import { Vector3, type Color, type Mesh } from "three";
import { useCameraStore } from "../stores/cameraStore";

const BoxMesh = forwardRef<
  Mesh,
  ThreeElements["mesh"] & {
    color?: string | Color;
    type?: "wall" | "linoleum" | "denim";
  }
>(({ color = "white", type = "wall", ...props }, ref) => {
  const cameraStore = useCameraStore();
  const internalRef = useRef<Mesh>(null);
  const meshRef = (ref as React.RefObject<Mesh>) || internalRef;

  const getTexturePaths = () => {
    switch (type) {
      case "wall":
        return [
          "./assets/beige_wall/beige_wall_001_diff_2k.jpg",
          "./assets/beige_wall/beige_wall_001_nor_gl_2k.jpg",
          "./assets/beige_wall/beige_wall_001_rough_2k.jpg",
        ];
      case "linoleum":
        return [
          "./assets/linoleum_brown_2k/textures/linoleum_brown_diff_2k.jpg",
          "./assets/linoleum_brown_2k/textures/linoleum_brown_nor_gl_2k.jpg",
          "./assets/linoleum_brown_2k/textures/linoleum_brown_rough_2k.jpg",
        ];
      case "denim":
      default:
        return [
          "./assets/denim_fabric_03_2k/textures/denim_fabric_03_diff_2k.jpg",
          "./assets/denim_fabric_03_2k/textures/denim_fabric_03_nor_gl_2k.jpg",
          "./assets/denim_fabric_03_2k/textures/denim_fabric_03_rough_2k.jpg",
          "./assets/denim_fabric_03_2k/textures/denim_fabric_03_metal_2k.jpg",
          "./assets/denim_fabric_03_2k/textures/denim_fabric_03_anisotropy_strength_2k.jpg",
        ];
    }
  };
  const textures = useTexture(getTexturePaths());
  const getMaterialProps = () => {
    switch (type) {
      case "wall":
        return {
          map: textures[0],
          normalMap: textures[1],
          roughnessMap: textures[2],
        };
      case "linoleum":
        return {
          map: textures[0],
          normalMap: textures[1],
          roughnessMap: textures[2],
        };
      case "denim":
      default:
        return {
          map: textures[0],
          normalMap: textures[1],
          roughnessMap: textures[2],
          metalnessMap: textures[3],
          anisotropyMap: textures[4],
        };
    }
  };
  const materialProps = getMaterialProps();

  return (
    <>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onDoubleClick={(e) =>
          cameraStore.setTarget(e.object.getWorldPosition(new Vector3()))
        }
        onPointerOver={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerLeave={() => meshRef.current?.scale.set(1, 1, 1)}
        onPointerEnter={() => meshRef.current?.scale.set(1.1, 1.1, 1.1)}
        onPointerOut={() => meshRef.current?.scale.set(1, 1, 1)}
        {...props}
      >
        <boxGeometry args={[1, 1, 1, 100, 100, 100]} />
        <meshPhysicalMaterial color={color} {...materialProps} />
      </mesh>
    </>
  );
});

export const AMBox = forwardRef<
  Mesh,
  ThreeElements["mesh"] & {
    color?: string | Color;
    type?: "wall" | "linoleum" | "denim";
  }
>((props, ref) => {
  return (
    <Suspense
      fallback={
        <mesh ref={ref} {...props}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={props.color || "white"} wireframe />
        </mesh>
      }
    >
      <BoxMesh ref={ref} {...props} />
    </Suspense>
  );
});
