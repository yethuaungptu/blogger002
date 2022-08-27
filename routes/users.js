var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "public/images/uploads/" });
var Post = require("../models/Post");
var Comment = require("../models/Comment");
var User = require("../models/User");
var fs = require("fs");

var auth = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
/* GET users listing. */
router.get("/", auth, function (req, res, next) {
  Post.countDocuments({ author: req.session.user.id }, function (err, rtn) {
    if (err) throw err;
    Comment.countDocuments(
      { commenter: req.session.user.id },
      function (err2, rtn2) {
        if (err2) throw err2;
        Comment.countDocuments(
          { author: req.session.user.id },
          function (err3, rtn3) {
            if (err3) throw err3;
            User.findById(req.session.user.id)
              .select("favoriteB")
              .exec(function (err4, rtn4) {
                if (err4) throw err4;
                res.render("user/profile", {
                  postCount: rtn,
                  giveComment: rtn2,
                  getComment: rtn3,
                  favBlogger: rtn4.favoriteB.length,
                });
              });
          }
        );
      }
    );
  });
});

router.get("/postadd", auth, function (req, res, next) {
  res.render("user/postadd");
});

router.post("/postadd", auth, upload.single("photo"), function (req, res) {
  var post = new Post();
  post.title = req.body.title;
  post.content = req.body.content;
  post.author = req.session.user.id;
  post.created = Date.now();
  post.updated = Date.now();
  if (req.file) post.image = "/images/uploads/" + req.file.filename;
  post.save(function (err, rtn) {
    if (err) throw err;
    res.redirect("/");
  });
});

router.get("/mypostlist", auth, function (req, res) {
  Post.find({ author: req.session.user.id })
    .populate("author")
    .exec(function (err, rtn) {
      if (err) throw err;
      res.render("user/postlist", { posts: rtn });
    });
});

router.get("/postdetail/:id", auth, function (req, res) {
  Post.findById(req.params.id)
    .populate("author")
    .exec(function (err, rtn) {
      if (err) throw err;
      Comment.find({ post: req.params.id })
        .populate("commenter", "name")
        .select("commenter comment reply created updated")
        .exec(function (err2, rtn2) {
          if (err2) throw err2;
          res.render("user/postdetail", { post: rtn, comments: rtn2 });
        });
    });
});

router.get("/postupdate/:id", auth, function (req, res) {
  Post.findById(req.params.id, function (err, rtn) {
    if (err) throw err;
    res.render("user/postupdate", { post: rtn });
  });
});

router.post("/postupdate", auth, upload.single("photo"), function (req, res) {
  var update = {
    title: req.body.title,
    content: req.body.content,
    updated: Date.now(),
  };
  if (req.file) {
    Post.findById(req.body.id)
      .select("image")
      .exec(function (err2, rtn2) {
        if (err2) throw err2;
        fs.unlink("public" + rtn2.image, function (err) {
          if (err) throw err;
        });
      });
    update.image = "/images/uploads/" + req.file.filename;
  }
  Post.findByIdAndUpdate(req.body.id, { $set: update }, function (err, rtn) {
    if (err) throw err;
    res.redirect("/users/mypostlist");
  });
});

router.get("/postdelete/:id", auth, function (req, res) {
  Post.findByIdAndDelete(req.params.id, function (err, rtn) {
    if (err) throw err;
    Comment.deleteMany({ post: req.params.id }, function (err2, rtn2) {
      if (err2) throw err2;
      fs.unlink("public" + rtn.image, function (err) {
        if (err) throw err;
        res.redirect("/users/mypostlist");
      });
    });
  });
});

router.post("/givecomment", auth, function (req, res) {
  var comment = new Comment();
  comment.post = req.body.post;
  comment.author = req.body.author;
  comment.comment = req.body.comment;
  comment.commenter = req.session.user.id;
  comment.created = Date.now();
  comment.updated = Date.now();
  comment.save(function (err, rtn) {
    if (err) {
      res.json({
        status: "error",
      });
    } else {
      console.log(rtn);
      res.json({
        status: true,
      });
    }
  });
});

router.post("/givereply", auth, function (req, res) {
  var update = {
    reply: req.body.reply,
    updated: Date.now(),
  };
  Comment.findByIdAndUpdate(
    req.body.cid,
    { $set: update },
    function (err, rtn) {
      if (err) {
        res.json({
          status: "error",
        });
      } else {
        res.json({
          status: true,
        });
      }
    }
  );
});

router.post("/givelike", auth, function (req, res) {
  if (req.body.type === "like") {
    Post.findByIdAndUpdate(
      req.body.post,
      { $push: { like: { user: req.session.user.id } } },
      function (err, rtn) {
        if (err) {
          res.json({
            status: "error",
          });
        } else {
          res.json({
            status: true,
          });
        }
      }
    );
  } else {
    Post.findById(req.body.post, function (err, rtn) {
      if (err) {
        res.json({
          status: "error",
        });
      } else {
        var likelist = rtn.like.filter(function (data) {
          return data.user != req.session.user.id;
        });
        Post.findByIdAndUpdate(
          req.body.post,
          { $set: { like: likelist } },
          function (err2, rtn2) {
            if (err2) {
              res.json({
                status: "error",
              });
            } else {
              res.json({
                status: true,
              });
            }
          }
        );
      }
    });
  }
});

router.post("/followauthor", auth, function (req, res) {
  if (req.body.type == "follow") {
    User.findByIdAndUpdate(
      req.session.user.id,
      { $push: { favoriteB: { blogger: req.body.author } } },
      function (err, rtn) {
        if (err) {
          res.json({
            status: "error",
          });
        } else {
          console.log(rtn);
          res.json({
            status: true,
          });
        }
      }
    );
  } else {
    User.findById(req.session.user.id, function (err, rtn) {
      if (err) {
        res.json({
          status: "error",
        });
      } else {
        var bloggerlist = rtn.favoriteB.filter(function (data) {
          return data.blogger != req.body.author;
        });
        User.findByIdAndUpdate(
          req.session.user.id,
          { $set: { favoriteB: bloggerlist } },
          function (err2, rtn2) {
            if (err2) {
              res.json({
                status: "error",
              });
            } else {
              res.json({
                status: true,
              });
            }
          }
        );
      }
    });
  }
});

router.get("/favbloglist", auth, function (req, res) {
  User.findById(req.session.user.id, function (err, rtn) {
    if (err) throw err;
    var favlist = [];
    rtn.favoriteB.forEach(function (element) {
      favlist.push(element.blogger);
    });
    Post.find({ author: { $in: favlist } })
      .populate("author", "name")
      .exec(function (err2, rtn2) {
        if (err2) throw err2;
        console.log(rtn2);
        res.render("user/favbloglist", { posts: rtn2 });
      });
  });
});

module.exports = router;
