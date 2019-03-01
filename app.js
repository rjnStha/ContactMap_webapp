var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bcrypt = require("bcrypt");


// Should store this in a database. Even when you're using this in
// database, don't store as a plain text. Needs some sort of encryption
var username = "cmps369";
var password = "finalproject";
bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
        password = hash;
        console.log("Hashed password = " + password);
    });
});



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({ secret: 'finalproject'}));

app.use(express.static(path.join(__dirname, 'public')));

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


app.use(passport.initialize());
app.use(passport.session() );


passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },

  function(user, pswd, done) {
      if ( user != username ) {
          console.log("Username mismatch");
          return done(null, false);
      }

      bcrypt.compare(pswd, password, function(err, isMatch) {
          if (err) return done(err);
          if ( !isMatch ) {
              console.log("Password mismatch");
          }
          else {
              console.log("Valid credentials");
          }
          done(null, isMatch);
      });
    }
));

passport.serializeUser(function(username, done) {
    // this is called when the user object associated with the session
    // needs to be turned into a string.  Since we are only storing the user
    // as a string - just return the username.
    done(null, username);
});

passport.deserializeUser(function(username, done) {
    // normally we would find the user in the database and
    // return an object representing the user (for example, an object
    // that also includes first and last name, email, etc)
    done(null, username);
 });


// Posts to login will have username/password form data.
// passport will call the appropriate functions...
indexRouter.post('/login',
    passport.authenticate('local', { successRedirect: '/contacts',
                                     failureRedirect: '/login_fail',
                                  })
);

indexRouter.get('/login', function (req, res) {
  res.render('login', {});
});

indexRouter.get('/login_fail', function (req, res) {
  res.render('login_fail', {});
});


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
