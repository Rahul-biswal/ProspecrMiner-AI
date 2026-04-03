const express = require('express');
const router = express.Router();
const {
  startJob, getJob, getJobProgress, getJobLeads,
  getLead, exportLeads, deleteJob, listJobs
} = require('../controllers/jobController');

// Jobs
router.get('/', listJobs);
router.post('/start', startJob);
router.get('/:jobId', getJob);
router.get('/:jobId/progress', getJobProgress);
router.get('/:jobId/leads', getJobLeads);
router.get('/:jobId/export', exportLeads);
router.delete('/:jobId', deleteJob);

// Individual lead
router.get('/leads/:id', getLead);

module.exports = router;
