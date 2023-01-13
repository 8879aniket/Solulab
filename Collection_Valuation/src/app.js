const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const exphbs = require("express-handlebars");
const handleBarHelpers = require("./services/handlebarhelpers");
const methodOverride = require("method-override");
const flash = require("connect-flash");
require("dotenv").config();
require("./change-streams");

const FCMHelper = require("./helpers/fcm.helper");

// TODO: Add the bellow implementations where ever we need to send the notifications
// FCMHelper.Send({
//   notification: {
//     title: 'Message from node',
//     body: 'hey there'
//   },
//   topic: 'general'
// })

const indexRouter = require("./routes/index");
const adminRouter = require("./routes/admin/index");

const usersRouter = require("./routes/users");

const app = express();
app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * self  blob: data: gap://ready; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"
  );
  next();
});

app.use(cors());
app.use(methodOverride("_method"));

const hbs = exphbs.create({
  extname: ".hbs",
  defaultLayout: "layout",
  partialsDir: ["views/partials/"],
  helpers: handleBarHelpers.helperFunction,
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
// app.engine(hbs.extname, hbs.engine);
// app.set('view engine', hbs.extname);
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "coinProject",
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: "/",
      httpOnly: false,
      secure: false,
      maxAge: 315360000000000,
    },
  })
);
app.use(flash());

app.use("/api/v1", indexRouter);
app.use("/", adminRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
app.get("/", () => {});
// error handler
app.use((err, req, res, next) => {
  let responseData;
  if (err.name === "JsonSchemaValidation") {
    // Set a bad request http response status
    res.status(400);
    responseData = {
      result: 0,
      msg: err.message.split(":")[1],
      data: err.validations, // All of your validation information
    };
    res.json(responseData);
  } else {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  }
});

module.exports = app;
