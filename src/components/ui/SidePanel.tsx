import React from 'react';
import { Ruler, Square, Layers, Info } from 'lucide-react';

interface SidePanelProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ activeTool, setActiveTool }) => {
  const tools = [
    { id: 'navigate', icon: <Layers size={18} />, label: 'Navigate' },
    { id: 'distance', icon: <Ruler size={18} />, label: 'Distance' },
    { id: 'area', icon: <Square size={18} />, label: 'Area' },
  ];

  return (
    <div style={{
      position: 'absolute', top: '56px', right: 0, bottom: 0, width: '280px',
      backgroundColor: '#18181b', borderLeft: '1px solid #27272a',
      padding: '20px', zIndex: 10, fontFamily: 'system-ui, sans-serif', color: '#e4e4e7',
      display: 'flex', flexDirection: 'column', gap: '24px'
    }}>
      {/* Measurement Tools (UI State Only for M2) */}
      <div>
        <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '1px', marginBottom: '12px' }}>
          Measurement Tools
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                background: activeTool === tool.id ? '#3b82f6' : '#27272a',
                border: '1px solid',
                borderColor: activeTool === tool.id ? '#3b82f6' : '#3f3f46',
                color: activeTool === tool.id ? '#fff' : '#e4e4e7',
                padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px',
                transition: 'all 0.2s ease', textAlign: 'left'
              }}
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scene Info Panel */}
      <div>
        <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} /> Scene Information
        </h2>
        <div style={{ background: '#09090b', borderRadius: '6px', padding: '12px', fontSize: '13px', color: '#a1a1aa', border: '1px solid #27272a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Engine:</span> <span style={{ color: '#e4e4e7' }}>Spark 2.0 (WebGL2)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Sorting:</span> <span style={{ color: '#e4e4e7' }}>GPU Radix</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Splat Budget:</span> <span style={{ color: '#e4e4e7' }}>Dynamic</span>
          </div>
        </div>
      </div>
    </div>
  );
};