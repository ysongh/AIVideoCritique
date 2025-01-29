const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const video = require("./api/video");
const dependencies = require("./api/dependencies");

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.use('/api/video', video);
app.use('/api/dependencies', dependencies);
app.get('/', (req, res) => res.send('It Work'));

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});