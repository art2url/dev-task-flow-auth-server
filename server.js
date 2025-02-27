const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'some-super-secret-key';

app.use(cors());
app.use(express.json());

const mockUser = {
  id: 1,
  username: 'testuser',
  passwordHash: '$2a$12$eCZtOSKLF1ViUBp7vtbWpuJ/Hi71n9trCDM8ryns003LC78riE2c2', // "password123"
};

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic check
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  if (username !== mockUser.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, mockUser.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token
  const token = jwt.sign(
    { userId: mockUser.id, username: mockUser.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// Protected route
app.get('/protected', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({
      message: `Hello ${decoded.username}, you are authorized!`,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

const hash = '$2a$12$eCZtOSKLF1ViUBp7vtbWpuJ/Hi71n9trCDM8ryns003LC78riE2c2';
const plainPassword = 'password123'; // Try different passwords here

bcrypt.compare(plainPassword, hash, (err, result) => {
  console.log(result ? 'Password matches!' : 'Wrong password!');
});
