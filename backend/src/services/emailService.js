const dns = require('dns').promises;

/**
 * Extract base domain from a URL
 */
function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Validate that a domain has MX records (can receive email)
 */
async function validateMXRecord(domain) {
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Generate common email format candidates for a domain
 * Uses common patterns since we may not always have a contact name
 */
function generateEmailFormats(domain, firstName = null, lastName = null) {
  if (!domain) return [];

  const generic = [
    `info@${domain}`,
    `contact@${domain}`,
    `hello@${domain}`,
    `admin@${domain}`,
    `office@${domain}`,
    `enquiries@${domain}`,
  ];

  if (!firstName || !lastName) return generic;

  const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.toLowerCase().replace(/[^a-z]/g, '');

  const named = [
    `${f}@${domain}`,
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${f[0]}${l}@${domain}`,
    `${f[0]}.${l}@${domain}`,
    `${l}@${domain}`,
  ];

  return [...named, ...generic];
}

/**
 * Run full email intelligence for a lead
 */
async function getEmailIntelligence(websiteUrl, firstName = null, lastName = null) {
  const domain = extractDomain(websiteUrl);
  const emailFormats = generateEmailFormats(domain, firstName, lastName);
  const mxRecordValid = await validateMXRecord(domain);

  return { emailFormats, mxRecordValid, domain };
}

module.exports = { getEmailIntelligence, generateEmailFormats, validateMXRecord, extractDomain };
