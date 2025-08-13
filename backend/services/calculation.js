const optionToScore = {
  'Not familiar at all': 1,
  'Never': 1,
  'Not important at all': 1,
  'Strongly Disagree': 1,
  'Strongly disagree': 1,
  'Not likely at all': 1,

  'Somewhat familiar': 2,
  'Rarely': 2,
  'Somewhat important': 2,
  'Disagree': 2,
  'Somewhat Likely': 2,

  'Neutral': 3,
  'Occasionally': 3,

  'Fairly familiar': 4,
  'Frequently': 4,
  'Fairly important': 4,
  'Agree': 4,
  'Fairly likely': 4,

  'Very familiar': 5,
  'Almost Always': 5,
  'Very important': 5,
  'Strongly Agree': 5,
  'Strongly agree': 5,
  'Very likely': 5,
};

const questionCategoryMap = {
  1: ['Openness'],
  2: ['Conscientiousness'],
  3: ['Agreeableness'],
  4: ['Extraversion'],
  5: ['Conscientiousness'],
  6: ['Conscientiousness'],
  7: ['Agreeableness'],
  8: ['Extraversion'],
  9: ['Openness'],
  10: ['Reflection'],
};

function deriveLearningStyles(scores) {
  const styles = new Set();
  if ((scores.Openness || 0) >= 4) styles.add('Visual');
  if ((scores.Extraversion || 0) >= 4) styles.add('Auditory');
  if ((scores.Conscientiousness || 0) >= 4) styles.add('Read/Write');
  if ((scores.Agreeableness || 0) >= 4) styles.add('Kinesthetic');
  if (styles.size === 0) styles.add('Multimodal');
  return Array.from(styles);
}

export function calculateResults(answers) {
  const categoryTotals = {
    Extraversion: 0,
    Agreeableness: 0,
    Conscientiousness: 0,
    Neuroticism: 0,
    Openness: 0,
    Reflection: 0,
  };
  const categoryCounts = {
    Extraversion: 0,
    Agreeableness: 0,
    Conscientiousness: 0,
    Neuroticism: 0,
    Openness: 0,
    Reflection: 0,
  };
  const steps = [];

  for (const entry of answers) {
    const { q, a } = entry;
    const categories = questionCategoryMap[q] || [];
    const score = optionToScore[a] ?? 3;
    steps.push(`Q${q}: option "${a}" → score ${score} → categories ${categories.join(', ')}`);
    for (const c of categories) {
      categoryTotals[c] += score;
      categoryCounts[c] += 1;
    }
  }

  const categoryScores = {};
  Object.keys(categoryTotals).forEach((c) => {
    const count = categoryCounts[c] || 1;
    categoryScores[c] = Number((categoryTotals[c] / count).toFixed(2));
  });

  const bigFive = ['Extraversion', 'Agreeableness', 'Conscientiousness', 'Neuroticism', 'Openness'];
  let dominantType = 'Balanced';
  let maxScore = -Infinity;
  for (const c of bigFive) {
    if (categoryScores[c] > maxScore) {
      maxScore = categoryScores[c];
      dominantType = c;
    }
  }

  const overallScore = Number(
    (
      bigFive.reduce((acc, c) => acc + (categoryScores[c] || 0), 0) / bigFive.length
    ).toFixed(2)
  );

  const recommendedLearningStyles = deriveLearningStyles(categoryScores);

  const strengths = [];
  if (categoryScores.Extraversion >= 4) strengths.push('Communication and initiative');
  if (categoryScores.Agreeableness >= 4) strengths.push('Collaboration and empathy');
  if (categoryScores.Conscientiousness >= 4) strengths.push('Discipline and goal-setting');
  if (categoryScores.Openness >= 4) strengths.push('Curiosity and creativity');

  const activities = [];
  if (recommendedLearningStyles.includes('Visual')) activities.push('Mind maps, diagrams, and visual summaries');
  if (recommendedLearningStyles.includes('Auditory')) activities.push('Discussions, presentations, and storytelling');
  if (recommendedLearningStyles.includes('Read/Write')) activities.push('Journaling, checklists, and structured notes');
  if (recommendedLearningStyles.includes('Kinesthetic')) activities.push('Role-play, experiments, and hands-on projects');

  const personalizedDescription = [
    `Dominant tendency: ${dominantType}.`,
    `Overall development score: ${overallScore}/5.`,
    strengths.length ? `Strengths: ${strengths.join('; ')}.` : 'Balanced profile with potential across areas.',
    `Recommended learning styles: ${recommendedLearningStyles.join(', ')}.`,
    activities.length ? `Suggested activities: ${activities.join('; ')}.` : 'Try a multimodal mix to explore preferences.',
  ].join(' ');

  return {
    categoryScores,
    dominantType,
    overallScore,
    recommendedLearningStyles,
    personalizedDescription,
    calculationSteps: steps,
  };
}


