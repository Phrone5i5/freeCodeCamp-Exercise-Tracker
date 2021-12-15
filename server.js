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
    /* DELETE OR COMMENT THE FOLLOWING TWO LINES IF YOU DO NOT WANT TO DROP YOUR ENTIRE DATABASE UPON RESTART  */
    //mongoose.connection.db.dropDatabase();
    //console.log('Database dropped...');
    app.listen(process.env.PUBLIC_PORT, () => {
      console.log('*** Server started ***');
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
  date: { type: Date, default: Date.now },
});
// Declaring models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

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
      console.log('Saving user entry...');
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
        date: req.body.date,
      });
      exerciseEntry
        .save()
        .then((entry) => {
          Exercise.find({ username: user.username })
            .then((exercises) => {
              console.log('Saving exercise entry...');
              res.json({
                username: entry.username,
                description: entry.description,
                duration: entry.duration,
                date: entry.date.toDateString(),
                _id: user._id,
              });
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
});

// Get a list of all users
app.get('/api/users', (req, res) => {
  User.find({})
    .then((users) => {
      console.log('Sending list of all users.');
      res.json(users);
    })
    .catch((err) => console.log(err));
});

// Retrieve a full exercise log of given user is query string variables are undefined,
// if they are, use them to set limits and return all logs in the timespan, and limited by the limit
app.get('/api/users/:id/logs', async (req, res, next) => {
  if (!req.query.from && !req.query.to && !req.query.limit) {
    // Return the user's info, as well as their exercise count and full log
    await User.findOne({ _id: req.params.id })
      .then((user) => {
        Exercise.find({ username: user.username })
          .then((exercises) => {
            console.log('[FOUND] Returning user with added exercise count.');
            let formattedExercises = exercises.map((exercise) => {
              return {
                username: exercise.username,
                description: exercise.description,
                duration: exercise.duration,
                date: exercise.date.toDateString(),
              };
            });
            res.json({
              username: formattedExercises[0].username,
              count: formattedExercises.length,
              log: formattedExercises.map((exercise) => {
                delete exercise.username;
                return exercise;
              }),
              id: user._id,
            });
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else {
    next();
  }
});

app.get('/api/users/:_id/logs', async (req, res, next) => {
  // Return the user's logs across a given time frame
  if (req.query.from || req.query.to || req.query.limit) {
    let from = req.query.from ? req.query.from : null,
      to = req.query.to ? req.query.to : null,
      limit = req.query.limit ? req.query.limit : null;
    let userProfile;
    User.findOne({ _id: req.params._id })
      .then((user) => {
        userProfile = user;
        Exercise.find({ username: user.username })
          .sort({ date: 'asc' })
          .then((exercises) => {
            let count = 0;
            return exercises
              .filter((exercise, i) => {
                from ? (from = new Date(from).getTime()) : (from = 0);
                to ? (to = new Date(to).getTime()) : (to = exercises[exercises.length - 1].date.getTime());
                limit ? (limit = limit) : (limit = exercises.length);
                let exerciseDate = exercise.date.getTime();
                if (exerciseDate >= from && exerciseDate <= to && count <= limit) {
                  count++;
                  return true;
                } else {
                  return false;
                }
              })
              .map((exercise) => {
                return {
                  description: exercise.description,
                  duration: exercise.duration,
                  date: exercise.date.toDateString(),
                };
              });
          })
          .then((filteredLog) => {
            return res.json({
              username: userProfile.username,
              count: filteredLog.length,
              _id: userProfile._id,
              log: filteredLog,
            });
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else {
    next();
  }
});

const listener = app.listen(process.env.PORT, () => {
  console.log(
    '*** Your app is listening on port ' + listener.address().port + ' ***'
  );
});
