const mongoose = require('mongoose');

const scoreBreakdownSchema = new mongoose.Schema({
  websiteQuality: { type: Number, default: 0 },
  keywordDensity:  { type: Number, default: 0 },
  queryMatchScore: { type: Number, default: 0 },
  businessSignals: { type: Number, default: 0 },
  overallScore:    { type: Number, default: 0 },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  jobId:           { type: String, required: true, index: true },
  query:           { type: String, required: true },
  location:        { type: String },
  // Raw scraped data
  businessName:    { type: String, required: true },
  address:         { type: String },
  phoneNumber:     { type: String },
  websiteUrl:      { type: String },
  rating:          { type: Number },
  reviewCount:     { type: Number },
  // AI Enriched
  servicesOffered: [String],
  specializations: [String],
  certifications:  [String],
  aiSummary:       { type: String },
  keyInsights:     [String],
  queryRelevanceExplanation: { type: String },
  // Scoring
  qualificationScore: { type: String, enum: ['High', 'Medium', 'Low', 'Unscored'], default: 'Unscored' },
  scoreBreakdown:  { type: scoreBreakdownSchema, default: () => ({}) },
  // Email Intelligence
  emailFormats:    [String],
  mxRecordValid:   { type: Boolean },
  // Meta
  status: {
    type: String,
    enum: ['pending', 'scraping', 'enriching', 'scoring', 'completed', 'failed'],
    default: 'pending',
  },
  errorMessage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
