var express = require("express");
var router = express.Router();
var auth = require("../middleware/check-auth");
var jwt = require("jsonwebtoken");
var Post = require("../../models/Post");
var Comment = require("../../models/Comment");
var User = require("../../models/User");
var multer = require("multer");
var upload = multer({ dest: "public/images/uploads/" });
var fs = require("fs");

router.get("/", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  Post.countDocuments({ author: decode.id }, function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      Comment.countDocuments({ commenter: decode.id }, function (err2, rtn2) {
        if (err2) {
          res.status(500).json({
            message: "Internal server error",
            error: err2,
          });
        } else {
          Comment.countDocuments({ author: decode.id }, function (err3, rtn3) {
            if (err3) {
              res.status(500).json({
                message: "Internal server error",
                error: err3,
              });
            } else {
              User.findById(decode.id)
                .select("favoriteB")
                .exec(function (err4, rtn4) {
                  if (err4) {
                    res.status(500).json({
                      message: "Internal server error",
                      error: err4,
                    });
                  } else {
                    res.status(200).json({
                      message: "User Home Page",
                      postCount: rtn,
                      giveComment: rtn2,
                      getComment: rtn3,
                      favBlogger: rtn4.favoriteB.length,
                    });
                  }
                });
            }
          });
        }
      });
    }
  });
});

router.post("/postadd", auth, upload.single("photo"), function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  var post = new Post();
  post.title = req.body.title;
  post.content = req.body.content;
  post.author = decode.id;
  post.created = Date.now();
  post.updated = Date.now();
  if (req.file) post.image = "/images/uploads/" + req.file.filename;
  post.save(function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      res.status(201).json({
        message: "Post created success",
      });
    }
  });
});

router.get("/mypostlist", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  Post.find({ author: decode.id })
    .populate("author")
    .exec(function (err, rtn) {
      if (err) {
        res.status(500).json({
          message: "Internal server error",
          error: err,
        });
      } else {
        res.status(200).json({
          message: "My post list",
          posts: rtn,
        });
      }
    });
});

router.get("/postdetail/:id", auth, function (req, res) {
  Post.findById(req.params.id)
    .populate("author")
    .exec(function (err, rtn) {
      if (err) {
        res.status(500).json({
          message: "Internal server error",
          error: err,
        });
      } else {
        Comment.find({ post: req.params.id })
          .populate("commenter", "name")
          .select("commenter comment reply created updated")
          .exec(function (err2, rtn2) {
            if (err2) {
              res.status(500).json({
                message: "Internal server error",
                error: err2,
              });
            } else {
              res.status(200).json({
                message: "User Post Detail",
                post: rtn,
                comments: rtn2,
              });
            }
          });
      }
    });
});

router.patch("/postupdate", auth, upload.single("photo"), function (req, res) {
  var update = {
    title: req.body.title,
    content: req.body.content,
    updated: Date.now(),
  };
  if (req.file) {
    fs.unlink("public" + req.body.old_image, function (err) {
      if (err) {
        res.status(500).json({
          message: "Internal server old image delete error",
          error: err,
        });
      }
    });
    update.image = "/images/uploads/" + req.file.filename;
  }
  Post.findByIdAndUpdate(req.body.id, { $set: update }, function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      res.status(200).json({
        message: "Post Update Success",
      });
    }
  });
});

router.delete("/postdelete/:id", auth, function (req, res) {
  Post.findByIdAndDelete(req.params.id, function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      Comment.deleteMany({ post: req.params.id }, function (err2, rtn2) {
        if (err2) {
          res.status(500).json({
            message: "Internal server error",
            error: err,
          });
        } else {
          res.status(200).json({
            message: "Post Deleted",
          });
        }
      });
    }
  });
});

router.post("/givecomment", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  var comment = new Comment();
  comment.post = req.body.post;
  comment.author = req.body.author;
  comment.comment = req.body.comment;
  comment.commenter = decode.id;
  comment.created = Date.now();
  comment.updated = Date.now();
  comment.save(function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      res.status(201).json({
        message: "Comment created",
      });
    }
  });
});

router.patch("/givereply", auth, function (req, res) {
  var update = {
    reply: req.body.reply,
    updated: Date.now(),
  };
  Comment.findByIdAndUpdate(
    req.body.cid,
    { $set: update },
    function (err, rtn) {
      if (err) {
        res.status(500).json({
          message: "Internal server error",
          error: err,
        });
      } else {
        res.status(200).json({
          message: "Give reply success",
        });
      }
    }
  );
});

router.post("/givelike", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  if (req.body.type === "like") {
    Post.findByIdAndUpdate(
      req.body.post,
      { $push: { like: { user: decode.id } } },
      function (err, rtn) {
        if (err) {
          res.status(500).json({
            message: "Internal server error",
            error: err,
          });
        } else {
          res.status(200).json({
            message: "Post like process is done",
          });
        }
      }
    );
  } else {
    Post.findById(req.body.post, function (err, rtn) {
      if (err) {
        res.status(500).json({
          message: "Internal server error",
          error: err,
        });
      } else {
        var likelist = rtn.like.filter(function (data) {
          return data.user != decode.id;
        });
        Post.findByIdAndUpdate(
          req.body.post,
          { $set: { like: likelist } },
          function (err2, rtn2) {
            if (err2) {
              res.status(500).json({
                message: "Internal server error",
                error: err2,
              });
            } else {
              res.status(200).json({
                message: "Post unlike process is done",
              });
            }
          }
        );
      }
    });
  }
});

router.post("/followauthor", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  if (req.body.type == "follow") {
    User.findByIdAndUpdate(
      decode.id,
      { $push: { favoriteB: { blogger: req.body.author } } },
      function (err, rtn) {
        if (err) {
          res.status(500).json({
            message: "Internal server error",
            error: err,
          });
        } else {
          res.status(200).json({
            message: "Follow process is done",
          });
        }
      }
    );
  } else {
    User.findById(decode.id, function (err, rtn) {
      if (err) {
        res.status(500).json({
          message: "Internal server error",
          error: err,
        });
      } else {
        var bloggerlist = rtn.favoriteB.filter(function (data) {
          return data.blogger != req.body.author;
        });
        User.findByIdAndUpdate(
          decode.id,
          { $set: { favoriteB: bloggerlist } },
          function (err2, rtn2) {
            if (err2) {
              res.status(500).json({
                message: "Internal server error",
                error: err2,
              });
            } else {
              res.status(200).json({
                message: "Unfollow process is done",
              });
            }
          }
        );
      }
    });
  }
});

router.get("/favbloglist", auth, function (req, res) {
  var decode = jwt.verify(req.headers.token, "techApi002");
  User.findById(decode.id, function (err, rtn) {
    if (err) {
      res.status(500).json({
        message: "Internal server error",
        error: err,
      });
    } else {
      var favlist = [];
      rtn.favoriteB.forEach(function (element) {
        favlist.push(element.blogger);
      });
      Post.find({ author: { $in: favlist } })
        .populate("author", "name")
        .exec(function (err2, rtn2) {
          if (err2) {
            res.status(500).json({
              message: "Internal server error",
              error: err2,
            });
          } else {
            res.status(200).json({ message: "Fav blog list", posts: rtn2 });
          }
        });
    }
  });
});

module.exports = router;
