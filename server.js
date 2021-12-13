// Main requirements and setup
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { json } = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
