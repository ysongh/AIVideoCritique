require('dotenv').config();

const express = require("express");
const OpenAI = require('openai');

const router = express.Router();

const client = new OpenAI({
  baseURL: process.env.OPENAI_BASEURL,
  apiKey: process.env.OPENAI_APIKEY
});

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
    const dependencies = req.body.dependencies;
    console.log(dependencies);
    
    const response = await client.chat.completions.create({
      model: "Meta-Llama-3-8B-Instruct-Q5_K_M",
      messages: [
        { role: "system", content: "You are a IT securities expert." },
        { role: "user", content: `Is there any dependencies that is malicious: ${dependencies}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({
      feedback: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;