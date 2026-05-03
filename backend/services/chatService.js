const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function handleChat(messages) {
  // Use a fast model for chat
  const model = "gemini-3.1-pro-preview";

  // System instruction for the assistant
  const systemInstruction = `
    You are the "Memory Glass Assistant", a technical AI assistant embedded within the Memory Glass application.
    Your job is to help the user understand the architecture, technologies, and algorithms behind this application.
    
    Context about Memory Glass:
    - Frontend: React, Vite, CSS (Glassmorphism design)
    - Backend: Node.js, Express
    - Database: Firebase Cloud Firestore
    - Auth: Firebase Authentication
    - AI: Google Gemini API
    
    Key Features:
    - Flashcard Generation: Users upload text or images. The backend uses Gemini to extract Q&A pairs and saves them to Firestore using the Firebase Admin SDK (which bypasses security rules).
    - Real-time Sync: The frontend uses Firestore's onSnapshot to automatically receive data updates without reloading.
    - Spaced Repetition (SuperMemo-2): When a user clicks a review button (Forgot, Hard, Good, Easy) on the frontend, it directly updates the Firestore document using the Client SDK. 
    - Security Rules: Because the frontend directly updates the DB during reviews, Firestore security rules (firestore.rules) are critical in production to ensure users can only modify their own flashcards.
    
    Be helpful, concise, and technically accurate. Speak in Japanese unless asked otherwise.
  `;

  // Format messages from frontend format { role, content } to Gemini format { role, parts: [{ text }] }
  const formattedContents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    throw new Error("Failed to generate chat response.");
  }
}

module.exports = { handleChat };
