
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login User Passport Authentication Using Google
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//ref: http://www.passportjs.org/packages/passport-google-oauth20

 "dependencies": {
    "body-parser": "^1.19.0",
    "dotenv": "^8.2.0",
    "ejs": "^3.0.1",
    "express": "^4.17.1",
    "express-session": "^1.17.0",
    "mongoose": "^5.9.1",
    "mongoose-findorcreate": "^3.0.0",
    "passport": "^0.4.1",
    "passport-google-oauth20": "^2.0.0",
    "passport-local": "^1.0.0",
    "passport-local-mongoose": "^6.0.1"
  }


//we will create a new projects called 'Secrets' at googles developers console



require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require ('mongoose');
const ejs = require ('ejs');
const session = require('express-session');                      
const passport = require('passport');                                 
const passportLocalMongoose = require('passport-local-mongoose'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use (bodyParser.urlencoded({ extended : true   }));

app.use(session( {secret: ' my felix' ,
                 resave : false,
                 saveUninitialized: false
  }));

app.use(passport.initialize());                                     
app.use(passport.session());                                       


mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}) ;
mongoose.set('useCreateIndex', true);                         


                                                                   

const userSchema = new mongoose.Schema ({
                     username : String,
                     password: String,
                     googleId: String
});
                                                                   

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); // we will also add the findorcreate as a plugin


const User =  mongoose.model('User', userSchema);

passport.use(User.createStrategy());                                        


//here we serialize and deserialize users

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });               

//here we create a strategy  Note that this code block must be placed here
//we will add client and secret id in the .env file

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',                  //here we add the url we set when creating the api with google
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',     
  },  function(accessToken, refreshToken, profile, cb) {

    console.log(profile +' here is the google user');
    User.findOrCreate(                                                        //findorcreate is not a function so to let it work like a function we will have to install findorcreat
        { googleId: profile.id }, function (err, user) {

      return cb(err, user);
    });
  }
));


app.get('/', function(req, res){ 

    res.render('home')
  } );

//here we add route to capture req from the register and login

app.route('/auth/google')

.get(passport.authenticate('google', {

scope: ['profile']

}));


  //here we add the route to handle googles response and redirect

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


  app.get('/login', function(req, res){ 

    res.render('login')
  } );


  app.get('/register', function(req, res){ 

    res.render('register')
  } );


  //check if user logged in

  app.get('/secrets', function(req, res){                 

          if(req.isAuthenticated()) { 
            res.render('secrets');
          }else { 

           res.redirect('/login'); 
           }
  } );



  app.post('/register', function(req, res){ 
         User.register({username: req.body.username }, req.body.password, function(err, user){
          if(err){
             console.log(err);
             res.redirect('/register');
          }else {

            passport.authenticate('local') (req, res, function(){
            res.redirect('/secrets');
            });
           
          }

      });
} );


app.post('/login', function(req, res){

                   const user =   new User({ 
                    username: req.body.username,
                    password: req.body.password

                    }) ;

          req.login(user, function(err){ 
                   if(err){
                     console.log(err);
                    } else { 
                      passport.authenticate('local') (req, res, function(){ 
                      
                        res.redirect('/secrets');

                      });
                    }
              });      
               
        });
         
//logout route

app.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});



app.listen( 3000, function(){
    console.log('secret server started ');
});




























