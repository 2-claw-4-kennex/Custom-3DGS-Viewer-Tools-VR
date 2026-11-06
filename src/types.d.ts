import { Object3DNode } from '@react-three/fiber';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

declare module '@react-three/fiber' {
  interface ThreeElements {
    sparkRenderer: Object3DNode<SparkRenderer, typeof SparkRenderer>;
    splatMesh: Object3DNode<SplatMesh, typeof SplatMesh>;
  }
}