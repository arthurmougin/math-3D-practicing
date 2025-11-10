import { Canvas, useLoader } from "@react-three/fiber";
import "./App.css";
import {
  Box,
  OrbitControls,
  PerspectiveCamera,
  Plane,
  Sky,
  SoftShadows,
} from "@react-three/drei";
import { Euler, TextureLoader, Vector3 } from "three";

function App() {
  const sunPosition = new Vector3(0, 3, 0);
  const aoMap = useLoader(
    TextureLoader,
    "/assets/forrest_ground_01/forrest_ground_01_ao_4k.jpg"
  );
  const diffMap = useLoader(
    TextureLoader,
    "/assets/forrest_ground_01/forrest_ground_01_diff_4k.jpg"
  );
  const dispMap = useLoader(
    TextureLoader,
    "/assets/forrest_ground_01/forrest_ground_01_disp_4k.jpg"
  );
  const roughMap = useLoader(
    TextureLoader,
    "/assets/forrest_ground_01/forrest_ground_01_rough_4k.jpg"
  );
  const norGlMap = useLoader(
    TextureLoader,
    "/assets/forrest_ground_01/forrest_ground_01_nor_gl_4k.jpg"
  );
  return (
    <>
      <Canvas style={{ height: "100vh", width: "100vw" }} shadows>
        <mesh>
          <SoftShadows samples={100} />
          <PerspectiveCamera>
            <OrbitControls />
          </PerspectiveCamera>
          <directionalLight position={sunPosition} castShadow />
          <Box position={[0, 1, 0]} castShadow>
            <meshPhysicalMaterial
              aoMap={aoMap}
              map={diffMap}
              displacementMap={dispMap}
              roughnessMap={roughMap}
              normalMap={norGlMap}
            />
          </Box>
          <Sky
            distance={450000}
            sunPosition={sunPosition}
            inclination={0}
            azimuth={0.25}
          />
          <Plane
            rotation={new Euler(-Math.PI / 2, 0, 0)}
            scale={[1000, 1000, 1000]}
            receiveShadow
          >
            <meshPhysicalMaterial
              aoMap={aoMap}
              map={diffMap}
              displacementMap={dispMap}
              roughnessMap={roughMap}
              normalMap={norGlMap}
            />
          </Plane>
        </mesh>
      </Canvas>
    </>
  );
}

export default App;
