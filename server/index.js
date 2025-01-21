require('dotenv').config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const YoutubeTranscript = require("youtube-transcript-api");
const OpenAI = require('openai');

const app = express();
const client = new OpenAI({
  baseURL: 'https://llama8b.gaia.domains/v1',
  apiKey: ''
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/transcript/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    const transcript = await YoutubeTranscript.getTranscript(videoId);

    res.json({ transcript: transcript });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/texts/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
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

app.get('/', (req, res) => res.send('It Work'));

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});