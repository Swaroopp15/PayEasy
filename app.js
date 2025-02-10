const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// Dummy Bank Data
const bankUsers = [
    { email: 'swarooppalacharla05@gmail.com',phone: '+917075044738', pin: '1234', balance: 1000 },
    { email: 'jayanth@yopmail.com', phone: '+0987654321', pin: '5678', balance: 800 },
    { email: 'jayanthpetchetti@gmail.com', phone: '+1122334455', pin: '7815', balance: 80000 },
    { email: 'vamsi@yopmail.com', phone:'+919012345677' ,pin: '4321', balance: 500 }
];


let otpStorage = {}; // { email: { otp, expiresAt }}

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rebook635@gmail.com',  
        pass: 'jeglhgasdjpmwlwf'    
    }
});

// Middleware   
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'securekey', resave: false, saveUninitialized: true }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the /public and /dist directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to Protect Routes After User Validation
function isAuthenticated(req, res, next) {
    if (!req.session.email) {
        return res.redirect('/');
    }
    next();
}

// Home Page (Initial Authentication Method Selection)
app.get('/', (req, res) => {
    res.render('index'); // Render the initial page to choose authentication method
});

// Handle Authentication Method Selection
app.post('/choose-auth-method', (req, res) => {
    const { authMethod } = req.body;
    if (authMethod === 'phone') {
        res.sendFile(path.join(__dirname, 'public', 'phone-auth.html')); // Redirect to Firebase-based phone authentication
    } else if (authMethod === 'email') {
        res.render('payment'); // Redirect to email authentication flow
    } else {
        res.render('index', { error: 'Invalid choice!' });
    }
});

// Validate User for Email Authentication
app.post('/validate-user', (req, res) => {
    const { email } = req.body;
    const user = bankUsers.find(u => u.email === email);
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    req.session.email = email; // Store email in session
    res.render('auth-options', { email, error: null }); // Render options for PIN or OTP
});

// Authentication (OTP or PIN)
app.post('/authenticate', async (req, res) => {
    const { method, email } = req.body;
    const user = bankUsers.find(u => u.email === email);
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    req.session.method = method; // Store authentication method
    if (method === 'pin') {
        // Redirect to PIN authentication page
        res.render('auth', { email, method, placeholder: 'Enter PIN', error: null });
    } else if (method === 'otp') {
        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
        otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes
        // Send OTP via email
        const mailOptions = {
            from: 'rebook635@gmail.com', // Fix sender email
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${email}`);
            // Redirect to OTP verification page
            res.render('otp', { email, error: null });
        } catch (error) {
            console.error('Error sending OTP:', error);
            res.render('auth-options', { email, error: 'Failed to send OTP. Try again later.' });
        }
    }
});

// Verify OTP or PIN
app.post('/verify-auth', isAuthenticated, (req, res) => {
    const { authInput } = req.body;
    const email = req.session.email;
    const method = req.session.method;
    const user = bankUsers.find(u => u.email === email);
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    if (method === 'pin') {
        if (user.pin !== authInput) {
            return res.render('auth', { email, method, placeholder: 'Enter PIN', error: 'Invalid PIN!' });
        }
    } else if (method === 'otp') {
        const otpData = otpStorage[email];
        if (!otpData || otpData.otp.toString() !== authInput || Date.now() > otpData.expiresAt) {
            return res.render('auth-options', { email, method, placeholder: 'Enter OTP', error: 'Invalid or expired OTP!' });
        }
        delete otpStorage[email]; // Remove OTP after successful verification
    }
    req.session.verified = true; // Mark as verified
    res.render('amount', { email, balance: user.balance, error: null });
});

// Process Payment
app.post('/process-payment', isAuthenticated, (req, res) => {
    if (!req.session.verified) {
        return res.render('payment', { error: 'Unauthorized access!' });
    }
    const { amount } = req.body;
    const email = req.session.email;
    const user = bankUsers.find(u => u.email === email);
    const amountNum = parseInt(amount);
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    if (user.balance < amountNum) {
        return res.render('amount', { email, balance: user.balance, error: 'Insufficient balance!' });
    }
    user.balance -= amountNum;
    const transactionId = `TXN${Date.now()}`;
    req.session.destroy(); // Clear session after payment
    res.render('success', { transactionId, amount });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});