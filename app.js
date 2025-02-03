const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// Dummy Bank Data
const bankUsers = [
    { email: 'swaroop@yopmail.com', pin: '1234', balance: 1000 },
    { email: 'jayanth@yopmail.com', pin: '5678', balance: 800 },
    { email: 'jayanthpetchetti@gmail.com', pin: '7815', balance: 80000 },
    { email: 'vamsi@yopmail.com', pin: '4321', balance: 500 }
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
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to Protect Routes After User Validation
function isAuthenticated(req, res, next) {
    if (!req.session.email) {
        return res.redirect('/');
    }
    next();
}

// Home Page (Payment Page)
app.get('/', (req, res) => {
    res.render('payment', { error: null });
});

// Validate User
app.post('/validate-user', (req, res) => {
    const { email } = req.body;
    const user = bankUsers.find(u => u.email === email);
    
    if (!user) {
        return res.render('payment', { error: 'User not found!' });
    }
    
    req.session.email = email; // Store email in session
    res.render('auth', { email, error: null });
    req.session.email = email;
    res.render('auth-options', { email, error: null });
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
            return res.render('auth', { email, method, placeholder: 'Enter OTP', error: 'Invalid or expired OTP!' });
        }
        delete otpStorage[email]; // Remove OTP after successful verification
    }

    req.session.verified = true; // Mark as verified
    res.render('amount', { email, error: null });
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
