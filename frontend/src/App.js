import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { fetchQuestions, submitAnswers } from './api';
import jsPDF from 'jspdf';

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: pct + '%' }} />
      <div className="progress-text">{current}/{total}</div>
    </div>
  );
}

function App() {
  const [stage, setStage] = useState('landing');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark');

  const total = questions.length;
  const currentQuestion = questions[index];

  useEffect(() => {
    // Prefetch questions on landing
    if (stage === 'landing') {
      setLoading(true);
      fetchQuestions()
        .then(({ questions }) => setQuestions(questions))
        .catch(() => setError('Failed to load questions'))
        .finally(() => setLoading(false));
    }
  }, [stage]);

  // Theme session persistence (in-memory for page session)
  useEffect(() => {
    const stored = sessionStorage.getItem('agape-theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, []);
  useEffect(() => {
    sessionStorage.setItem('agape-theme', theme);
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('theme-light'); else root.classList.remove('theme-light');
  }, [theme]);

  const motivational = useMemo(() => {
    if (stage === 'landing') {
      return 'Every step your child takes today shapes a confident tomorrow. Ready to begin?';
    }
    if (stage === 'quiz') {
      const texts = [
        'Great progress! Keep going!',
        'You are doing amazing—just a few more!',
        'Every answer helps us guide your child better.',
        'Stay focused—your insights matter!',
      ];
      return texts[index % texts.length];
    }
    if (stage === 'result') {
      return 'Wonderful! You’ve unlocked personalized insights for your child.';
    }
    return '';
  }, [stage, index]);

  function start() {
    if (!name.trim() || !age) {
      setError('Please enter name and age');
      return;
    }
    setError('');
    setStage('quiz');
    setIndex(0);
    setAnswers({});
  }

  function onSelect(option) {
    const qid = currentQuestion.id;
    const next = { ...answers, [qid]: option };
    setAnswers(next);
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1);
  }

  function goNext() {
    if (index + 1 < total) setIndex(index + 1);
  }

  async function onSubmit() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name,
        age: Number(age),
        answers: Object.entries(answers).map(([q, a]) => ({ q: Number(q), a })),
      };
      const res = await submitAnswers(payload);
      setResult(res);
      setStage('result');
    } catch (e) {
      setError('Submission failed');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStage('landing');
    setName('');
    setAge('');
    setAnswers({});
    setResult(null);
    setIndex(0);
  }

  function downloadPdf() {
    if (!result) return;
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(16);
    doc.text('Agape Personality Development Result', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Student: ${name}`, 14, y); y += 7;
    doc.text(`Age: ${age}`, 14, y); y += 7;
    doc.text(`Dominant Type: ${result.dominantType}`, 14, y); y += 7;
    doc.text(`Overall Score: ${result.overallScore}/5`, 14, y); y += 10;
    doc.text('Category Scores:', 14, y); y += 7;
    Object.entries(result.categoryScores).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`, 18, y); y += 6;
    });
    y += 4;
    const descLines = doc.splitTextToSize(result.personalizedDescription, 180);
    doc.text('Summary:', 14, y); y += 7;
    doc.text(descLines, 18, y);
    doc.save(`${name || 'result'}-agapept.pdf`);
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Agape Personality Development Test</h1>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
        <p className="motivation">{motivational}</p>

        {error && <div className="error">{error}</div>}

        {stage === 'landing' && (
          <div className="landing">
            <div className="intro">
              <p>
                We’re committed to helping children grow in confidence, communication, and character. This quick survey helps us personalize guidance for your child.
              </p>
              <ul className="side-notes">
                <li>Fun fact: Small, consistent efforts build big confidence!</li>
                <li>Tip: Encourage daily reflection to boost self-awareness.</li>
                <li>Inspiration: Every child learns in their unique way.</li>
              </ul>
            </div>
            <div className="form-row">
              <input placeholder="Student name" value={name} onChange={(e) => setName(e.target.value)} />
              <input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} type="number" min="1" />
            </div>
            <button className="primary" onClick={start} disabled={loading}>
              {loading ? 'Loading…' : 'Start Test'}
            </button>
          </div>
        )}

        {stage === 'quiz' && currentQuestion && (
          <div className="quiz">
            <ProgressBar current={index + 1} total={total} />
            <div className="question">
              <div className="q-text">{currentQuestion.text}</div>
              {currentQuestion.type !== 'text' ? (
                <div className="options">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      className={`option ${answers[currentQuestion.id] === opt ? 'selected' : ''}`}
                      onClick={() => onSelect(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="form-row" style={{gridTemplateColumns:'1fr'}}>
                  <input
                    placeholder="Type your answer"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="actions" style={{justifyContent:'space-between'}}>
              <button className="secondary" onClick={goPrev} disabled={index === 0}>Previous</button>
              {index + 1 < total && (
                <button className="primary" onClick={goNext}>Next</button>
              )}
            </div>
            {index + 1 === total && (
              <button className="primary" onClick={onSubmit} disabled={loading || Object.keys(answers).length !== total}>
                {loading ? 'Submitting…' : 'Submit'}
              </button>
            )}
          </div>
        )}

        {stage === 'result' && result && (
          <div className="result">
            <div className="result-card">
              <h2>Congratulations, {name}!</h2>
              <p>Dominant Type: <strong>{result.dominantType}</strong></p>
              <p>Overall Score: <strong>{result.overallScore}/5</strong></p>
              <div className="scores">
                {Object.entries(result.categoryScores).map(([k, v]) => (
                  <div key={k} className="score-item">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <p className="desc">{result.personalizedDescription}</p>
              <div className="actions">
                <button onClick={downloadPdf}>Download Result (PDF)</button>
                <button className="secondary" onClick={reset}>Retest</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
