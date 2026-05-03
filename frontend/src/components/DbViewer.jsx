import React from 'react';

const DbViewer = ({ data }) => {
  return (
    <section className="section glass-panel db-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        🔍 Firestore Real-time Viewer
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        This panel shows the raw JSON data synced directly from Firestore. Watch it update instantly when the AI generates cards or you hit a review button!
      </p>
      <div 
        className="code-block" 
        style={{ 
          background: 'rgba(0,0,0,0.4)', 
          padding: '1rem', 
          borderRadius: '8px', 
          overflowY: 'auto', 
          flexGrow: 1,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: '#a5b4fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}
      >
        {JSON.stringify(data, null, 2)}
      </div>
    </section>
  );
};

export default DbViewer;
