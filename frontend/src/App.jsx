import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { auth, db } from './lib/firebase' // Initialize Firebase based on skills
import './App.css'
import UploadSection from './components/UploadSection'
import Flashcard from './components/Flashcard'
import DbViewer from './components/DbViewer'
import AboutChat from './components/AboutChat'
import './lib/firebase' // Initialize Firebase based on skills

function App() {
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [activeTab, setActiveTab] = useState('app'); // 'app' or 'db'

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
      const formData = new FormData();
      
      if (data.type === 'text') {
        formData.append('text', data.content);
      } else if (data.type === 'image') {
        formData.append('image', data.file);
      }

      const response = await fetch('https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api/api/generate-cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
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
              <AboutChat user={user} />
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
            <section className="section">
              <h2 style={{ marginBottom: '1.5rem', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                2. Review Memories ({cards.length} cards)
              </h2>
              <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {cards.map(card => (
                  <Flashcard key={card.id} card={card} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: DB Viewer */}
        <div className="right-column" style={{ position: 'sticky', top: '2rem', height: 'fit-content', maxHeight: 'calc(100vh - 8rem)' }}>
          <DbViewer data={cards} />
        </div>

          </main>
        </div>
      )}
    </div>
  )
}

export default App
