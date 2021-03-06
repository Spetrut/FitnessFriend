const mongoose = require("mongoose");
require("../users/userModel.js");

const dietSchema = new mongoose.Schema({
  currentDiet: {
    type: Boolean,
    required: true
  },
  goal: {
    type: String,
    enum: ["Loose", "Maintain", "Gain"]
  },
  startingWeight: {
    type: Number,
    required: true
  },
  goalWeight: {
    type: Number,
    required: true
  },
  foodRestriction: {
    type: String,
    enum: ["vegan", "vegetarian", "none"]
  },
  calories: {
    type: Number
  },
  weighIns: [{ date: Date, weight: Number }],
  dailyDiets: [{ type: mongoose.Schema.Types.ObjectId, ref: "DailyDiet" }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

mongoose.model("Diet", dietSchema);
