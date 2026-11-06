import React, { useMemo, useEffect, useRef } from 'react';
import { useThree, extend, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

extend({ SparkRenderer, SplatMesh });

interface SparkSceneProps {
  splatUrl: string;
  resetTrigger: number;
  onLoad: (mesh: any) => void;
  onError: (error: Error) => void;
  onProgress: (progress: number) => void;
}

export const SparkScene: React.FC<SparkSceneProps> = ({ splatUrl, resetTrigger, onLoad, onError, onProgress }) => {
  const { gl } = useThree();
  const controlsRef = useRef<CameraControls>(null);
  const meshRef = useRef<SplatMesh>(null);
  const sparkRef = useRef<SparkRenderer>(null);

  const keys = useRef<{ [key: string]: boolean }>({});
  const rendererArgs = useMemo(() => [{ renderer: gl }], [gl]);
  const meshArgs = useMemo(() => [{ url: splatUrl, onProgress }], [splatUrl, onProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const frameScene = async (mesh: any, controls: CameraControls) => {
    const box = mesh.boundingBox;
    if (box) {
      await controls.fitToBox(box, true);
      controls.rotateTo(controls.azimuthAngle, Math.PI / 2, true);
    }
  };

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    let isMounted = true;
    mesh.initialized
      .then(() => {
        if (!isMounted) return;
        if (controlsRef.current) frameScene(mesh, controlsRef.current);
        onLoad(mesh);
      })
      .catch((err: Error) => { if (isMounted) onError(err); });

    return () => { isMounted = false; };
  }, [splatUrl, onLoad, onError]);

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current && meshRef.current) {
      frameScene(meshRef.current, controlsRef.current);
    }
  }, [resetTrigger]);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      const c = controlsRef.current;
      const speed = (keys.current['ShiftLeft'] ? 15.0 : 5.0) * delta;

      if (keys.current['KeyW']) c.forward(speed, true);
      if (keys.current['KeyS']) c.forward(-speed, true);
      if (keys.current['KeyA']) c.truck(-speed, 0, true);
      if (keys.current['KeyD']) c.truck(speed, 0, true);
      if (keys.current['KeyQ']) c.elevate(-speed, true);
      if (keys.current['KeyE']) c.elevate(speed, true);
    }

    if (sparkRef.current && controlsRef.current) {
      sparkRef.current.update(controlsRef.current.camera);
    }
  });

  return (
    <>
      {/* @ts-ignore */}
      <sparkRenderer ref={sparkRef} args={rendererArgs} />
      {/* @ts-ignore */}
      {splatUrl && <splatMesh ref={meshRef} args={meshArgs} />}
      
      <CameraControls 
        ref={controlsRef} 
        makeDefault 
        minAzimuthAngle={-Infinity} 
        maxAzimuthAngle={Infinity}
        minPolarAngle={0.05} 
        maxPolarAngle={Math.PI - 0.05}
        mouseButtons={{
          left: 1, // Orbit
          middle: 8,
          right: 2, // Pan
          wheel: 8,
        }}
      />
    </>
  );
};