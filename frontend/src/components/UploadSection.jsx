import { useState } from 'react';
import './UploadSection.css';

export default function UploadSection({ onUpload }) {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'text' && text) {
      onUpload({ type: 'text', content: text });
      setText('');
    } else if (activeTab === 'image' && file) {
      onUpload({ type: 'image', file });
      setFile(null);
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
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
            <label htmlFor="file-upload" className="file-label">
              {file ? file.name : "Click to select or drag and drop an image"}
            </label>
          </div>
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
