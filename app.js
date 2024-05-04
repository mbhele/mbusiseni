require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');  // Ensure your User model is correctly set up

const app = express();
const port = process.env.PORT || 3008;

// MongoDB Configuration
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('Could not connect to MongoDB Atlas:', err));

// Express Application Setup
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set secure to false for local development
}));

// Log session data
app.use((req, res, next) => {
    console.log('Session data:', req.session);
    next();
});

// Passport Authentication Setup
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport Local Strategy Configuration
passport.use(new LocalStrategy({ usernameField: 'email' },
    async (email, password, done) => {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return done(null, false, { message: 'No user with that email' });
        }
        if (await bcrypt.compare(password, user.password)) {
            return done(null, user);
        } else {
            return done(null, false, { message: 'Password incorrect' });
        }
    }
));

// Passport Serialize and Deserialize
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (user) {
            done(null, user);
        } else {
            done(new Error('User not found'));
        }
    } catch (error) {
        done(error, null);
    }
});


// Middleware to check if user is admin
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).send("Access denied. Only admins can access this page.");
    }
}

// Routes
app.get('/', (req, res) => {
    console.log('Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
    console.log('Authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    res.render('login', { messages: req.flash('error'), hasErrors: req.flash('error').length > 0 });
});

// Add similar logging to other routes


app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.'
}), (req, res) => {
    res.redirect(req.user.role === 'admin' ? '/admin-dashboard' : '/dashboard');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const newUser = new User({
            email: email.toLowerCase(),
            password: password, // Password will be hashed in pre-save middleware
            role: 'user'
        });
        await newUser.save();
        req.login(newUser, (err) => {
            if (err) {
                return res.status(500).send('Error logging in after registration');
            }
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.redirect('/register');
    }
});

app.get('/admin-dashboard', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin-dashboard', { user: req.user, users: users });
    } catch (error) {
        console.error('Failed to retrieve users from the database:', error);
        res.status(500).send("Error retrieving users from database.");
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        res.render('dashboard', { user: req.user });
    }
});
app.get('/contact', (req, res) => {
   
    res.render('contact');
});
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
