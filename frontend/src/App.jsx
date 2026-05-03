import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { auth, db } from './lib/firebase' // Initialize Firebase based on skills
import './App.css'
import UploadSection from './components/UploadSection'
import Flashcard from './components/Flashcard'
import DbViewer from './components/DbViewer'
import AiChat from './components/AiChat'
import './lib/firebase' // Initialize Firebase based on skills

function App() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [activeTab, setActiveTab] = useState('app'); // 'app' or 'db'
  const [prevCards, setPrevCards] = useState([]);
  const [queryLogs, setQueryLogs] = useState([]);
  const [reviewMode, setReviewMode] = useState('list'); // 'list' or 'study'
  const [studyIndex, setStudyIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!user) {
      setCards([]);
      return;
    }

    const cardsRef = collection(db, 'users', user.uid, 'cards');
    const q = query(cardsRef, orderBy('createdAt', 'desc'));

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const fetchedCards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCards(fetchedCards);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (prevCards.length === 0 && cards.length > 0) {
      // Fetch or batch added
      const snippet = `db.collection('users').doc('${user.uid}').collection('cards').get()`;
      setQueryLogs(prev => [
        { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), operation: 'GET / LIST', snippet },
        ...prev
      ]);
    } else if (cards.length > prevCards.length) {
      // Add operation
      const diff = cards.filter(c => !prevCards.some(pc => pc.id === c.id));
      diff.forEach(c => {
        const snippet = `db.collection('users').doc('${user.uid}').collection('cards').add({ front: "${c.front.slice(0, 30)}...", back: "${c.back.slice(0, 30)}..." })`;
        setQueryLogs(prev => [
          { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), operation: 'ADD', snippet },
          ...prev
        ]);
      });
    } else if (cards.length < prevCards.length) {
      // Delete operation
      const diff = prevCards.filter(pc => !cards.some(c => c.id === pc.id));
      diff.forEach(c => {
        const snippet = `db.collection('users').doc('${user.uid}').collection('cards').doc('${c.id}').delete()`;
        setQueryLogs(prev => [
          { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), operation: 'DELETE', snippet },
          ...prev
        ]);
      });
    } else {
      // Update operation or status changes
      cards.forEach(c => {
        const prevC = prevCards.find(pc => pc.id === c.id);
        if (prevC && (prevC.interval !== c.interval || prevC.easeFactor !== c.easeFactor)) {
          const snippet = `db.collection('users').doc('${user.uid}').collection('cards').doc('${c.id}').update({ interval: ${c.interval}, easeFactor: ${c.easeFactor} })`;
          setQueryLogs(prev => [
            { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), operation: 'UPDATE', snippet },
            ...prev
          ]);
        }
      });
    }
    setPrevCards(cards);
  }, [cards, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpload = async (data) => {
    if (!user) return;
    setIsGenerating(true);

    try {
      const idToken = await user.getIdToken();
      let payload = {};

      if (data.type === 'text') {
        payload.text = data.content;
      } else if (data.type === 'image') {
        const fileToBase64 = (file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });

        const base64Data = await fileToBase64(data.file);
        payload.image = base64Data;
        payload.mimeType = data.file.type || 'image/jpeg';
        if (data.content) {
          payload.text = data.content;
        }
      }

      const response = await fetch('https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api/api/generate-cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Failed to generate cards:", result.error);
        alert("Failed to generate cards: " + result.error);
      }
      // Note: We do NOT need to manually setCards here. 
      // Firestore's onSnapshot will automatically detect the new cards saved by the backend and update the UI!
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error connecting to server.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="app-container"><p>Loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="app-container">
        <header>
          <h1>Memory Glass</h1>
          <p>Your AI-powered memory assistant</p>
        </header>
        <main className="main-content" style={{ alignItems: 'center', marginTop: '2rem' }}>
          <section className="section glass-panel" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2>Login</h2>
            <p style={{ marginBottom: '2rem' }}>Please sign in to save and review your memories.</p>
            <button className="btn btn-primary" onClick={handleLogin}>
              Sign in with Google
            </button>
          </section>
        </main>
      </div>
    );
  }

  const getRetentionScore = (card) => {
    if (!card.nextReviewDate) return 0;
    const nextDate = card.nextReviewDate.toDate ? card.nextReviewDate.toDate() : new Date(card.nextReviewDate);
    const now = new Date();
    if (nextDate <= now) return 0;
    const interval = card.interval || 1;
    const diffTime = Math.abs(nextDate - now);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    let score = (diffDays / interval) * 100;
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const highCount = cards.filter(c => getRetentionScore(c) >= 80).length;
  const mediumCount = cards.filter(c => getRetentionScore(c) >= 40 && getRetentionScore(c) < 80).length;
  const lowCount = cards.filter(c => getRetentionScore(c) < 40).length;
  const avgRetention = cards.length > 0 ? Math.round(cards.reduce((sum, c) => sum + getRetentionScore(c), 0) / cards.length) : 0;

  const studyCards = [...cards].sort((a, b) => {
    const dateA = a.nextReviewDate ? (a.nextReviewDate.toDate ? a.nextReviewDate.toDate() : new Date(a.nextReviewDate)) : new Date(0);
    const dateB = b.nextReviewDate ? (b.nextReviewDate.toDate ? b.nextReviewDate.toDate() : new Date(b.nextReviewDate)) : new Date(0);
    return dateA - dateB;
  });

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Memory Glass</h1>
          <p>Your AI-powered memory assistant</p>
        </div>
        
        {/* Navigation and User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn" 
            style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.4rem 0.8rem' }} 
            onClick={() => setShowAbout(!showAbout)}
          >
            {showAbout ? 'Back to App' : 'About this App'}
          </button>
          
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.displayName}</span>
          
          <button 
            className="btn" 
            style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid rgba(255, 0, 0, 0.3)', color: '#ff6b6b', padding: '0.4rem 0.8rem' }} 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {showAbout ? (
        <main className="main-content">
          <section className="section glass-panel" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
            <h2>📖 Memory Glass について</h2>
            
            <div style={{ marginTop: '1.5rem', lineHeight: '1.6' }}>
              <h3>このアプリの目的</h3>
              <p>Memory Glass は、テキストやノートの写真を放り込むだけで、AIが自動的に「一番覚えるべきポイント」を抽出し、<strong>間隔反復（Spaced Repetition）</strong> 学習用のフラッシュカードを生成するアプリケーションです。</p>
              
              <h3 style={{ marginTop: '2rem', color: 'var(--accent-color)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                🏗️ システムアーキテクチャ (GCP & Firebase)
              </h3>
              <p>このアプリケーションは、Google Cloud Platform (GCP) と Firebase の各サービスを組み合わせ、本番運用可能な堅牢なアーキテクチャで構築されています。</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>📱 フロントエンド</h4>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}><strong>React + Vite + Firebase Hosting</strong><br/>高速な描画とGlassmorphismデザインを採用し、Firebase HostingのグローバルCDNを通じて高速配信されています。</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#fca5a5' }}>⚙️ バックエンドAPI</h4>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}><strong>Cloud Functions for Firebase v2</strong><br/>裏側は GCP Cloud Run で動くサーバーレス環境（Node.js/Express）。アクセス時のみ起動し、高負荷にも自動スケールで対応します。</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#fcd34d' }}>🗄️ データベース</h4>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}><strong>Cloud Firestore</strong><br/>フルマネージドなNoSQLデータベース。WebSocket経由でクライアントと常時接続し、データの変更を画面をリロードせずに「リアルタイム同期」します。</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#34d399' }}>🔐 セキュリティ＆認証</h4>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}><strong>Firebase Auth & Secret Manager</strong><br/>Google認証でユーザーを特定。Firestore Rulesで「他人のデータ」を強力にブロックし、Gemini APIキーはGCP Secret Managerで暗号化・隔離して安全に管理しています。</p>
                </div>
              </div>

              <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>🧠 学習（復習）のアルゴリズム</h3>
              <p>各フラッシュカードの裏には、「Forgot」「Hard」「Good」「Easy」の4つのボタンがあります。<br/>
              これを押すと、<strong>SuperMemo-2 (SM-2)</strong> に基づく間隔反復アルゴリズムが作動し、「次回の復習日時（nextReviewDate）」や「難易度（easeFactor）」が再計算されます。<br/>
              これにより、人間の脳が「忘れかける絶妙なタイミング」で再度カードが出題され、長期記憶への定着を圧倒的に高めます。</p>
            </div>
            
            {/* AI Assistant Chat Section */}
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h3>🤖 Memory Glass Assistant に質問する</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                「Firestoreのセキュリティルールって何？」や「間隔反復についてもっと詳しく教えて」など、気になることを聞いてみてください。
              </p>
              <AiChat 
                user={user}
                initialMessage="こんにちは！Memory Glassのアシスタントです。アプリの仕組みやアルゴリズムについて、何でも聞いてください。"
                placeholder="例: 間隔反復について詳しく教えて"
              />
            </div>
          </section>
        </main>
      ) : (
        <div style={{ width: '100%' }}>
          {/* Mobile Tabs (only visible on small screens) */}
          <div className="mobile-tabs">
            <button 
              className={`mobile-tab-btn ${activeTab === 'app' ? 'active' : ''}`}
              onClick={() => setActiveTab('app')}
            >
              📱 アプリ画面
            </button>
            <button 
              className={`mobile-tab-btn ${activeTab === 'db' ? 'active' : ''}`}
              onClick={() => setActiveTab('db')}
            >
              🗄️ データベース
            </button>
          </div>

          <main className={`main-content dashboard-layout show-${activeTab}`}>

        
        {/* Left Column: UI */}
        <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="section glass-panel">
            <h2>1. Input Information</h2>
            <UploadSection onUpload={handleUpload} />
            {isGenerating && (
              <div className="spinner-container">
                <div className="spinner"></div>
                <p className="loading-text">Generating AI Flashcards... Please wait.</p>
              </div>
            )}
          </section>

          {cards.length > 0 && (
            <>
              <section className="section glass-panel" style={{ border: '1px solid var(--accent-color)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.2rem', color: 'var(--accent-color)' }}>
                  📊 記憶定着度ダッシュボード (Memory Retention Status)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
                  SuperMemo-2 (SM-2) アルゴリズムに基づく現在の全カードの記憶強度と記憶定着度をリアルタイムに可視化しています。
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                  {/* Average Score Circle */}
                  <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      全体の平均定着度
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: avgRetention >= 70 ? '#34d399' : avgRetention >= 40 ? '#fcd34d' : '#f87171', marginTop: '0.5rem' }}>
                      {avgRetention}%
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                      {avgRetention >= 70 ? '🟢 定着状態：良好' : avgRetention >= 40 ? '🟡 定着状態：要復習' : '🔴 定着状態：忘却傾向'}
                    </div>
                  </div>

                  {/* Breakdown with Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>高定着度 (80%〜100%)</span>
                        <span>{highCount} 枚</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(highCount / cards.length) * 100 || 0}%`, height: '100%', background: '#34d399' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>中定着度 (40%〜79%)</span>
                        <span>{mediumCount} 枚</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(mediumCount / cards.length) * 100 || 0}%`, height: '100%', background: '#fcd34d' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>低定着度 (0%〜39%)</span>
                        <span>{lowCount} 枚</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(lowCount / cards.length) * 100 || 0}%`, height: '100%', background: '#f87171' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ color: 'white', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    2. Review Memories ({cards.length} cards)
                  </h2>
                  
                  {/* Mode Switcher */}
                  <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <button 
                      onClick={() => setReviewMode('list')}
                      style={{
                        background: reviewMode === 'list' ? 'var(--accent-color)' : 'transparent',
                        color: reviewMode === 'list' ? 'white' : 'var(--text-primary)',
                        border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '0.85rem'
                      }}
                    >
                      📋 一覧モード
                    </button>
                    <button 
                      onClick={() => {
                        setReviewMode('study');
                        setStudyIndex(0);
                      }}
                      style={{
                        background: reviewMode === 'study' ? 'var(--accent-color)' : 'transparent',
                        color: reviewMode === 'study' ? 'white' : 'var(--text-primary)',
                        border: 'none', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '0.85rem'
                      }}
                    >
                      🧠 定着学習モード
                    </button>
                  </div>
                </div>

                {reviewMode === 'list' ? (
                  <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {cards.map(card => (
                      <Flashcard key={card.id} card={card} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '100%' }}>
                    {studyCards.length > 0 ? (
                      <>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                          <span>学習の進捗</span>
                          <span>{studyIndex + 1} / {studyCards.length} 枚</span>
                        </div>
                        {/* Progressive indicator bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${((studyIndex + 1) / studyCards.length) * 100}%`, height: '100%', background: 'var(--accent-color)', transition: 'width 0.3s ease' }} />
                        </div>
                        
                        {/* Animated Card Container */}
                        <div 
                          key={studyCards[studyIndex]?.id}
                          className="study-card-container"
                          style={{
                            width: '100%',
                            animation: 'slideIn 0.4s ease-out'
                          }}
                        >
                          <Flashcard 
                            key={studyCards[studyIndex]?.id}
                            card={studyCards[studyIndex]} 
                            onReviewed={(cardId, quality) => {
                              if (isNavigating) return;
                              setIsNavigating(true);
                              setTimeout(() => {
                                if (studyIndex < studyCards.length - 1) {
                                  setStudyIndex(prev => prev + 1);
                                }
                                setIsNavigating(false);
                              }, 600);
                            }}
                          />
                        </div>

                        {/* Prev / Next buttons */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                          <button 
                            className="btn" 
                            disabled={studyIndex === 0}
                            onClick={() => setStudyIndex(prev => Math.max(0, prev - 1))}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1.2rem', color: 'var(--text-primary)', opacity: studyIndex === 0 ? 0.4 : 1 }}
                          >
                            ◀ 前へ
                          </button>
                          <button 
                            className="btn btn-primary" 
                            disabled={studyIndex === studyCards.length - 1}
                            onClick={() => setStudyIndex(prev => Math.min(studyCards.length - 1, prev + 1))}
                            style={{ padding: '0.5rem 1.2rem', opacity: studyIndex === studyCards.length - 1 ? 0.4 : 1 }}
                          >
                            次へ ▶
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                        <p style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold' }}>
                          素晴らしい！すべての復習が終わりました！
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                          定期的に定着学習を繰り返して、より長期記憶に定着させましょう。
                        </p>
                        <button 
                          className="btn" 
                          onClick={() => setReviewMode('list')}
                          style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        >
                          📋 全カード一覧へ戻る
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Right Column: DB Viewer */}
        <div className="right-column" style={{ position: 'sticky', top: '2rem', height: 'fit-content', maxHeight: 'calc(100vh - 8rem)' }}>
          <DbViewer data={cards} user={user} queryLogs={queryLogs} />
        </div>

          </main>
        </div>
      )}
    </div>
  )
}

export default App
