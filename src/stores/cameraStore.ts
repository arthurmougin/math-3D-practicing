import * as THREE from "three";
import { create } from "zustand";
import type { CameraState } from "../../types/types";

const defaultTarget = new THREE.Vector3(0, 0, 0);

export const useCameraStore = create<CameraState>((set) => ({
  target: defaultTarget.clone(),
  setTarget: (target) => {
    set({ target });
  },
  enabled: true,
  setEnabled: (enabled) => set({ enabled }),
}));
