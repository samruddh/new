const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
var bcrypt = require("bcryptjs");
var cors = require('cors');
const moment = require('moment');

const fs = require('fs');
const https = require('https');

const app = express();

app.use(cors());

const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');


const server = https.createServer({key: key, cert: cert }, app);

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

// initialize passport with express
app.use(passport.initialize());

// parse application/json
app.use(bodyParser.json());
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));



const Sequelize = require('sequelize');

// initialze an instance of Sequelize
const sequelize = new Sequelize({
  database: 'snipdb',
  username: 'snipdb_usr',
  password: 'Ldhrs$fd97pr',
  dialect: 'mysql',
  //database: 'snip',
  //username: 'localhost',
  //password: 'test123',
  //dialect: 'mysql',


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
const Feedback = sequelize.define('feedbacks',{
  salon_code:{
    type: Sequelize.STRING,
  },
  date:{
    type: Sequelize.DATEONLY,
  },
  staff_name:{
    type: Sequelize.STRING,
  },
  guest_name:{
    type: Sequelize.STRING,
  },
  guest_num:{
    type: Sequelize.STRING,
  },
  guest_email:{
    type: Sequelize.STRING,
  },
  recep_friendly:{
    type: Sequelize.STRING,
  },
  recep_efficient:{
    type: Sequelize.STRING,
  },
  stylist_neat:{
    type: Sequelize.STRING,
  },
  stylist_pleasent:{
    type: Sequelize.STRING,
  },
  stylist_comfort:{
    type: Sequelize.STRING,
  },
  stylist_refreshment:{
    type: Sequelize.STRING,
  },
  stylist_discussed:{
    type: Sequelize.STRING,
  },
  stylist_results:{
    type: Sequelize.STRING,
  },
  ame_cleanliness:{
    type: Sequelize.STRING,
  },
  ame_towel:{
    type: Sequelize.STRING,
  },
  ame_cooling:{
    type: Sequelize.STRING,
  },
  ame_music:{
    type: Sequelize.STRING,
  },
  comments:{
    type: Sequelize.STRING,
  },
  dob:{
    type: Sequelize.STRING,
  },
},{
  timestamps: false
})

// create table with user model
User.sync()
  .then(() => console.log('working'))
  .catch(err => console.log('oooh, did you enter wrong database credentials?'));

// create table with feedback model
Feedback.sync()
  .then(() => console.log('working'))
  .catch(err => console.log('oooh, did you enter wrong database credentials?'));

// create some helper functions to work on the database
const createUser = async ({ user_id,user_name, password, salon_code }) => {
  return await User.create({ user_id,user_name, password, salon_code });
};

const creatfeedback = async ({salon_code, date, 
  staff_name,guest_name,guest_num,guest_email,
  recep_friendly,recep_efficient,
  stylist_neat,stylist_pleasent ,stylist_comfort,stylist_refreshment,stylist_discussed,stylist_results,      
  ame_cleanliness,ame_towel,ame_cooling,ame_music,
  comments,dob
}) => {
 
  return await Feedback.create ({salon_code, date, 
    staff_name,guest_name,guest_num,guest_email,
    recep_friendly,recep_efficient,
    stylist_neat,stylist_pleasent ,stylist_comfort,stylist_refreshment,stylist_discussed,stylist_results,      
    ame_cleanliness,ame_towel,ame_cooling,ame_music,
    comments,dob
  });

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

      res.status(401).json({ staus:'0', msg: 'Username or password is incorrect' });
    
    }
    var check = (bcrypt.compareSync(password, user.password))
    if (check) {
      // from now on we'll identify the user by the id and the id is the 
      // only personalized value that goes into our token
      let payload = { id: user.user_id };
      let token = jwt.sign(payload, jwtOptions.secretOrKey);
      res.json({ status:'1', salon: user.salon_code, token: token });
    } else {
      res.status(401).json({ status:'0', msg: 'Username or password is incorrect' });
    }
  }
});

// protected route
app.get('/protected', passport.authenticate('jwt', { session: false }, function(req, res) {
  res.json('Success! You can now see this without a token.');
}));



app.post('/feedback', passport.authenticate('jwt', { session: false }), function(req, res) {
  var {salon_code, date, 
    staff_name,guest_name,guest_num,guest_email,
    recep_friendly,recep_efficient,
    stylist_neat,stylist_pleasent ,stylist_comfort,stylist_refreshment,stylist_discussed,stylist_results,      
    ame_cleanliness,ame_towel,ame_cooling,ame_music,
    comments,dob
  } = req.body;

  dob = dob.slice(0, 10);
  var new_date = moment(dob, "YYYY/MM/DD").add('days', 1);
  var day = new_date.format('DD');
  var month = new_date.format('MM');
  var year = new_date.format('YYYY');
  dob = `${day}/${month}/${year}`;

  if((guest_num == null) && ( guest_email == null))
  {
    res.json('please enter name and contact number')
  }
  else
  {
    creatfeedback({salon_code, date, 
      staff_name,guest_name,guest_num,guest_email,
      recep_friendly,recep_efficient,
      stylist_neat,stylist_pleasent ,stylist_comfort,stylist_refreshment,stylist_discussed,stylist_results,      
      ame_cleanliness,ame_towel,ame_cooling,ame_music,
      comments,dob
    }).then(feedback1 =>
        res.json({ status:'1', msg: `Thank you for submitting feedback ${guest_name}`})
    )
  }  
});

// start app
server.listen(3734, function() {
  console.log('Express is running on port 3734');
});
