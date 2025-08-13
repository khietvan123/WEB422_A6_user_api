const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let User;

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  favourites: [Number],
  history: [String]
});

module.exports.init = function(connectionString) {
  return new Promise((resolve, reject) => {
    mongoose.connect(connectionString)
      .then(() => {
        User = mongoose.model('users', userSchema);
        resolve();
      })
      .catch(err => reject(err));
  });
};


module.exports.addUser = function(userName, password, password2) {
  return new Promise((resolve, reject) => {
    if (password !== password2) {
      return reject("Passwords do not match");
    }
    bcrypt.hash(password, 10)
      .then(hash => {
        let newUser = new User({ userName, password: hash, favourites: [], history: [] });
        return newUser.save();
      })
      .then(() => resolve("User registered successfully"))
      .catch(err => {
        if (err.code === 11000) reject("User Name already taken");
        else reject("There was an error creating the user: " + err);
      });
  });
};

module.exports.checkUser = function(userName, password) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName }).exec()
      .then(user => {
        if (!user) reject("Unable to find user: " + userName);
        else return bcrypt.compare(password, user.password).then(match => {
          if (match) resolve(user);
          else reject("Incorrect Password for user: " + userName);
        });
      })
      .catch(err => reject("There was an error: " + err));
  });
};

module.exports.getFavourites = userId => User.findById(userId).then(u => u.favourites);
module.exports.addFavourite = (userId, id) => User.findByIdAndUpdate(userId, { $addToSet: { favourites: id } }, { new: true }).then(u => u.favourites);
module.exports.removeFavourite = (userId, id) => User.findByIdAndUpdate(userId, { $pull: { favourites: id } }, { new: true }).then(u => u.favourites);

module.exports.getHistory = userId => User.findById(userId).then(u => u.history);
module.exports.addHistory = (userId, q) => User.findByIdAndUpdate(userId, { $addToSet: { history: q } }, { new: true }).then(u => u.history);
module.exports.removeHistory = (userId, q) => User.findByIdAndUpdate(userId, { $pull: { history: q } }, { new: true }).then(u => u.history);
