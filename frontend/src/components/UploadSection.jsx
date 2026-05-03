import { useState } from 'react';
import './UploadSection.css';

export default function UploadSection({ onUpload }) {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState('');

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

  // Convert image to JPEG using canvas (handles HEIC from iPhone)
  const processImage = (originalFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(originalFile);

      img.onload = () => {
        // Resize if too large (max 1600px on longest side)
        let { width, height } = img;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              reject(new Error('Image conversion failed'));
              return;
            }
            const converted = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            resolve(converted);
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFileError('');
    setFile(null);
    setPreview(null);

    try {
      // Always convert through canvas to ensure JPEG format and reasonable size
      const processed = await processImage(selectedFile);

      if (processed.size > MAX_FILE_SIZE) {
        setFileError(`ファイルサイズが大きすぎます (${(processed.size / 1024 / 1024).toFixed(1)}MB)。4MB以下の画像を選択してください。`);
        return;
      }

      setFile(processed);
      setPreview(URL.createObjectURL(processed));
    } catch (err) {
      console.error('Image processing error:', err);
      setFileError('画像の読み込みに失敗しました。別の画像をお試しください。');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'text' && text) {
      onUpload({ type: 'text', content: text });
      setText('');
    } else if (activeTab === 'image' && file) {
      onUpload({ type: 'image', file });
      setFile(null);
      setPreview(null);
    }
  };

  return (
    <div className="upload-section">
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Text Input
        </button>
        <button 
          className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          Photo Upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {activeTab === 'text' ? (
          <div className="input-group">
            <textarea
              className="input-field"
              placeholder="Paste your notes or text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>
        ) : (
          <div className="input-group file-drop-area">
            <input 
              type="file" 
              id="file-upload" 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-label">
              {file ? `✅ ${file.name} (${(file.size / 1024).toFixed(0)}KB)` : "📷 タップして写真を撮影 または 画像を選択"}
            </label>
            {preview && (
              <img src={preview} alt="Preview" style={{ position: 'absolute', top: '8px', right: '8px', width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--glass-border)' }} />
            )}
          </div>
          {fileError && (
            <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>{fileError}</p>
          )}
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary submit-btn"
          disabled={(activeTab === 'text' && !text) || (activeTab === 'image' && !file)}
        >
          Generate Memories
        </button>
      </form>
    </div>
  );
}
