import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import nodemailer from 'nodemailer';
import Database from 'better-sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'quiz.db');
const LOG_PATH = process.env.LOG_PATH || path.join(DATA_DIR, 'submissions_log.txt');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    scores_json TEXT NOT NULL,
    dominant_type TEXT NOT NULL,
    overall_score REAL NOT NULL,
    description TEXT NOT NULL,
    learning_styles TEXT NOT NULL,
    raw_answers_json TEXT NOT NULL
  );
`);

const QUESTIONS_PATH = path.join(__dirname, 'questions.json');
const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'));
import { calculateResults } from './services/calculation.js';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/questions', (req, res) => {
  const shuffled = shuffleArray(questions);
  res.json({ questions: shuffled });
});

app.post('/api/submit', async (req, res) => {
  try {
    const { name, age, answers } = req.body;
    if (!name || !age || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const calc = calculateResults(answers);
    const timestamp = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO submissions (
        timestamp, name, age, scores_json, dominant_type, overall_score, description, learning_styles, raw_answers_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      timestamp,
      name,
      Number(age),
      JSON.stringify(calc.categoryScores),
      calc.dominantType,
      calc.overallScore,
      calc.personalizedDescription,
      JSON.stringify(calc.recommendedLearningStyles),
      JSON.stringify(answers)
    );

    const logEntry = [
      '=== Submission ===',
      `Timestamp: ${timestamp}`,
      `Name: ${name}`,
      `Age: ${age}`,
      `Answers: ${JSON.stringify(answers)}`,
      `Scores: ${JSON.stringify(calc.categoryScores)}`,
      `Dominant Type: ${calc.dominantType}`,
      `Overall Score: ${calc.overallScore}`,
      `Learning Styles: ${JSON.stringify(calc.recommendedLearningStyles)}`,
      'Calculation Steps:',
      ...calc.calculationSteps,
      'Description:',
      calc.personalizedDescription,
      '\n\n'
    ].join('\n');

    fs.appendFileSync(LOG_PATH, logEntry, 'utf-8');

    if (process.env.EMAIL_TO && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const emailSubject = `AgapePT Submission • ${name} (Age ${age}) • ${calc.dominantType} • ${calc.overallScore}/5`;
        const emailText = [
          'Hello,',
          '',
          'A new Personality Development Test submission has been received.',
          '',
          `Student: ${name}`,
          `Age: ${age}`,
          `Dominant Type: ${calc.dominantType}`,
          `Overall Score: ${calc.overallScore}/5`,
          `Recommended Learning Styles: ${calc.recommendedLearningStyles.join(', ')}`,
          '',
          'Summary:',
          calc.personalizedDescription,
          '',
          '— Full submission details below —',
          logEntry,
          'Best regards,',
          'AgapePT System',
        ].join('\n');

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          subject: emailSubject,
          text: emailText,
        });
      } catch (e) {
        console.error('Email send error:', e.message);
      }
    }

    res.json({ success: true, timestamp, ...calc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


