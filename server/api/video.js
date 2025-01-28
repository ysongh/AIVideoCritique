require('dotenv').config();

const express = require("express");
const YoutubeTranscript = require("youtube-transcript-api");
const OpenAI = require('openai');

const router = express.Router();

const client = new OpenAI({
  baseURL: process.env.OPENAI_BASEURL,
  apiKey: process.env.OPENAI_APIKEY
});

router.get('/transcript/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const transcript = await YoutubeTranscript.getTranscript(videoId);

    res.json({ transcript: transcript });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/validateID/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const isValidate = await YoutubeTranscript.validateID(videoId);

    res.json({ isValidate: isValidate });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/texts', async (req, res) => {
  try {
    const videoId = req.body.videoID;

    const isValidate = await YoutubeTranscript.validateID(videoId);
    if (!isValidate) return res.status(400).json({ error: "This Video does not exists on YouTube" });

    const transcript = await YoutubeTranscript.getTranscript(videoId);
    const text = transcript.map(item => item.text).join(' ');

    const response = await client.chat.completions.create({
      model: "Meta-Llama-3-8B-Instruct-Q5_K_M",
      messages: [
        { role: "system", content: "You are a strategic reasoner." },
        { role: "user", content: `I need feedback on my video. ${text}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({
      text: text,
      feedback: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/texts/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    const isValidate = await YoutubeTranscript.validateID(videoId);
    if (!isValidate) return res.status(400).json({ error: "This Video does not exists on YouTube" });

    const transcript = await YoutubeTranscript.getTranscript(videoId);
    const text = transcript.map(item => item.text).join(' ');

    const response = await client.chat.completions.create({
      model: "Meta-Llama-3-8B-Instruct-Q5_K_M",
      messages: [
        { role: "system", content: "You are a strategic reasoner." },
        { role: "user", content: `I need feedback on my video. ${text}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({
      text: text,
      feedback: response.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;