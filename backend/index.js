require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const authMiddleware = require('./middleware/authMiddleware');
const { generateFlashcards } = require('./services/geminiService');
const { handleChat } = require('./services/chatService');
const { db } = require('./services/firebaseAdmin');

const app = express();
const port = process.env.PORT || 3000;

// Set up Multer for memory storage (file buffer)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://memory-glass-2026.web.app',
  'https://memory-glass-2026.firebaseapp.com'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

app.get('/api/debug-env', (req, res) => {
  res.json({
    geminiKeyExists: !!process.env.GEMINI_API_KEY,
    geminiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) : null,
    envKeys: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('KEY'))
  });
});

// API Endpoint to generate and save flashcards
app.post('/api/generate-cards', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const file = req.file;

    if (!text && !file) {
      return res.status(400).json({ error: 'Please provide text or an image.' });
    }

    console.log(`Processing request for user UID: ${req.user.uid}`);

    // Call Gemini API
    const cards = await generateFlashcards(text, file);
    
    // Save generated cards to Firestore under the user's document
    // Collection: users -> {uid} -> cards
    const userCardsRef = db.collection('users').doc(req.user.uid).collection('cards');
    
    const savedCards = [];
    const batch = db.batch();
    
    for (const card of cards) {
      const docRef = userCardsRef.doc(); // Auto ID
      const cardData = {
        front: card.front,
        back: card.back,
        createdAt: new Date(),
        nextReviewDate: new Date(), // Initialize for Spaced Repetition
        interval: 0,
        easeFactor: 2.5
      };
      batch.set(docRef, cardData);
      savedCards.push({ id: docRef.id, ...cardData });
    }

    await batch.commit();
    console.log(`Successfully saved ${savedCards.length} cards for user ${req.user.uid}`);

    // Return the saved cards to the frontend
    res.json({ success: true, cards: savedCards });

  } catch (error) {
    console.error('Error generating cards:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// AI Chat Endpoint
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'Invalid messages format' });
    }

    const reply = await handleChat(messages);
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

// Only listen locally if run directly via node
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Memory Glass backend listening at http://localhost:${port}`);
  });
}

// Export for Firebase Functions (Production)
const { onRequest } = require("firebase-functions/v2/https");
exports.api = onRequest({ 
  region: "asia-northeast1", 
  memory: "512MiB",
  timeoutSeconds: 120,
  secrets: ["GEMINI_API_KEY"] // Will bind the secret from GCP Secret Manager
}, app);
