import React, { useState } from 'react';
import AiChat from './AiChat';

const DbViewer = ({ data, user }) => {
  const [showChat, setShowChat] = useState(false);

  return (
    <section className="section glass-panel db-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        🔍 Firestore Real-time Viewer
      </h2>
      
      {/* Explanation Section */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          この画面は、<strong style={{ color: 'var(--text-primary)' }}>Cloud Firestore データベースの中身</strong>をリアルタイムで覗き見しています。
        </p>
        <details style={{ marginBottom: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            📘 データの読み方（クリックで展開）
          </summary>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.82rem' }}>
            <li><strong>front / back</strong> — フラッシュカードの「表面（質問）」と「裏面（答え）」</li>
            <li><strong>interval</strong> — 次の復習まで何日空けるか（SM-2アルゴリズムが自動計算）</li>
            <li><strong>repetitions</strong> — 連続で正解した回数</li>
            <li><strong>easeFactor</strong> — カードの難易度（2.5が標準、低いほど難しい）</li>
            <li><strong>nextReviewDate</strong> — 次に復習すべき日時</li>
            <li><strong>createdAt</strong> — カードが生成された日時</li>
          </ul>
          <p style={{ fontSize: '0.82rem', margin: '0.5rem 0 0 0' }}>
            左側のアプリで「Good」や「Forgot」ボタンを押すと、ここの数値がリアルタイムに更新されるのを確認できます！
          </p>
        </details>
      </div>

      {/* JSON Data */}
      <div 
        className="code-block" 
        style={{ 
          background: 'rgba(0,0,0,0.4)', 
          padding: '0.75rem', 
          borderRadius: '8px', 
          overflowY: 'auto', 
          flexGrow: 1,
          flexShrink: 1,
          minHeight: '120px',
          maxHeight: '300px',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#a5b4fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}
      >
        {data.length > 0 ? JSON.stringify(data, null, 2) : '// まだカードがありません。左側の画面からテキストや画像を送信すると、ここにデータが表示されます。'}
      </div>

      {/* AI Chat Toggle & Section */}
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
        <button 
          className="btn"
          onClick={() => setShowChat(!showChat)}
          style={{ 
            width: '100%', 
            background: showChat ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)', 
            border: '1px solid var(--glass-border)', 
            color: 'var(--text-primary)',
            padding: '0.5rem',
            fontSize: '0.85rem',
            borderRadius: '8px'
          }}
        >
          {showChat ? '💬 チャットを閉じる' : '🤖 データベースについてAIに質問する'}
        </button>
        
        {showChat && (
          <div style={{ marginTop: '0.75rem' }}>
            <AiChat 
              user={user}
              initialMessage="こんにちは！Firestoreデータベースの仕組みや、表示されているJSONデータの読み方、間隔反復のアルゴリズムなど、何でも聞いてください。"
              placeholder="例: easeFactor って何？"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default DbViewer;
