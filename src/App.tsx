
import { Canvas } from "@react-three/fiber";
import "./App.css";
import { CustomOrbitControl } from "./components/orbitControl";
import { ScenarioVisualization } from "./components/scenarioVisualization";
import { Decorations } from "./components/environment";
import { EquationDatabaseBrowserHTML } from "./components/creation/EquationDatabaseBrowserHTML";

function App() {
  return (
    <>
      {/* HTML UI Layer - Outside Canvas */}
      <EquationDatabaseBrowserHTML />

      {/* 3D Canvas */}
      <Canvas
        style={{ height: "100vh", width: "100vw", touchAction: "none" }}
        shadows="percentage"
        gl={{ localClippingEnabled: true }}
      >
        <CustomOrbitControl />
        <ScenarioVisualization />
        <Decorations />
      </Canvas>
    </>
  );
}

export default App;
