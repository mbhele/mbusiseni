
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const cors = require('cors');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes'); // Import the routes
const ContactForm = require('./models/ContactForm');  // Adjust the path as necessary to where your model file is located
const multer = require('multer');
const User = require('./models/User'); // Make sure this path is correct



const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;
const upload = multer();
const app = express();
const port = process.env.PORT || 3005;

// Middleware configurations
app.set('view engine', 'ejs');
app.use(cors({ credentials: true, origin: 'http://localhost:3009' }));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.set('view engine', 'ejs');

// Body parser for forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup with a secure session secret
app.use(session({
    secret: 'dfgh', // Use an environment variable for the session secret
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

app.use(flash());

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Use routes
app.use(userRoutes); // Use the imported user routes

// Home route
app.get('/', (req, res) => res.render('index', { user: req.user }));

// Contact route
app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/submit-form', upload.none(), async (req, res) => {
    console.log(req.body); // Log the body to debug what is being received
    try {
        const newContact = new ContactForm({
            companyName: req.body.companyName,
            website: req.body.website,
            logo: req.body.logo,
            numClients: req.body.numClients,
            websiteType: req.body.websiteType,
            industry: req.body.industry,
            agent: req.body.agent,
            phone: req.body.phone,
            adType: req.body.adType
        });

        await newContact.save();
        console.log('Contact form data saved:', newContact);
        res.status(201).json({ message: 'Form submitted successfully!' });
    } catch (error) {
        console.error('Failed to save contact form data:', error);
        res.status(500).json({ message: 'Failed to submit form', error: error });
    }
});





// MongoDB and Server start
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log('Connected to MongoDB Atlas');
    });
})
.catch(err => console.error('Could not connect to MongoDB Atlas:', err));
