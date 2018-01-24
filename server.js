"use strict";

const express = require("express");
const mongo = require("mongodb");
const mongoose = require("mongoose");
const dns = require("dns");
const cors = require("cors");
const bodyParser = require("body-parser");
const request = require('request');

const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {useMongoClient: true});

app.use(cors());

app.use("/public", express.static(process.cwd() + "/public"));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});


const searchSchema = mongoose.Schema({
  term: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
});

const searchHistory = mongoose.model("searchHistory", searchSchema);

app.get("/api/imagesearch/:term", (req, res) => {
  // define offset/page
  const page = req.query.offset === undefined? 1 : req.query.offset;
  // make a request to the api and respond with the results
  request(`https://pixabay.com/api/?key=${process.env.PIXABAY_KEY}&q=${req.params.term}&image_type=photo&page=${page}`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      const info = JSON.parse(body);
      let output = [];

      for(let k=0; k < info.hits.length; k++) {
       output.push({
         img_url: info.hits[k].webformatURL,
         tags: info.hits[k].tags,
         source: info.hits[k].pageURL
       });
      }

      const searchForm = new searchHistory({term: req.params.term, time: new Date()});
      searchForm.save();

      res.json(output);
    }

  });
});

app.get("/api/history", (req, res) => {
  searchHistory.find({})
    .then(doc=> res.json(doc))
    .catch(err=> res.send({message: err}))

});

app.listen(port, () => {
  console.log("Node.js listening ...");
});
