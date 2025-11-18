import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Plane,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import { DirectionalLight, DoubleSide, Vector3 } from "three";

export function Decorations() {
  const sunPosition = new Vector3(15, 10, 10);
  const light = useRef<DirectionalLight>(null!);
  return (
    <>
      <directionalLight
        position={sunPosition}
        ref={light}
        castShadow={true}
      ></directionalLight>
      <axesHelper position={[0, 0.001, 0]} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
      <Grid
        infiniteGrid={true}
        followCamera={false}
        fadeDistance={50}
        side={DoubleSide}
        sectionColor={"green"}
      />
      <Plane
        position={[0, -0.0015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1000}
        receiveShadow
      >
        <shadowMaterial opacity={0.2} />
      </Plane>
      <Suspense>
      <Environment
          background
          files="./assets/skies/autumn_field_puresky_2k.hdr"
        ></Environment>
      </Suspense>
    </>
  );
}
