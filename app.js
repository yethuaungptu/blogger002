var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiIndexRouter = require("./api/routes/index");
var apiUserRouter = require("./api/routes/user");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "All!@isW3Ll302#$%",
    resave: false,
    saveUninitialized: true,
  })
);

mongoose.connect(
  "mongodb+srv://yethu:ye123@blogger002.qgy2dbk.mongodb.net/?retryWrites=true&w=majority"
);
var db = mongoose.connection;
db.on("error", console.error.bind("MongoDB connection error at blogger 002"));

// mongoose.connect("mongodb://127.0.0.1/blogger002db");
// var db = mongoose.connection;
// db.on("error", console.error.bind("MongoDB connection error at blogger 002"));

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", apiIndexRouter);
app.use("/api/users", apiUserRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
