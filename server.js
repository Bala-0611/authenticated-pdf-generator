import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'bala-super-secret-key';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Stats
let pdfCount = 0;
const users = new Set();

// Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    const token = jwt.sign({ user: username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token missing' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid or expired' });
    req.user = user;
    next();
  });
}

// Generate PDF
app.post('/generate-pdf', authenticateToken, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    pdfCount++;
    users.add(req.user.user);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    let y = 800;

    const lines = content.match(/.{1,80}/g) || [];
    lines.forEach(line => {
      if (y <= 50) return;
      page.drawText(line, {
        x: 50,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// Admin Stats
app.get('/admin-dashboard', authenticateToken, (req, res) => {
  res.json({
    totalPDFs: pdfCount,
    totalUsers: users.size
  });
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
