/**
 * HireBlind Scoring Engine
 * Scores resumes against job descriptions across 3 dimensions:
 *   1. Skills Match (required skills)
 *   2. Years of Experience
 *   3. Role Relevance (career trajectory alignment)
 * Also computes a Confidence Score (0-100%) for EU AI Act Article 13 compliance.
 */

// Role-related keywords grouped by domain
const ROLE_DOMAINS = {
  engineering: ['engineer', 'developer', 'programmer', 'architect', 'devops', 'sre', 'full stack', 'backend', 'frontend', 'software'],
  data: ['data scientist', 'data analyst', 'data engineer', 'machine learning', 'ml engineer', 'ai', 'deep learning', 'analytics', 'bi analyst'],
  design: ['designer', 'ux', 'ui', 'figma', 'sketch', 'wireframe', 'prototyping', 'user research', 'visual design'],
  management: ['manager', 'lead', 'director', 'vp', 'head of', 'team lead', 'tech lead', 'scrum master', 'product owner', 'project manager'],
  marketing: ['marketing', 'seo', 'content', 'growth', 'social media', 'brand', 'campaign', 'digital marketing'],
  finance: ['accountant', 'finance', 'auditor', 'controller', 'cfo', 'financial analyst', 'risk', 'compliance'],
  operations: ['operations', 'logistics', 'supply chain', 'procurement', 'warehouse', 'inventory'],
  hr: ['recruiter', 'hr', 'human resources', 'talent acquisition', 'people operations', 'compensation'],
};

// Leadership / seniority indicators
const SENIORITY_KEYWORDS = [
  'senior', 'lead', 'principal', 'staff', 'head', 'director', 'manager',
  'vp', 'chief', 'architect', 'mentor', 'supervised', 'managed a team',
  'led a team', 'team of', 'reporting to',
];

// Soft skills that indicate role fitness
const SOFT_SKILL_KEYWORDS = [
  'leadership', 'teamwork', 'communication', 'problem solving',
  'critical thinking', 'collaboration', 'mentoring', 'decision making',
  'strategic planning', 'stakeholder management', 'cross-functional',
  'presentation', 'negotiation', 'conflict resolution',
];

// Technical bonus keywords beyond required skills
const BONUS_KEYWORDS = [
  'agile', 'scrum', 'devops', 'ci/cd', 'docker', 'kubernetes',
  'aws', 'azure', 'gcp', 'microservices', 'rest', 'api', 'testing',
  'tdd', 'machine learning', 'data analysis', 'cloud', 'security',
  'database', 'optimization', 'architecture', 'design patterns',
  'mentoring', 'project management',
];

function scoreResume(anonymisedText, jobDescription) {
  const { skills, min_experience, role_keywords, title } = jobDescription;
  const skillList = skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const resumeLower = anonymisedText.toLowerCase();
  const explanation = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // ═══════════════════════════════════════════
  // DIMENSION 1: Skills Match (+2 per skill)
  // ═══════════════════════════════════════════
  let skillsMatched = 0;
  for (const skill of skillList) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    const matched = regex.test(resumeLower);
    const points = matched ? 2 : 0;
    totalScore += points;
    maxPossibleScore += 2;
    if (matched) skillsMatched++;
    explanation.push({ item: skill, matched, points, category: 'skill' });
  }

  // ═══════════════════════════════════════════
  // DIMENSION 2: Years of Experience (+3 if meets minimum)
  // ═══════════════════════════════════════════
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
  const expPoints = expMatched ? 3 : (maxYears > 0 ? 1 : 0);
  totalScore += expPoints;
  maxPossibleScore += 3;
  explanation.push({
    item: `${min_experience}+ years experience`,
    matched: expMatched,
    points: expPoints,
    detected: maxYears > 0 ? `${maxYears} years found` : 'No experience mentioned',
    category: 'experience',
  });

  // ═══════════════════════════════════════════
  // DIMENSION 3: Role Relevance (+5 max)
  // ═══════════════════════════════════════════
  let roleScore = 0;
  const roleMaxPoints = 5;
  maxPossibleScore += roleMaxPoints;

  // 3a. Check role keywords from job description
  const roleKeywordList = role_keywords
    ? role_keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [];

  // If no explicit role keywords, try to infer from job title
  const titleLower = (title || '').toLowerCase();
  if (roleKeywordList.length === 0 && titleLower) {
    // Find which domain matches the title
    for (const [domain, keywords] of Object.entries(ROLE_DOMAINS)) {
      for (const kw of keywords) {
        if (titleLower.includes(kw)) {
          roleKeywordList.push(...keywords.slice(0, 5));
          break;
        }
      }
      if (roleKeywordList.length > 0) break;
    }
  }

  let roleMatches = 0;
  for (const keyword of roleKeywordList) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(resumeLower)) {
      roleMatches++;
    }
  }

  if (roleKeywordList.length > 0) {
    const roleRatio = roleMatches / roleKeywordList.length;
    roleScore = Math.round(roleRatio * roleMaxPoints);
  }

  // 3b. Seniority alignment boost
  let seniorityCount = 0;
  for (const kw of SENIORITY_KEYWORDS) {
    const regex = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
    if (regex.test(resumeLower)) {
      seniorityCount++;
    }
  }
  if (seniorityCount >= 2 && roleScore < roleMaxPoints) {
    roleScore = Math.min(roleScore + 1, roleMaxPoints);
  }

  totalScore += roleScore;
  explanation.push({
    item: 'Role relevance',
    matched: roleScore >= 3,
    points: roleScore,
    detected: roleKeywordList.length > 0
      ? `${roleMatches}/${roleKeywordList.length} role keywords matched`
      : 'No role keywords configured',
    category: 'role',
  });

  // ═══════════════════════════════════════════
  // BONUS: Soft skills & extra technical keywords (+1 each, max 5)
  // ═══════════════════════════════════════════
  let bonusCount = 0;
  const maxBonus = 5;

  for (const keyword of BONUS_KEYWORDS) {
    if (skillList.includes(keyword)) continue;
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(resumeLower)) {
      bonusCount++;
      totalScore += 1;
      maxPossibleScore += 1;
      explanation.push({ item: keyword, matched: true, points: 1, bonus: true, category: 'bonus' });
      if (bonusCount >= maxBonus) break;
    }
  }

  for (const keyword of SOFT_SKILL_KEYWORDS) {
    if (bonusCount >= maxBonus) break;
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(resumeLower)) {
      bonusCount++;
      totalScore += 1;
      maxPossibleScore += 1;
      explanation.push({ item: keyword, matched: true, points: 1, bonus: true, category: 'bonus' });
    }
  }

  // ═══════════════════════════════════════════
  // CONFIDENCE SCORE (EU AI Act Article 13)
  // ═══════════════════════════════════════════
  // Confidence = weighted combination of how many criteria matched
  // Weights: Skills 50%, Experience 20%, Role Relevance 30%
  const skillConfidence = skillList.length > 0 ? (skillsMatched / skillList.length) : 0;
  const expConfidence = expMatched ? 1.0 : (maxYears > 0 ? 0.4 : 0);
  const roleConfidence = roleKeywordList.length > 0
    ? (roleMatches / roleKeywordList.length)
    : (roleScore / roleMaxPoints);

  const rawConfidence = (skillConfidence * 0.50) + (expConfidence * 0.20) + (roleConfidence * 0.30);
  const confidence = Math.round(rawConfidence * 100);

  return {
    score: totalScore,
    confidence: Math.min(confidence, 100),
    explanation,
    scoring_metadata: {
      max_possible_score: maxPossibleScore + bonusCount,
      skills_matched: skillsMatched,
      total_skills: skillList.length,
      experience_detected: maxYears,
      experience_required: min_experience,
      role_keywords_matched: roleMatches,
      total_role_keywords: roleKeywordList.length,
      bonus_points: bonusCount,
    },
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { scoreResume };
