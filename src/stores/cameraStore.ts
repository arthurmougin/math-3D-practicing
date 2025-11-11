import * as THREE from "three";
import { create } from "zustand";

interface CameraState {
  target: THREE.Vector3;
  setTarget: (target: THREE.Vector3) => void;
}

const defaultTarget = new THREE.Vector3(0, 0, 0);

export const useCameraStore = create<CameraState>((set) => ({
  target: defaultTarget.clone(),
  setTarget: (target) => {
    console.log("Camera target changed:", target);
    set({ target });
  },
}));
