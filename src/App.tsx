import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { SparkScene } from './components/renderer/SparkScene';

const PerformanceMonitor = () => {
  const frames = useRef(0);
  const totalFrames = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const lastFpsUpdateTime = useRef(performance.now());
  const startTime = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const frameDelta = now - lastFrameTime.current;
    lastFrameTime.current = now;
    
    frames.current++;
    totalFrames.current++;

    const frameTimeEl = document.getElementById('val-frame-time');
    if (frameTimeEl) frameTimeEl.innerText = `${frameDelta.toFixed(1)} ms`;

    const elapsedFpsTime = now - lastFpsUpdateTime.current;
    if (elapsedFpsTime >= 500) {
      const currentFps = ((frames.current * 1000) / elapsedFpsTime).toFixed(1);
      const avgFps = ((totalFrames.current * 1000) / (now - startTime.current)).toFixed(1);

      const fpsEl = document.getElementById('val-fps');
      if (fpsEl) {
        fpsEl.innerText = currentFps;
        fpsEl.style.color = parseFloat(currentFps) >= 60 ? '#4ade80' : parseFloat(currentFps) >= 30 ? '#fbbf24' : '#f87171';
      }
      
      const avgFpsEl = document.getElementById('val-avg-fps');
      if (avgFpsEl) avgFpsEl.innerText = avgFps;

      frames.current = 0;
      lastFpsUpdateTime.current = now;
    }
  });
  return null;
};

export default function App() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [splatUrl, setSplatUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  
  // Directly cache the raw 3D mesh object to bypass React state
  const meshInstanceRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  
  const [datasetInfo, setDatasetInfo] = useState({
    fileSizeMB: '0.00', loadTimeSec: '0.00', totalSplats: 'Unknown', loadedSplats: 'Unknown'
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setProgress(0);
    setErrorMsg('');
    startTimeRef.current = performance.now();

    setDatasetInfo(prev => ({ ...prev, fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) }));
    setSplatUrl((prevUrl) => {
      const cleanUrl = prevUrl.split('#')[0];
      if (cleanUrl.startsWith('blob:')) URL.revokeObjectURL(cleanUrl);
      return URL.createObjectURL(file) + '#' + file.name;
    });
  }, []);

  const handleLoad = useCallback((mesh: any) => {
    // 1. Store Mesh natively
    meshInstanceRef.current = mesh;
    
    // 2. Set default -90 rotation (Z-up fix) natively
    mesh.rotation.set((-90 * Math.PI) / 180, 0, 0);
    mesh.updateMatrixWorld(true);

    // 3. Extract and display data
    const loadTime = ((performance.now() - startTimeRef.current) / 1000).toFixed(2);
    let actualCount = 0;
    
    if (mesh.numSplats && mesh.numSplats > 0) {
      actualCount = mesh.numSplats;
    } else if (mesh.packedSplats?.numSplats && mesh.packedSplats.numSplats > 0) {
      actualCount = mesh.packedSplats.numSplats;
    } else if (mesh.splats?.numSplats && mesh.splats.numSplats > 0) {
      actualCount = mesh.splats.numSplats;
    } else if (typeof mesh.getSplatCount === 'function') {
      const funcCount = mesh.getSplatCount();
      if (funcCount > 0) actualCount = funcCount;
    }
    const countDisplay = actualCount > 0 ? actualCount.toLocaleString() : "API Extraction Failed";

    setDatasetInfo(prev => ({
      ...prev, loadTimeSec: loadTime, totalSplats: countDisplay, loadedSplats: countDisplay, 
    }));
    setStatus('ready');
  }, []);

  // Stabilize the error handler callback
  const handleError = useCallback((err: any) => {
    setStatus('error');
    setErrorMsg(`Engine Error: ${err.message || err}`);
  }, []);

  useEffect(() => {
    return () => {
      const cleanUrl = splatUrl.split('#')[0];
      if (cleanUrl.startsWith('blob:')) URL.revokeObjectURL(cleanUrl);
    };
  }, [splatUrl]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#09090b', color: '#fff', fontFamily: 'system-ui' }}>
      <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, width: '340px', background: 'rgba(24, 24, 27, 0.9)', border: '1px solid #3f3f46', borderRadius: '8px', padding: '16px' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 12px 0' }}>SpatialForge Viewer</h2>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <label style={{ flex: 1, background: '#3b82f6', color: '#fff', textAlign: 'center', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
            Open PLY
            <input type="file" accept=".ply,.spz" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => setResetTrigger(p => p + 1)} style={{ flex: 1, background: '#3f3f46', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
            Reset Camera
          </button>
        </div>

        {/* IMPERATIVE SLIDERS: These now alter the Three.js mesh directly, completely bypassing React State to prevent freezing */}
        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Scene Rotation (Degrees):</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', fontSize: '12px', fontWeight: 'bold' }}>X</span>
            <input 
              type="range" min="-180" max="180" defaultValue="-90" style={{ flex: 1 }}
              onInput={(e) => {
                const val = Number((e.target as HTMLInputElement).value);
                document.getElementById('lbl-rot-x')!.innerText = `${val}°`;
                if (meshInstanceRef.current) {
                  meshInstanceRef.current.rotation.x = (val * Math.PI) / 180;
                  meshInstanceRef.current.updateMatrixWorld(true);
                }
              }}
            />
            <span id="lbl-rot-x" style={{ width: '35px', fontSize: '12px', textAlign: 'right' }}>-90°</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', fontSize: '12px', fontWeight: 'bold' }}>Y</span>
            <input 
              type="range" min="-180" max="180" defaultValue="0" style={{ flex: 1 }}
              onInput={(e) => {
                const val = Number((e.target as HTMLInputElement).value);
                document.getElementById('lbl-rot-y')!.innerText = `${val}°`;
                if (meshInstanceRef.current) {
                  meshInstanceRef.current.rotation.y = (val * Math.PI) / 180;
                  meshInstanceRef.current.updateMatrixWorld(true);
                }
              }}
            />
            <span id="lbl-rot-y" style={{ width: '35px', fontSize: '12px', textAlign: 'right' }}>0°</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', fontSize: '12px', fontWeight: 'bold' }}>Z</span>
            <input 
              type="range" min="-180" max="180" defaultValue="0" style={{ flex: 1 }}
              onInput={(e) => {
                const val = Number((e.target as HTMLInputElement).value);
                document.getElementById('lbl-rot-z')!.innerText = `${val}°`;
                if (meshInstanceRef.current) {
                  meshInstanceRef.current.rotation.z = (val * Math.PI) / 180;
                  meshInstanceRef.current.updateMatrixWorld(true);
                }
              }}
            />
            <span id="lbl-rot-z" style={{ width: '35px', fontSize: '12px', textAlign: 'right' }}>0°</span>
          </div>
        </div>

        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Status:</span>
            <span style={{ color: status === 'error' ? '#f87171' : status === 'ready' ? '#4ade80' : '#fbbf24' }}>
              {status === 'loading' ? `Decoding... ${Math.round(progress * 100)}%` : status.toUpperCase()}
            </span>
          </div>
          
          <hr style={{ borderColor: '#3f3f46', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Total Splats:</span> <strong>{datasetInfo.totalSplats}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Loaded Splats:</span> <strong>{datasetInfo.loadedSplats}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Rendered Splats:</span> <span style={{ color: '#fbbf24' }}>GPU Culled</span>
          </div>
          
          <hr style={{ borderColor: '#3f3f46', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Current FPS:</span> <strong id="val-fps" style={{ color: '#4ade80' }}>0.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Average FPS:</span> <strong id="val-avg-fps">0.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>Frame Time:</span> <strong id="val-frame-time" style={{ color: '#fbbf24' }}>0.0 ms</strong>
          </div>
        </div>
      </div>

      {status === 'ready' && (
        <div style={{ position: 'absolute', bottom: 15, left: 15, zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#a1a1aa' }}>
          <strong>Controls:</strong> WASD to move • Q/E to change height • Left Click to Orbit • Right Click to Pan
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: false }}>
        {status === 'ready' && <PerformanceMonitor />}
        <SparkScene 
          splatUrl={splatUrl} 
          resetTrigger={resetTrigger}
          onProgress={setProgress}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Canvas>
    </div>
  );
}