import React, { useRef } from 'react';
import { Box, Upload, RefreshCw } from 'lucide-react';

interface TopBarProps {
  onFileUpload: (file: File) => void;
  onResetCamera: () => void;
  status: string;
  progress: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onFileUpload, onResetCamera, status, progress }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '56px',
      backgroundColor: '#18181b', borderBottom: '1px solid #27272a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', zIndex: 10, fontFamily: 'system-ui, sans-serif', color: '#e4e4e7'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Box size={24} color="#3b82f6" />
        <h1 style={{ fontSize: '18px', margin: 0, fontWeight: 600, letterSpacing: '-0.5px' }}>SpatialForge</h1>
        
        {/* Status Indicator */}
        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: status === 'ready' ? '#22c55e' : status === 'error' ? '#ef4444' : '#eab308'
          }} />
          <span style={{ textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 500 }}>
            {status === 'loading' ? `Decoding ${Math.round(progress * 100)}%` : status}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input 
          type="file" accept=".ply,.spz" ref={fileInputRef} style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
            e.target.value = ''; // Reset input
          }} 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: '#27272a', border: '1px solid #3f3f46', color: '#e4e4e7',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'background 0.2s'
          }}
        >
          <Upload size={16} /> Open Local Asset
        </button>

        <button 
          onClick={onResetCamera}
          style={{
            background: 'transparent', border: '1px solid #3f3f46', color: '#e4e4e7',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'background 0.2s'
          }}
        >
          <RefreshCw size={16} /> Reset View
        </button>
      </div>
    </div>
  );
};