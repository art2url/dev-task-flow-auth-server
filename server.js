require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));
// app.use(
//   cors({
//     origin: ['https://dev-task-flow.vercel.app'],
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   })
// );

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// **USER SCHEMA**
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  passwordHash: String,
});

const User = mongoose.model('User', UserSchema);

// **TASK SCHEMA**
const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  deadline: Date,
  pinned: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', TaskSchema);

// **EMAIL TRANSPORTER**
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
    await User.create({ username, email, passwordHash: hashedPassword });

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

// **MIDDLEWARE: AUTHENTICATE USER**
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// **GET USER TASKS**
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// **CREATE A NEW TASK**
app.post('/tasks', authenticate, async (req, res) => {
  const { title, description, priority, deadline, pinned, completed } =
    req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const newTask = await Task.create({
      userId: req.userId,
      title,
      description,
      priority,
      deadline,
      pinned,
      completed,
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// **UPDATE A TASK**
app.put('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.taskId, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ error: 'Task not found' });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// **DELETE A TASK**
app.delete('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.taskId,
      userId: req.userId,
    });

    if (!deletedTask) return res.status(404).json({ error: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// **DELETE ALL TASKS FOR A USER**
app.delete('/tasks', authenticate, async (req, res) => {
  try {
    await Task.deleteMany({ userId: req.userId });
    res.json({ message: 'All tasks deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tasks' });
  }
});

// **FORGOT PASSWORD (Generate & Send New Password)**
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

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

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).json({ error: 'Failed to send email' });
      res.json({ message: 'New password sent to your email.' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// **START SERVER**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
