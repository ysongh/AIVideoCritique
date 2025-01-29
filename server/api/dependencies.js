require('dotenv').config();

const express = require("express");
const YoutubeTranscript = require("youtube-transcript-api");
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

module.exports = router;