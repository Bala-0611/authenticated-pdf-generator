const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dummy user
const USER = {
  username: 'admin',
  password: '1234'
};

// Secret key for JWT
const SECRET_KEY = 'secret123';

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === USER.username && password === USER.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  res.status(401).json({ message: 'Invalid credentials' });
});

// Middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    req.user = user;
    next();
  });
}

// PDF generation route
app.post('/generate-pdf', verifyToken, (req, res) => {
  const { content } = req.body;
const PDFDocument = require('pdfkit');

app.post('/generate-pdf', verifyToken, (req, res) => {
  const { content } = req.body;

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');

  doc.pipe(res);
  doc.text(content || 'No content provided');
  doc.end();
});

  doc.text(content || 'No content provided');
  doc.end();
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:${PORT}");
});