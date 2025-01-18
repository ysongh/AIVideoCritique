require('dotenv').config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const YoutubeTranscript = require("youtube-transcript-api");

const app = express();

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

app.get('/', (req, res) => res.send('It Work'));

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});