function scoreResume(anonymisedText, jobDescription) {
  const { skills, min_experience } = jobDescription;
  const skillList = skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const resumeLower = anonymisedText.toLowerCase();
  const explanation = [];
  let totalScore = 0;

  // Score each required skill (+2 points per match)
  for (const skill of skillList) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    const matched = regex.test(resumeLower);
    const points = matched ? 2 : 0;
    totalScore += points;
    explanation.push({ item: skill, matched, points });
  }

  // Check experience (+3 points if meets minimum)
  const experiencePatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
    /(?:experience|exp)\s*[:\-]?\s*(\d+)\+?\s*(?:years?|yrs?)/gi,
    /(\d+)\+?\s*(?:years?|yrs?)/gi,
  ];

  let maxYears = 0;
  for (const pattern of experiencePatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(resumeLower)) !== null) {
      const years = parseInt(match[1], 10);
      if (years > 0 && years < 50) {
        maxYears = Math.max(maxYears, years);
      }
    }
  }

  const expMatched = maxYears >= min_experience;
  const expPoints = expMatched ? 3 : 0;
  totalScore += expPoints;
  explanation.push({
    item: `${min_experience} years experience`,
    matched: expMatched,
    points: expPoints,
    detected: maxYears > 0 ? `${maxYears} years found` : 'No experience mentioned',
  });

  // Bonus: +1 for each relevant keyword beyond required skills
  const bonusKeywords = [
    'leadership', 'teamwork', 'communication', 'agile', 'scrum',
    'devops', 'ci/cd', 'docker', 'kubernetes', 'aws', 'azure',
    'gcp', 'microservices', 'rest', 'api', 'testing', 'tdd',
    'machine learning', 'data analysis', 'cloud', 'security',
    'database', 'optimization', 'architecture', 'design patterns',
    'mentoring', 'project management', 'problem solving',
  ];

  for (const keyword of bonusKeywords) {
    if (skillList.includes(keyword)) continue; // skip if already counted
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(resumeLower)) {
      totalScore += 1;
      explanation.push({ item: keyword, matched: true, points: 1, bonus: true });
    }
  }

  return { score: totalScore, explanation };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { scoreResume };
