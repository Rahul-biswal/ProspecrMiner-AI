const { Worker } = require('bullmq');
const { connection } = require('../queues');
const { searchLeads } = require('../services/searchService');
const { scrapeBusinessWebsite } = require('../services/stealthScraper');
const { enrichLead } = require('../services/enrichmentService');
const { scoreLead } = require('../services/scoringService');
const { getEmailIntelligence } = require('../services/emailService');
const Lead = require('../models/Lead');
const Job = require('../models/Job');

/**
 * Main pipeline worker — processes one lead at a time through the full enrichment stack
 */
const pipelineWorker = new Worker(
  'searchQueue',
  async (job) => {
    const { jobId, query, location, maxResults } = job.data;

    console.log(`\n🚀 Starting pipeline for job ${jobId}: "${query}" in "${location}"`);

    // Update job status
    await Job.findOneAndUpdate({ jobId }, { status: 'running' });

    // Step 1: Scrape Google Maps + Search
    let rawLeads = [];
    try {
      rawLeads = await searchLeads(query, location, maxResults);
    } catch (err) {
      console.error('Search failed:', err.message);
      await Job.findOneAndUpdate({ jobId }, { status: 'failed', errorMessage: err.message, completedAt: new Date() });
      throw err;
    }

    // Save raw leads to DB with 'pending' status
    const leadDocs = await Lead.insertMany(
      rawLeads.map((l) => ({
        ...l,
        jobId,
        query,
        location,
        status: 'pending',
      }))
    );

    await Job.findOneAndUpdate({ jobId }, { totalLeads: leadDocs.length });

    console.log(`📋 Saved ${leadDocs.length} raw leads to DB`);

    // Step 2: Process each lead through the full pipeline
    for (const lead of leadDocs) {
      try {
        // Mark as scraping
        await Lead.findByIdAndUpdate(lead._id, { status: 'scraping' });

        // Scrape website
        const scrapedData = lead.websiteUrl
          ? await scrapeBusinessWebsite(lead.websiteUrl)
          : { success: false, error: 'No website URL', url: '' };

        // Mark as enriching
        await Lead.findByIdAndUpdate(lead._id, { status: 'enriching' });

        // AI Enrichment
        const enrichment = await enrichLead(
          { businessName: lead.businessName, query },
          scrapedData
        );

        // Scoring
        const { scoreBreakdown, qualificationScore } = await scoreLead(
          { businessName: lead.businessName, query, rating: lead.rating, reviewCount: lead.reviewCount, phoneNumber: lead.phoneNumber },
          scrapedData,
          enrichment
        );

        // Email Intelligence
        const { emailFormats, mxRecordValid } = await getEmailIntelligence(lead.websiteUrl);

        // Save all enriched data
        await Lead.findByIdAndUpdate(lead._id, {
          ...enrichment,
          scoreBreakdown,
          qualificationScore,
          emailFormats,
          mxRecordValid,
          status: 'completed',
        });

        // Increment processed count
        await Job.findOneAndUpdate({ jobId }, { $inc: { processedLeads: 1 } });

        console.log(`✅ ${lead.businessName} → ${qualificationScore} (${scoreBreakdown.overallScore}/100)`);
      } catch (err) {
        console.error(`❌ Failed to process ${lead.businessName}:`, err.message);
        await Lead.findByIdAndUpdate(lead._id, { status: 'failed', errorMessage: err.message });
        await Job.findOneAndUpdate({ jobId }, { $inc: { failedLeads: 1 } });
      }
    }

    // Mark job complete
    await Job.findOneAndUpdate({ jobId }, { status: 'completed', completedAt: new Date() });
    console.log(`\n🎉 Job ${jobId} completed!`);
  },
  {
    connection,
    concurrency: 1, // One search job at a time (each job manages its own pipeline)
  }
);

pipelineWorker.on('failed', (job, err) => {
  console.error(`Worker job ${job?.id} failed:`, err.message);
});

module.exports = pipelineWorker;
