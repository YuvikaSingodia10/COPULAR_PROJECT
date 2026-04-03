const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../db');

const router = express.Router();

// ─── Helper: generate unique workspace code ───
function generateWorkspaceCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = 'WS-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── POST /api/auth/register ───
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, workspace_code } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required: name, email, password, role.' });
    }

    const validRoles = ['admin', 'recruiter'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or recruiter.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    let finalWorkspaceCode;

    if (role === 'recruiter') {
      // Auto-generate a unique workspace code for this recruiter
      let isUnique = false;
      while (!isUnique) {
        finalWorkspaceCode = generateWorkspaceCode();
        const existingCode = await User.findOne({ where: { workspace_code: finalWorkspaceCode } });
        if (!existingCode) isUnique = true;
      }
    } else if (role === 'admin') {
      // Admin must provide a valid workspace code from a recruiter
      if (!workspace_code || !workspace_code.trim()) {
        return res.status(400).json({ error: 'Workspace code is required for admin registration. Get it from your recruiter.' });
      }

      const recruiterWithCode = await User.findOne({
        where: { workspace_code: workspace_code.trim().toUpperCase(), role: 'recruiter' }
      });

      if (!recruiterWithCode) {
        return res.status(400).json({ error: 'Invalid workspace code. No recruiter found with this code.' });
      }

      finalWorkspaceCode = workspace_code.trim().toUpperCase();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      workspace_code: finalWorkspaceCode
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, workspace_code: user.workspace_code },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Registration successful.',
      token,
      role: user.role,
      name: user.name,
      workspace_code: user.workspace_code
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ─── POST /api/auth/login ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, workspace_code: user.workspace_code },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      role: user.role,
      name: user.name,
      workspace_code: user.workspace_code
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
