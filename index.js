const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcryptjs");

const passport = require('passport');
const passportJWT = require('passport-jwt');

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = 'wowwow';

// lets create our strategy for web token
let strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  let user = getUser({ id: jwt_payload.id });

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
});
// use the strategy
passport.use(strategy);

const app = express();
// initialize passport with express
app.use(passport.initialize());

// parse application/json
app.use(bodyParser.json());
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const Sequelize = require('sequelize');

// initialze an instance of Sequelize
const sequelize = new Sequelize({
  database: 'snip',
  username: 'root',
  password: 'test123',
  dialect: 'mysql',
});

// check the databse connection
sequelize
  .authenticate()
  .then(() => console.log('Connection has been established successfully.'))
  .catch(err => console.error('Unable to connect to the database:', err));

// create user model
const User = sequelize.define('users', {
  user_id:{
    type: Sequelize.STRING,
  },
  user_name: {
    type: Sequelize.STRING,
  },
  password: {
    type: Sequelize.STRING,
  },
  salon_code: {
    type: Sequelize.STRING
  },
  
},{
  timestamps: false
});

//feedback model


// create table with user model
User.sync()
  .then(() => console.log('User table created successfully'))
  .catch(err => console.log('oooh, did you enter wrong database credentials?'));

// create some helper functions to work on the database
const createUser = async ({ user_id,user_name, password, salon_code }) => {
  return await User.create({ user_id,user_name, password, salon_code });
};

const getAllUsers = async () => {
  return await User.findAll();
};

const getUser = async obj => {
  return await User.findOne({
    where: obj,
  });
};

// set some basic routes
app.get('/', function(req, res) {
  res.json({ message: 'Express is up!' });
});

// get all users
app.get('/users', function(req, res) {
  getAllUsers().then(user => res.json(user));
});

// register route
app.post('/register', function(req, res, next) {
  var user_id = req.body.user_id;
  var user_name = req.body.user_name;
  var password = bcrypt.hashSync(req.body.password, 8);
  var salon_code = req.body.salon_code;
  createUser({ user_id, user_name, password, salon_code }).then(user =>
    res.json({ msg: 'account created successfully' })
  );
});

//login route
app.post('/login', async function(req, res, next) {
  const { user_name, password } = req.body;
  if (user_name && password) {
    let user = await getUser({ user_name: user_name });
    if (!user) {

      res.status(401).json({ message: 'No such user found' });
    
    }
    var check = (bcrypt.compareSync(password, user.password))
    if (check) {
      // from now on we'll identify the user by the id and the id is the 
      // only personalized value that goes into our token
      let payload = { id: user.user_id };
      let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ msg: user.salon_code, token: token });
    } else {
      res.status(401).json({ msg: 'Password is incorrect' });
    }
  }
});

// protected route
app.get('/protected', passport.authenticate('jwt', { session: false }), function(req, res) {
  res.json('Success! You can now see this without a token.');
});

app.post('/feedback', passport.authenticate('jwt', { session: false }), function(req, res) {
  
});


// start app
app.listen(3000, function() {
  console.log('Express is running on port 3000');
});
