var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  like: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    },
  ],
  created: {
    type: Date,
    default: Date.now(),
  },
  updated: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Posts", PostSchema);
