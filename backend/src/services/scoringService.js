const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Individual scoring functions ---

function scoreWebsiteQuality(scrapedData) {
  let score = 0;
  if (!scrapedData || !scrapedData.success) return 0;
  if (scrapedData.url?.startsWith('https')) score += 10;
  if (scrapedData.content?.length > 500) score += 10;
  if (scrapedData.content?.length > 2000) score += 5;
  if (scrapedData.meta?.description?.length > 20) score += 5;
  return Math.min(30, score);
}

function scoreKeywordDensity(content = '', query = '') {
  if (!content || !query) return 0;
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const contentLower = content.toLowerCase();
  const hits = queryWords.filter(word => contentLower.includes(word)).length;
  if (queryWords.length === 0) return 0;
  return Math.round((hits / queryWords.length) * 25);
}

function scoreBusinessSignals(lead) {
  let score = 0;
  if (lead.rating && parseFloat(lead.rating) >= 4.0) score += 8;
  else if (lead.rating && parseFloat(lead.rating) >= 3.5) score += 4;
  if (lead.reviewCount && parseInt(lead.reviewCount) >= 10) score += 4;
  if (lead.phoneNumber) score += 3;
  return Math.min(15, score);
}

async function scoreQueryMatchViaLLM(lead, enrichment) {
  if (!enrichment || !enrichment.servicesOffered?.length) return 10; // neutral default

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Rate (0-30) how relevant this business is to the query "${lead.query}".

Business: ${lead.businessName}
Services: ${enrichment.servicesOffered.join(', ')}
Summary: ${enrichment.aiSummary}

Return JSON: {"score": number, "reason": "one sentence reason"}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 150,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return Math.min(30, Math.max(0, parseInt(result.score) || 10));
  } catch (err) {
    console.error('Query match scoring failed:', err.message);
    return 10;
  }
}

/**
 * Score a lead and return breakdown + qualification
 */
async function scoreLead(lead, scrapedData, enrichment) {
  const websiteQuality = scoreWebsiteQuality(scrapedData);
  const keywordDensity = scoreKeywordDensity(scrapedData?.content, lead.query);
  const businessSignals = scoreBusinessSignals(lead);
  const queryMatchScore = await scoreQueryMatchViaLLM(lead, enrichment);

  const overallScore = websiteQuality + keywordDensity + businessSignals + queryMatchScore;

  let qualificationScore;
  if (overallScore >= 75) qualificationScore = 'High';
  else if (overallScore >= 45) qualificationScore = 'Medium';
  else qualificationScore = 'Low';

  return {
    scoreBreakdown: { websiteQuality, keywordDensity, queryMatchScore, businessSignals, overallScore },
    qualificationScore,
  };
}

module.exports = { scoreLead };
