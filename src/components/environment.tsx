import {
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Plane,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import { DirectionalLight, DoubleSide, Vector3 } from "three";
import { TextLabel } from "./common/TextLabel";

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
      <TextLabel
        text="Origin"
        position={[0, 0.15, 0]}
        borderColor="grey"
        useSuspense={false}
      />
      <TextLabel
        text="X"
        position={[1, 0.15, 0]}
        borderColor="grey"
        useSuspense={false}
      />{" "}
      <TextLabel
        text="y"
        position={[0, 1.15, 0]}
        borderColor="grey"
        useSuspense={false}
      />{" "}
      <TextLabel
        text="Z"
        position={[0, 0.15, 1]}
        borderColor="grey"
        useSuspense={false}
      />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
      <Grid
        position={[0, -0.001, 0]}
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
