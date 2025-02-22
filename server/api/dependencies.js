require('dotenv').config();

const express = require("express");
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const client = new OpenAI({
  baseURL: process.env.OPENAI_BASEURL,
  apiKey: process.env.OPENAI_APIKEY
});

async function initializeGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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

    // const response = await client.chat.completions.create({
    //   model: "Meta-Llama-3-8B-Instruct-Q5_K_M",
    //   messages: [
    //     { role: "system", content: "You are a IT securities expert." },
    //     { role: "user", content: `Is there any dependencies that is malicious: ${dependencies}` }
    //   ],
    //   temperature: 0.7,
    //   max_tokens: 500
    // });

    // res.json({
    //   feedback: response.choices[0].message.content
    // });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;