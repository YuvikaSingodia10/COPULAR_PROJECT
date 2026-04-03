function scoreResume(anonymisedText, jobDescription) {
  const { skills, min_experience } = jobDescription;
  const skillList = skills.split(',').map(s => s.trim().toLowerCase());
  const textLower = anonymisedText.toLowerCase();
  const explanation = [];
  let totalScore = 0;

  // ─── Score each required skill (+2 per match) ───
  for (const skill of skillList) {
    const matched = textLower.includes(skill);
    const points = matched ? 2 : 0;
    totalScore += points;
    explanation.push({
      item: skill.charAt(0).toUpperCase() + skill.slice(1),
      matched,
      points
    });
  }

  // ─── Score experience (+3 if meets minimum) ───
  const expRegex = /(\d+)\+?\s*years?/gi;
  let maxExperience = 0;
  let expMatch;
  while ((expMatch = expRegex.exec(anonymisedText)) !== null) {
    const years = parseInt(expMatch[1], 10);
    if (years > maxExperience) {
      maxExperience = years;
    }
  }

  const expMet = maxExperience >= min_experience;
  const expPoints = expMet ? 3 : 0;
  totalScore += expPoints;
  explanation.push({
    item: `${maxExperience > 0 ? maxExperience : 0} years exp (min: ${min_experience})`,
    matched: expMet,
    points: expPoints
  });

  // ─── Bonus points for relevant keywords beyond required skills (+1 each) ───
  const bonusKeywords = [
    'agile', 'scrum', 'ci/cd', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'microservices', 'graphql', 'typescript', 'redis', 'mongodb', 'postgresql',
    'git', 'jenkins', 'terraform', 'linux', 'nginx', 'webpack', 'babel',
    'jest', 'mocha', 'cypress', 'selenium', 'figma', 'jira', 'confluence',
    'leadership', 'mentoring', 'architecture', 'system design', 'api design',
    'machine learning', 'data analysis', 'python', 'java', 'c++', 'go', 'rust',
    'swift', 'kotlin', 'flutter', 'react native', 'vue', 'angular', 'svelte',
    'next.js', 'express', 'spring', 'django', 'flask', 'laravel', 'rails',
    'elasticsearch', 'kafka', 'rabbitmq', 'prometheus', 'grafana'
  ];

  let bonusCount = 0;
  for (const keyword of bonusKeywords) {
    if (!skillList.includes(keyword) && textLower.includes(keyword)) {
      totalScore += 1;
      bonusCount++;
      explanation.push({
        item: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        matched: true,
        points: 1
      });
    }
  }

  return {
    score: totalScore,
    explanation
  };
}

function assignRanks(candidates) {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return sorted.map((candidate, index) => ({
    ...candidate,
    rank: index + 1
  }));
}

module.exports = { scoreResume, assignRanks };
