var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  post: {
    type: Schema.Types.ObjectId,
    ref: "Posts",
  },
  comment: {
    type: String,
    required: true,
  },
  reply: {
    type: String,
  },
  commenter: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
  created: {
    type: Date,
    default: Date.now(),
  },
  updated: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Comments", CommentSchema);
