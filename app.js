require('dotenv').config();
const express = require('express');

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const User = require('./models/User');  // Ensure your User model is correctly set up

// const MongoStore = require('connect-mongo');

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

// Session Management Setup
const store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });

// Use session middleware with the new MongoStore instance
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'strict' }
}));

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
        done(null, user);
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
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login', { messages: req.flash('error'), hasErrors: req.flash('error').length > 0 });
});

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
        console.log('Admin Key from request:', req.body.adminKey);
        console.log('Environment Admin Key:', process.env.ADMIN_KEY);
        const role = req.body.adminKey === process.env.ADMIN_KEY ? 'admin' : 'user';
        console.log('Assigned role:', role);

        const newUser = new User({
            email: email.toLowerCase(),
            password: password, // Password will be hashed in pre-save middleware
            role: role
        });

        await newUser.save();
        req.login(newUser, (err) => {
            if (err) {
                return res.status(500).send('Error logging in after registration');
            }
            res.redirect(newUser.role === 'admin' ? '/admin-dashboard' : '/dashboard');
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.redirect('/register');
    }
});

app.get('/admin-dashboard', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});  // Fetch all users from the database
        res.render('admin-dashboard', { user: req.user, users: users });  // Make sure to pass 'users' here
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

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
