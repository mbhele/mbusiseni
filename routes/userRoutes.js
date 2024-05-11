const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Set up mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: '1mbusombhele@gmail.com', // Your email
    pass: 'rxyb eclg vpdy bghh', // Your email password
  },
});


router.get('/register', (req, res) => {
    res.render('register');  // Assuming you have a 'register.ejs' view file
});

// Register Route
// Register Route
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
  
    try {
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(409).send('User already exists with the same username or email.');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role
      });
  
      await newUser.save();
  
      // Send an email to the administrator
      const adminMailOptions = {
        from: '1mbusombhele@gmail.com',
        to: 'mbusiseni.mbhele@gmail.com', // Replace with your email
        subject: 'New User Registration',
        text: `A new user has registered!\n\nUsername: ${username}\nEmail: ${email}\nRole: ${role}`,
      };
  
      transporter.sendMail(adminMailOptions, (error) => {
        if (error) {
          console.error('Error sending admin notification email:', error);
        }
      });
  
      // Send a welcome email to the new user
      const userMailOptions = {
        from: '1mbusombhele@gmail.com',
        to: email,
        subject: 'Welcome to Our Service!',
        text: 'Welcome! You have successfully registered. We look forward to engaging with you.'
      };
  
      transporter.sendMail(userMailOptions, (error) => {
        if (error) {
          console.error('Error sending welcome email:', error);
        }
      });
  
      // Log in the user automatically after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return res.status(500).send('Error logging in new user.');
        }
        return res.redirect('/welcome'); // Redirect to the welcome page
      });
  
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).send('Error registering new user: ' + error.message);
    }
  });

// Welcome Route
router.get('/welcome', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('welcome', { user: req.user });
    } else {
        res.redirect('/login');
    }
});


router.post('/subscribe-newsletter', async (req, res) => {
    const { email } = req.body;
  
    // Add logic to add email to your newsletter system
    console.log(`Newsletter subscription for: ${email}`);
  
    // Send confirmation email to the user
    const mailOptionsUser = {
        from: '1mbusombhele@gmail.com',
        to: email,
        subject: 'Subscription Confirmation',
        html: `
          <html>
            <body>
              <p>Thank you for subscribing to our newsletter! You will now receive the latest updates directly in your inbox.</p>
              <img src="/images/logo.svg" alt="Your Logo" style="width: 100px; height: auto;">
            </body>
          </html>
        `,
        text: 'Thank you for subscribing to our newsletter! You will now receive the latest updates directly in your inbox.'
      };
      
  
    transporter.sendMail(mailOptionsUser, (error, info) => {
      if (error) {
        console.error('Error sending confirmation email:', error);
        res.status(500).send('Error sending confirmation email');
      } else {
        console.log('Confirmation email sent:', info.response);
  
        // Optionally notify the administrator
        const mailOptionsAdmin = {
          from: '1mbusombhele@gmail.com',
          to: 'mbusiseni.mbhele@gmail.com', // Your or admin's email
          subject: 'New Newsletter Subscription',
          text: `New subscription from: ${email}`
        };
  
        transporter.sendMail(mailOptionsAdmin, (error, info) => {
          if (error) {
            console.error('Error sending admin notification email:', error);
          } else {
            console.log('Admin notified of new subscription:', info.response);
          }
        });
  
        res.redirect('/welcome?subscribed=true'); // Redirect back with a query parameter
      }
    });
  });


// Route to render the login form
router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('error') }); // Assuming you're using connect-flash for error messaging
});

// Login Route
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/logout', (req, res) => {
    console.log('Logging out user:', req.user);
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            return next(err);
        }
        console.log('Session after logout:', req.session);
        res.redirect('/');
    });
});

module.exports = router;
