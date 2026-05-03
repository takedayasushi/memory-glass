import { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import './Flashcard.css';

export default function Flashcard({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("このカードを削除してもよろしいですか？")) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const cardRef = doc(db, 'users', user.uid, 'cards', card.id);
      await deleteDoc(cardRef);
    } catch (err) {
      console.error("Delete error:", err);
      alert("カードの削除に失敗しました。");
    }
  };

  const handleReview = async (quality) => {
    // SuperMemo-2 Algorithm calculation
    let newInterval = card.interval || 0;
    let newEaseFactor = card.easeFactor || 2.5;

    if (quality < 3) {
      newInterval = 1;
    } else {
      if (newInterval === 0) newInterval = 1;
      else if (newInterval === 1) newInterval = 6;
      else newInterval = Math.round(newInterval * newEaseFactor);
    }

    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    const nextDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const cardRef = doc(db, 'users', user.uid, 'cards', card.id);
      await updateDoc(cardRef, {
        interval: newInterval,
        easeFactor: Number(newEaseFactor.toFixed(2)),
        nextReviewDate: nextDate
      });
      console.log(`Updated Card: interval=${newInterval}, ease=${newEaseFactor.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to update card in DB:", error);
      alert("Failed to save review result.");
    }

    setIsFlipped(false);
  };

  // Helper to format date for metadata display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle both Firestore Timestamp and JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => !isFlipped && setIsFlipped(true)}>
      <div className="flashcard-inner">
        
        {/* Front side (Question) */}
        <div className="flashcard-front glass-panel">
          <button 
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.75rem',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            title="カードを削除"
          >
            ✕
          </button>
          <div className="card-content">
            <span className="card-label">Question</span>
            <p className="card-text">{card.front}</p>
          </div>
          <div className="card-hint">
            <span className="hint-text">Click to flip</span>
          </div>
          {/* Metadata Display (For Developer Dashboard/Learning) */}
          <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '10px' }}>
            <span>Next: {formatDate(card.nextReviewDate)}</span>
            <span>Int: {card.interval || 0}d</span>
            <span>Ease: {card.easeFactor ? card.easeFactor.toFixed(2) : '2.50'}</span>
          </div>
        </div>

        {/* Back side (Answer) */}
        <div className="flashcard-back glass-panel">
          <button 
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.75rem',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            title="カードを削除"
          >
            ✕
          </button>
          <div className="card-content">
             <span className="card-label">Answer</span>
             <p className="card-text">{card.back}</p>
          </div>
          
          <div className="review-actions">
            <button className="review-btn forgot" onClick={(e) => { e.stopPropagation(); handleReview(1); }}>
              Forgot
            </button>
            <button className="review-btn hard" onClick={(e) => { e.stopPropagation(); handleReview(3); }}>
              Hard
            </button>
            <button className="review-btn good" onClick={(e) => { e.stopPropagation(); handleReview(4); }}>
              Good
            </button>
            <button className="review-btn easy" onClick={(e) => { e.stopPropagation(); handleReview(5); }}>
              Easy
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
