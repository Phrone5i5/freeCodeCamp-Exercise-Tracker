// Program Requirements
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config({ path: './sample.env' });
const { json } = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
// App config
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Mongoose config & connection
try {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
  mongoose.connection.on('open', () => {
    app.listen(process.env.PUBLIC_PORT, () => {
      console.log('*** Server started. ***');
    });
  });
} catch (e) {
  console.log(e.message);
}
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
});
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
});
// Declaring models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

/* Database interaction methods */
// Submitting user input

// Searching / modifying

/* Routes */
// Create a new user
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let userEntry = new User({
    username: username,
    _id: new mongoose.Types.ObjectId(),
  });
  userEntry
    .save()
    .then((entry) => {
      console.log('Saving user entry');
      res.json(entry);
    })
    .catch((err) => console.log(err));
});

// Get a new exercise and add it to the database
app.post('/api/users/:_id/exercises', (req, res) => {
  User.findOne({ _id: req.params._id })
    .then((user) => {
      let exerciseEntry = new Exercise({
        username: user.username,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date).toDateString() : new Date(Date.now()).toDateString(),
        _id: user._id,
      });
      exerciseEntry
        .save()
        .then((entry) => {
          console.log('Saving exercise entry.');
          res.json(entry);
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
});

// Get a list of all users
app.get('/api/users', (req, res) => {
  User.find({}).then(users => {
    console.log('Sending list of all users.');
    res.json(users);
  }).catch(err => console.log(err));
});

// Retrieve a full exercise log of given user is query string variables are undefined,
// if they are, use them to set limits and return all logs in the timespan, and limited by the limit
app.get('/api/users/:_id/logs/from?to?limit?', (req, res) => {
  // Use req.params for id, and req.query for query string parameters
  let id = req.params._id;
});

// Retrieve a user with a count of exercises that belong to them
app.get('/api/users/:id/logs', async (req, res) => {
  const exerArr = await Exercise.find({ _id: req.params.id }).exec();
  User.findOne({ _id: req.params.id }).then(user => {
    console.log('[FOUND] Returning user with added exercise count.');
    res.json({
      username: user.username,
      count: exerArr.length,
      _id: user._id,
    });
  }).catch(err => console.log(err));
});

const listener = app.listen(process.env.PORT, () => {
  console.log('*** Your app is listening on port ' + listener.address().port + " ***");
});
