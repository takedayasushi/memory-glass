import React, { useState } from 'react';
import AiChat from './AiChat';

const DbViewer = ({ data, user, queryLogs = [] }) => {
  const [showChat, setShowChat] = useState(false);

  return (
    <section className="section glass-panel db-viewer" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ marginBottom: '0.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        🔍 Firestore Real-time Viewer
      </h2>
      
      {/* Explanation Section */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', wordBreak: 'break-word' }}>
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

      {/* Query Logs Display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          📜 クエリ履歴 (Firestore Query Logs)
        </h3>
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '0.6rem', 
          borderRadius: '8px', 
          border: '1px solid rgba(255,255,255,0.05)', 
          height: '100px', 
          overflowY: 'auto',
          overflowX: 'hidden',
          fontSize: '0.78rem',
          fontFamily: 'monospace',
          color: '#34d399',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          wordBreak: 'break-all'
        }}>
          {queryLogs.length > 0 ? (
            queryLogs.map(log => (
              <div key={log.id} style={{ marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#9ca3af' }}>[{log.time}]</span>{' '}
                <span style={{ color: '#fcd34d', fontWeight: 'bold' }}>{log.operation}</span>:{' '}
                <span style={{ color: '#60a5fa' }}>{log.snippet}</span>
              </div>
            ))
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.3)' }}>// クエリはまだ実行されていません。追加・変更・削除時にここにログが表示されます。</div>
          )}
        </div>
      </div>

      {/* JSON Data */}
      <div 
        className="code-block" 
        style={{ 
          background: 'rgba(0,0,0,0.4)', 
          padding: '0.75rem', 
          borderRadius: '8px', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flexGrow: 1,
          flexShrink: 1,
          minHeight: '120px',
          maxHeight: '300px',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#a5b4fc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {data.length > 0 ? JSON.stringify(data, null, 2) : '// まだカードがありません。左側の画面からテキストや画像を送信すると、ここにデータが表示されます。'}
      </div>

      {/* AI Chat Toggle & Section */}
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
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
          <div style={{ marginTop: '0.75rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
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
