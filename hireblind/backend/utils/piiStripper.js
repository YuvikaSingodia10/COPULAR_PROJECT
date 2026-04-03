// ─── In-Memory Store for Original PII Data ───
// Maps candidateCode → { originalName, originalEmail, originalPhone, originalText }
const originalDataStore = new Map();

// ─── Known Universities List ───
const KNOWN_UNIVERSITIES = [
  'Harvard', 'Stanford', 'MIT', 'Yale', 'Princeton', 'Columbia', 'Cornell',
  'Oxford', 'Cambridge', 'Berkeley', 'Caltech', 'UCLA', 'NYU', 'Duke',
  'Georgetown', 'Northwestern', 'Brown', 'Dartmouth', 'UPenn', 'Michigan',
  'Virginia', 'Georgia Tech', 'Carnegie Mellon', 'Purdue', 'Illinois',
  'Wisconsin', 'Minnesota', 'Ohio State', 'Penn State', 'Texas',
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'NIT Trichy', 'NIT Warangal',
  'BITS Pilani', 'VIT', 'SRM', 'Anna University', 'Delhi University',
  'Mumbai University', 'Pune University', 'Bangalore University', 'Jadavpur University',
  'Calcutta University', 'Madras University', 'Osmania University', 'Amity University',
  'Manipal University', 'Symbiosis', 'Christ University', 'Loyola College',
  'St. Xavier', 'Presidency University', 'Ashoka University', 'ISB Hyderabad',
  'IIM Ahmedabad', 'IIM Bangalore', 'IIM Calcutta', 'IIM Lucknow',
  'London School of Economics', 'Imperial College', 'King\'s College',
  'University College London', 'Edinburgh', 'Manchester', 'Bristol',
  'Warwick', 'Bath', 'Leeds', 'Sheffield', 'Nottingham', 'Southampton'
];

// Letter assignment for anonymisation
let candidateLetterIndex = 0;
let universityLetterIndex = 0;
const universityMap = new Map();

function resetLetterCounters() {
  candidateLetterIndex = 0;
  universityLetterIndex = 0;
  universityMap.clear();
}

function getNextCandidateLetter() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx = candidateLetterIndex % 26;
  const suffix = candidateLetterIndex >= 26 ? Math.floor(candidateLetterIndex / 26) : '';
  candidateLetterIndex++;
  return `Candidate ${letters[idx]}${suffix}`;
}

function getUniversityLabel(uniName) {
  const normalized = uniName.trim().toLowerCase();
  if (universityMap.has(normalized)) {
    return universityMap.get(normalized);
  }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx = universityLetterIndex % 26;
  const suffix = universityLetterIndex >= 26 ? Math.floor(universityLetterIndex / 26) : '';
  const label = `University ${letters[idx]}${suffix}`;
  universityLetterIndex++;
  universityMap.set(normalized, label);
  return label;
}

function stripPII(text, candidateCode) {
  let result = text;
  const removedFields = [];

  // ─── Extract original name (first line or 2+ capitalised words pattern) ───
  let originalName = null;
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/;
  const nameMatch = result.match(namePattern);
  if (nameMatch) {
    originalName = nameMatch[1];
  }

  // ─── Extract original email ───
  let originalEmail = null;
  const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
  const emailMatches = result.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    originalEmail = emailMatches[0];
  }

  // ─── Extract original phone ───
  let originalPhone = null;
  const phoneRegex = /(\+?\d[\d\s\-().]{7,}\d)/g;
  const phoneMatches = result.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    originalPhone = phoneMatches[0];
  }

  // ─── Store original data in memory ───
  originalDataStore.set(candidateCode, {
    originalName: originalName || 'Unknown',
    originalEmail: originalEmail || 'Unknown',
    originalPhone: originalPhone || 'Unknown',
    originalText: text
  });

  // ─── Strip Emails ───
  const emailCount = (result.match(emailRegex) || []).length;
  if (emailCount > 0) {
    result = result.replace(emailRegex, '[REMOVED]');
    removedFields.push({ field_type: 'EMAIL', count: emailCount });
  }

  // ─── Strip Phone Numbers ───
  const phoneCount = (result.match(phoneRegex) || []).length;
  if (phoneCount > 0) {
    result = result.replace(phoneRegex, '[REMOVED]');
    removedFields.push({ field_type: 'PHONE', count: phoneCount });
  }

  // ─── Strip LinkedIn URLs ───
  const linkedinRegex = /linkedin\.com\/in\/[^\s]+/gi;
  const linkedinCount = (result.match(linkedinRegex) || []).length;
  if (linkedinCount > 0) {
    result = result.replace(linkedinRegex, '[REMOVED]');
    removedFields.push({ field_type: 'LINKEDIN', count: linkedinCount });
  }

  // ─── Strip GitHub URLs ───
  const githubRegex = /github\.com\/[^\s]+/gi;
  const githubCount = (result.match(githubRegex) || []).length;
  if (githubCount > 0) {
    result = result.replace(githubRegex, '[REMOVED]');
    removedFields.push({ field_type: 'GITHUB', count: githubCount });
  }

  // ─── Strip DOB ───
  const dobRegex = /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-]\d{4}\b/g;
  const dobCount = (result.match(dobRegex) || []).length;
  if (dobCount > 0) {
    result = result.replace(dobRegex, '[REMOVED]');
    removedFields.push({ field_type: 'DOB', count: dobCount });
  }

  // ─── Strip Addresses ───
  const addressRegex = /\d+[\w\s,.-]+(?:street|st|road|rd|avenue|ave|lane|nagar|sector|block)/gi;
  const addressCount = (result.match(addressRegex) || []).length;
  if (addressCount > 0) {
    result = result.replace(addressRegex, '[REMOVED]');
    removedFields.push({ field_type: 'ADDRESS', count: addressCount });
  }

  // ─── Strip PIN Codes (6-digit) ───
  const pinRegex = /\b\d{6}\b/g;
  const pinCount = (result.match(pinRegex) || []).length;
  if (pinCount > 0) {
    result = result.replace(pinRegex, '[REMOVED]');
    removedFields.push({ field_type: 'PIN_CODE', count: pinCount });
  }

  // ─── Strip UK Postcodes ───
  const postcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g;
  const postcodeCount = (result.match(postcodeRegex) || []).length;
  if (postcodeCount > 0) {
    result = result.replace(postcodeRegex, '[REMOVED]');
    removedFields.push({ field_type: 'POSTCODE', count: postcodeCount });
  }

  // ─── Replace Gender Pronouns ───
  result = result.replace(/\bhe\b/gi, 'they');
  result = result.replace(/\bshe\b/gi, 'they');
  result = result.replace(/\bhis\b/gi, 'their');
  result = result.replace(/\bher\b/gi, 'their');
  result = result.replace(/\bhim\b/gi, 'them');

  // ─── Replace University Names ───
  let uniCount = 0;
  for (const uni of KNOWN_UNIVERSITIES) {
    const uniRegex = new RegExp(`\\b${uni.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (uniRegex.test(result)) {
      const label = getUniversityLabel(uni);
      result = result.replace(uniRegex, label);
      uniCount++;
    }
  }
  // Pattern: "University of X" or "X University" or "X Institute of Technology"
  const uniPatternA = /University of [A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g;
  const uniMatchesA = result.match(uniPatternA) || [];
  for (const match of uniMatchesA) {
    if (!match.startsWith('University A') && !match.startsWith('University B') && !match.startsWith('University C')) {
      const label = getUniversityLabel(match);
      result = result.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label);
      uniCount++;
    }
  }
  const uniPatternB = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\s+University/g;
  const uniMatchesB = result.match(uniPatternB) || [];
  for (const match of uniMatchesB) {
    if (!match.includes('University A') && !match.includes('University B') && !match.includes('University C')) {
      const label = getUniversityLabel(match);
      result = result.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label);
      uniCount++;
    }
  }
  if (uniCount > 0) {
    removedFields.push({ field_type: 'UNIVERSITY', count: uniCount });
  }

  // ─── Replace Full Names (2+ capitalised words) ───
  const candidateLabel = getNextCandidateLetter();
  if (originalName) {
    const nameEscaped = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameReg = new RegExp(nameEscaped, 'g');
    const nameCount = (result.match(nameReg) || []).length;
    if (nameCount > 0) {
      result = result.replace(nameReg, candidateLabel);
      removedFields.push({ field_type: 'NAME', count: nameCount });
    }
  }

  return {
    anonymisedText: result,
    removedFields,
    candidateLabel
  };
}

function getOriginalData(candidateCode) {
  return originalDataStore.get(candidateCode) || null;
}

function clearOriginalData(candidateCode) {
  originalDataStore.delete(candidateCode);
}

module.exports = {
  stripPII,
  getOriginalData,
  clearOriginalData,
  resetLetterCounters,
  originalDataStore
};
