const { GoogleGenAI } = require('@google/genai');

// Initialize the client explicitly with the API key to avoid conflict with Firebase service account
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateFlashcards(text, imageFile) {
  // We use gemini-3.1-pro-preview for complex reasoning and structured output as per skill guidelines.
  const model = "gemini-3.1-pro-preview";
  
  let contents = [];
  
  if (imageFile) {
    // If an image is provided, we pass the image bytes
    contents.push({
      inlineData: {
        data: imageFile.buffer.toString('base64'),
        mimeType: imageFile.mimetype
      }
    });
  }
  
  if (text) {
    contents.push(text);
  }

  const prompt = `
    You are an AI study assistant. Analyze the provided text and/or image (notes/whiteboard).
    Extract the most important concepts and create a set of Q&A flashcards for Spaced Repetition learning.
    Return the response ONLY as a JSON array of objects.
    Each object must have "front" (the question) and "back" (the answer).
    Make the questions concise and the answers clear and easy to memorize.
  `;
  
  contents.push(prompt);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    const cards = JSON.parse(jsonText);
    return cards;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate flashcards.");
  }
}

module.exports = { generateFlashcards };
