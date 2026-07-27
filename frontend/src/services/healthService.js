import api from '../lib/axios';

export const healthService = {
  // Fetch overall patient health metrics and logs for charts
  getDashboardSummary: async () => {
    return api.get('/dashboard/summary');
  },

  // Post symptom questions to obtain AI triage assessments
  checkSymptoms: async (symptomPayload) => {
    return api.post('/symptoms/check', symptomPayload);
  },

  // Submit diagnostic stats to calculate risk levels and SHAP values
  predictRisk: async (diagnosticData) => {
    return api.post('/predictions/risk', diagnosticData);
  },

  // Upload patient documents (PDF/images) for analysis
  uploadRecord: async (formData) => {
    return api.post('/records/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Fetch list of processed health records
  getRecords: async () => {
    return api.get('/records');
  },
};

export default healthService;
