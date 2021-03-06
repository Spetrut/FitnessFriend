const mongoose = require("mongoose");
require(__dirname + "/userModel.js");
const User = mongoose.model("User");
require("../diets/dietModel.js");
const Diet = mongoose.model("Diet");
require("../diets/dailyDietModel.js");
const DailyDiet = mongoose.model("DailyDiet");
const passport = require("passport");
require("../config/passport.js");
const nexmo = require("../config/nexmo.js");
const schedule = require("node-schedule");

module.exports.register = function(req, res) {
  User.register({ username: req.body.username }, req.body.password)
    .then(() => {
      passport.authenticate("local")(req, res, function() {
        res.redirect("dietPage");
      });
    })
    .catch(err => {
      console.log(err);
      res.status(400);
      res.send(err);
    });
};

module.exports.login = function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.logIn(user, function(err) {
    if (err) {
      console.log(err);
      res.status(400);
      res.send(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        if (req.user.diets.length > 0) {
          res.redirect("/api/program");
        } else {
          res.redirect("/api/diet");
        }
      });
    }
  });
};

module.exports.googleAuth = passport.authenticate("google", {
  scope: ["profile"]
});

module.exports.findUserById = function(userId, callback) {
  User.findById(userId, function(err, foundUser) {
    callback(foundUser);
  });
};

module.exports.subscribeToDailyTextMessage = function(req, res) {
  if (!req.isAuthenticated()) {
    res.status(401);
    res.send(process.env.NOT_AUTHENTICATED_TEXT);
  }
  User.findById(req.user._id, function(err, foundUser) {
    foundUser.subscribedToTextMessages = true;
    // foundUser.phoneNumber = req.body.phoneNumber;
    foundUser.phoneNumber = process.env.DEV_PHONE_NUMBER;
    foundUser.save();
    nexmo.message.sendSms(
      process.env.NEXMO_FROM,
      foundUser.phoneNumber,
      process.env.NEXMO_HELLO_TEXT
    );
    res.redirect("/api/program");
  });
};
module.exports.unsubscribeToDailyTextMessage = function(req, res) {
  if (!req.isAuthenticated()) {
    res.status(401);
    res.send(process.env.NOT_AUTHENTICATED_TEXT);
  }
  User.findById(req.user._id, function(err, foundUser) {
    foundUser.subscribedToTextMessages = false;
    foundUser.phoneNumber = "";
    foundUser.save();
    res.send("Unsubscribed from daily text messages");
  });
};

schedule.scheduleJob("0 9 * * *", function() {
  sendTextMessages();
});
function sendTextMessages(req, res) {
  if (req) {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      res.status(401);
      res.json({ message: "Unauthorized" });
      return res;
    }
  }
  User.find({ subscribedToTextMessages: true }, function(err, subscribers) {
    subscribers.forEach(subscriber => {
      Diet.findById(subscriber.diets[subscriber.diets.length - 1], function(
        err,
        foundDiet
      ) {
        DailyDiet.findById(foundDiet.dailyDiets[6], function(
          err,
          foundDailyDiet
        ) {
          let messageText =
            " Hello, here is your first meal of the day:" +
            foundDailyDiet.firstMeal.recipe.label +
            "\n";
          nexmo.message.sendSms(
            process.env.NEXMO_FROM,
            subscriber.phoneNumber,
            messageText
          );
          if (req) {
            res.send("Sending text messages to users...");
          }
        });
      });
    });
  });
}

module.exports.sendTextMessages = sendTextMessages;

module.exports.deleteUser = function(req, res) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(401);
    res.json({ message: "Unauthorized" });
    return res;
  } else {
    User.deleteOne({ _id: req.params.userId }, function(err) {
      if (err) {
        res.send(err);
      }
      res.send("User has been deleted");
    });
  }
};

module.exports.updateUser = function(req, res) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    res.status(401);
    res.json({ message: "Unauthorized" });
    return res;
  } else {
    User.updateOne({ _id: req.params.userId }, { ...req.body }, function(err) {
      if (err) {
        res.send(err);
      }
      res.send("User has been updated");
    });
  }
};
