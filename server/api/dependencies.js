require('dotenv').config();

const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

async function initializeGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const multimodalModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  
  return { model, multimodalModel };
}

router.get('/test', async (req, res) => {
  try {
    res.json({ status: "It works" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkismalicious', async (req, res) => {
  try {
    const { model } = await initializeGemini();
    
    const dependencies = req.body.dependencies;
    console.log(dependencies);
    const formattedData = JSON.stringify(dependencies, null, 2);

    const prompt = `Is there any dependencies that is malicious: ${formattedData}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log(response.text());

    res.json({ text: response.text() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;