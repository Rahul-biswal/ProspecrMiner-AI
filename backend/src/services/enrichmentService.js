const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENRICHMENT_PROMPT = (businessName, userQuery, websiteContent, metaTitle, metaDescription) => `
You are a B2B lead intelligence analyst for a sales team. Analyze the following business website content.

Business Name: ${businessName}
Original Search Query: "${userQuery}"
Page Title: "${metaTitle}"
Meta Description: "${metaDescription}"

Website Content (first 6000 chars):
---
${websiteContent}
---

Based on the content above, return a VALID JSON object with EXACTLY this structure (no extra keys):
{
  "servicesOffered": ["list of specific services this business offers"],
  "specializations": ["specific areas of expertise or specializations"],
  "certifications": ["any certifications, awards, or accreditations mentioned"],
  "aiSummary": "A 2-3 sentence professional summary of what this business does and who they serve.",
  "keyInsights": ["Specific insight 1", "Specific insight 2", "Specific insight 3"],
  "queryRelevanceExplanation": "A brief explanation of why this business is or is not a good match for the query."
}

Rules:
- Only include information that is explicitly mentioned in the content.
- If a field has no data, return an empty array [] or empty string "".
- keyInsights should be specific facts like "Offers free consultations", "Open 7 days a week", "Serves pediatric patients".
- Be factual. Do not hallucinate information not present in the content.
`;

/**
 * Enrich a lead with AI-extracted intelligence from its website content
 */
async function enrichLead(lead, scrapedData) {
  if (!scrapedData.success || !scrapedData.content) {
    return {
      servicesOffered: [],
      specializations: [],
      certifications: [],
      aiSummary: 'Website content could not be retrieved for analysis.',
      keyInsights: [],
      queryRelevanceExplanation: 'No website data available.',
    };
  }

  const prompt = ENRICHMENT_PROMPT(
    lead.businessName,
    lead.query,
    scrapedData.content,
    scrapedData.meta?.title || '',
    scrapedData.meta?.description || ''
  );

  // Attempt with retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        servicesOffered: result.servicesOffered || [],
        specializations: result.specializations || [],
        certifications: result.certifications || [],
        aiSummary: result.aiSummary || '',
        keyInsights: result.keyInsights || [],
        queryRelevanceExplanation: result.queryRelevanceExplanation || '',
      };
    } catch (err) {
      console.error(`Enrichment attempt ${attempt} failed for ${lead.businessName}:`, err.message);
      if (attempt === 2) {
        return {
          servicesOffered: [],
          specializations: [],
          certifications: [],
          aiSummary: 'AI enrichment failed after retries.',
          keyInsights: [],
          queryRelevanceExplanation: 'Enrichment unavailable.',
        };
      }
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
    }
  }
}

module.exports = { enrichLead };
