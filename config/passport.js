const passport = require("passport");
const mongoose = require("mongoose");
require("../users/userModel.js");
const User = mongoose.model("User");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/fitness",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { googleId: profile.id },
        { username: profile.displayName },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/facebook/fitness"
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { facebookId: profile.id },
        { username: profile.displayName },
        function(err, user) {
          return cb(err, user);
        }
      );
    }
  )
);
