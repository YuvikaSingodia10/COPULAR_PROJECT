const { pool } = require('../db');

// In-memory store for original PII data (never written to DB)
// Key: candidate_code, Value: { name, email, phone, ... }
const originalPiiStore = new Map();

// Counters for sequential labelling
let candidateCounter = 0;
const universityMap = new Map();
let universityCounter = 0;

// Common first/last name patterns for detection
const NAME_PREFIXES = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir', 'miss'];
const COMMON_TITLES = ['name', 'full name', 'candidate name'];

// Regex patterns as specified
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
  PHONE: /(\+?\d[\d\s\-().]{7,}\d)/g,
  LINKEDIN: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s,)]+/gi,
  GITHUB: /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,)]+/gi,
  DOB: /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-]\d{4}\b/g,
  ADDRESS: /\d+[\w\s,.-]+(?:street|st|road|rd|avenue|ave|lane|nagar|sector|block)/gi,
  PIN_INDIA: /\b\d{6}\b/g,
  POSTCODE_UK: /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/g,
  SOCIAL_MEDIA: /(?:https?:\/\/)?(?:www\.)?(?:twitter|facebook|instagram|tiktok)\.com\/[^\s,)]+/gi,
  BASE64_IMAGE: /data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g,
  IMAGE_REF: /!\[.*?\]\(.*?\)/g,
  AGE_MENTION: /\b(?:age[:\s]+\d{1,3}|aged?\s+\d{1,3}|\d{1,3}\s+years?\s+old)\b/gi,
  DOB_TEXT: /\b(?:date\s+of\s+birth|d\.?o\.?b\.?)[:\s]+[^\n,;]+/gi,
  GENDER_PRONOUNS: /\b(?:he|she|his|her|him|herself|himself)\b/gi,
  NATIONALITY: /\b(?:nationality|citizen(?:ship)?|country\s+of\s+origin)[:\s]+[^\n,;]+/gi,
};

// Well-known universities for detection
const UNIVERSITY_KEYWORDS = [
  'university', 'institute', 'college', 'school of', 'academy',
  'iit', 'nit', 'iiit', 'bits', 'mit', 'stanford', 'harvard',
  'oxford', 'cambridge', 'caltech', 'yale', 'princeton',
  'ucla', 'ucl', 'eth', 'polytechnic',
];

function getNextCandidateCode() {
  const code = String.fromCharCode(65 + (candidateCounter % 26));
  const suffix = candidateCounter >= 26 ? Math.floor(candidateCounter / 26) : '';
  candidateCounter++;
  return `Candidate ${code}${suffix}`;
}

function replaceUniversities(text) {
  const universityRegex = new RegExp(
    `([A-Z][\\w\\s&'-]{2,}(?:${UNIVERSITY_KEYWORDS.join('|')})[\\w\\s&'-]{0,30})`,
    'gi'
  );

  return text.replace(universityRegex, (match) => {
    const normalised = match.trim().toLowerCase();
    if (!universityMap.has(normalised)) {
      universityCounter++;
      universityMap.set(
        normalised,
        `University ${String.fromCharCode(64 + universityCounter)}`
      );
    }
    return universityMap.get(normalised);
  });
}

function extractNameFromTop(text) {
  // The first non-empty, non-email, non-phone line is often the candidate name
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    // Skip if it looks like an email, phone, url, or section heading
    if (
      PATTERNS.EMAIL.test(line) ||
      PATTERNS.PHONE.test(line) ||
      /https?:\/\//.test(line) ||
      /^(objective|summary|experience|education|skills|profile|about)/i.test(line)
    ) {
      PATTERNS.EMAIL.lastIndex = 0;
      PATTERNS.PHONE.lastIndex = 0;
      continue;
    }
    // If it's a short line (likely a name — 1-4 words, mostly alpha)
    const words = line.split(/\s+/);
    if (words.length >= 1 && words.length <= 5 && /^[A-Za-z\s.'-]+$/.test(line)) {
      return line;
    }
  }
  return null;
}

async function stripPii(resumeText, candidateCode, performedBy) {
  const removedFields = [];
  let text = resumeText;
  const originalData = {};

  // 1. Extract and store the candidate name from the top
  const detectedName = extractNameFromTop(text);
  if (detectedName) {
    originalData.name = detectedName;
    text = text.split(detectedName).join('[REMOVED]');
    removedFields.push({ field: 'NAME', value: detectedName });
  }

  // 2. Extract emails
  const emails = text.match(PATTERNS.EMAIL) || [];
  if (emails.length > 0) originalData.email = emails[0];
  text = text.replace(PATTERNS.EMAIL, '[REMOVED]');
  emails.forEach((e) => removedFields.push({ field: 'EMAIL', value: e }));

  // 3. Extract phone numbers
  PATTERNS.PHONE.lastIndex = 0;
  const phones = text.match(PATTERNS.PHONE) || [];
  if (phones.length > 0) originalData.phone = phones[0];
  text = text.replace(PATTERNS.PHONE, '[REMOVED]');
  phones.forEach((p) => removedFields.push({ field: 'PHONE', value: p.trim() }));

  // 4. LinkedIn URLs
  const linkedins = text.match(PATTERNS.LINKEDIN) || [];
  text = text.replace(PATTERNS.LINKEDIN, '[REMOVED]');
  linkedins.forEach((l) => removedFields.push({ field: 'LINKEDIN', value: l }));

  // 5. GitHub URLs
  const githubs = text.match(PATTERNS.GITHUB) || [];
  text = text.replace(PATTERNS.GITHUB, '[REMOVED]');
  githubs.forEach((g) => removedFields.push({ field: 'GITHUB', value: g }));

  // 6. Social media links
  const socials = text.match(PATTERNS.SOCIAL_MEDIA) || [];
  text = text.replace(PATTERNS.SOCIAL_MEDIA, '[REMOVED]');
  socials.forEach((s) => removedFields.push({ field: 'SOCIAL_MEDIA', value: s }));

  // 7. Date of birth
  const dobs = text.match(PATTERNS.DOB) || [];
  text = text.replace(PATTERNS.DOB, '[REMOVED]');
  dobs.forEach((d) => removedFields.push({ field: 'DOB', value: d }));

  const dobTexts = text.match(PATTERNS.DOB_TEXT) || [];
  text = text.replace(PATTERNS.DOB_TEXT, '[REMOVED]');
  dobTexts.forEach((d) => removedFields.push({ field: 'DOB_TEXT', value: d }));

  // 8. Age mentions
  const ages = text.match(PATTERNS.AGE_MENTION) || [];
  text = text.replace(PATTERNS.AGE_MENTION, '[REMOVED]');
  ages.forEach((a) => removedFields.push({ field: 'AGE', value: a }));

  // 9. Addresses
  const addresses = text.match(PATTERNS.ADDRESS) || [];
  text = text.replace(PATTERNS.ADDRESS, '[REMOVED]');
  addresses.forEach((a) => removedFields.push({ field: 'ADDRESS', value: a }));

  // 10. PIN codes (India)
  const pins = text.match(PATTERNS.PIN_INDIA) || [];
  text = text.replace(PATTERNS.PIN_INDIA, '[REMOVED]');
  pins.forEach((p) => removedFields.push({ field: 'PIN_CODE', value: p }));

  // 11. Postcodes (UK/EU)
  const postcodes = text.match(PATTERNS.POSTCODE_UK) || [];
  text = text.replace(PATTERNS.POSTCODE_UK, '[REMOVED]');
  postcodes.forEach((p) => removedFields.push({ field: 'POSTCODE', value: p }));

  // 12. Gender pronouns in personal context
  text = text.replace(PATTERNS.GENDER_PRONOUNS, '[REMOVED]');
  removedFields.push({ field: 'GENDER_PRONOUNS', value: 'replaced' });

  // 13. Nationality mentions
  const nationalities = text.match(PATTERNS.NATIONALITY) || [];
  text = text.replace(PATTERNS.NATIONALITY, '[REMOVED]');
  nationalities.forEach((n) => removedFields.push({ field: 'NATIONALITY', value: n }));

  // 14. Base64 images
  const base64imgs = text.match(PATTERNS.BASE64_IMAGE) || [];
  text = text.replace(PATTERNS.BASE64_IMAGE, '[REMOVED]');
  base64imgs.forEach(() => removedFields.push({ field: 'BASE64_IMAGE', value: '[binary]' }));

  // 15. Markdown image references
  const imgRefs = text.match(PATTERNS.IMAGE_REF) || [];
  text = text.replace(PATTERNS.IMAGE_REF, '[REMOVED]');
  imgRefs.forEach((i) => removedFields.push({ field: 'IMAGE_REF', value: i }));

  // 16. Replace university names with coded labels
  text = replaceUniversities(text);

  // Store original PII in memory (NOT in DB)
  originalPiiStore.set(candidateCode, originalData);

  // Log every removed field to audit_logs
  for (const removed of removedFields) {
    try {
      await pool.query(
        'INSERT INTO audit_logs (action, candidate_code, performed_by) VALUES (?, ?, ?)',
        [
          `PII_REMOVED: ${removed.field}`,
          candidateCode,
          performedBy,
        ]
      );
    } catch (err) {
      console.error('Failed to log PII removal:', err.message);
    }
  }

  return {
    anonymisedText: text,
    removedCount: removedFields.length,
    candidateCode,
  };
}

function getOriginalPii(candidateCode) {
  return originalPiiStore.get(candidateCode) || null;
}

function resetCounters() {
  candidateCounter = 0;
  universityMap.clear();
  universityCounter = 0;
}

module.exports = {
  stripPii,
  getOriginalPii,
  resetCounters,
  getNextCandidateCode,
};
