const API_BASE = process.env.REACT_APP_API_URL || '';

export async function fetchQuestions() {
  const res = await fetch(`${API_BASE}/api/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function submitAnswers(payload) {
  const res = await fetch(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit');
  return res.json();
}


