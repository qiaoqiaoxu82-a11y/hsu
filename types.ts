import * as THREE from 'three';

export enum TreeMorphState {
  TREE_SHAPE = 'TREE_SHAPE',
  SCATTERED = 'SCATTERED'
}

export interface HandLandmarkerResult {
  landmarks: Array<Array<{ x: number; y: number; z: number }>>;
}

export type TreeUniforms = {
  uTime: { value: number };
  uMorphFactor: { value: number }; // 0 = Tree, 1 = Scattered
};
