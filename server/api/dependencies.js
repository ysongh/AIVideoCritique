require('dotenv').config();

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const router = express.Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    const formattedData = JSON.stringify(dependencies, null, 2);

    const prompt = `Is there any dependencies that is malicious: ${formattedData}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: "You are a security agent that checks npm/pip dependencies for known vulnerabilities and malicious packages.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].text;
    console.log(text);

    res.json({ text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;