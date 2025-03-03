require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ['https://dev-task-flow.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  passwordHash: String,
});

const User = mongoose.model('User', UserSchema);

const transporter = nodemailer.createTransport({
  host: 'smtp.aol.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// **REGISTER ROUTE**
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      username,
      email,
      passwordHash: hashedPassword,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: 'User registration failed' });
  }
});

// **LOGIN ROUTE**
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'User not found' });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ message: 'Login successful', token });
});

// **PROTECTED ROUTE**
app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// **FORGOT PASSWORD (Generate & Send New Password)**
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New Password - DevTaskFlow',
      html: `
        <h2>New Password Generated</h2>
        <p>Hello <b>${user.username}</b>,</p>
        <p>Your new password is: <b>${newPassword}</b></p>
        <p>Thank you,</p>
        <p><b>DevTaskFlow Team</b></p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email sending error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      }
      console.log('✅ Email sent:', info.response);
      res.json({ message: 'New password sent to your email.' });
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
