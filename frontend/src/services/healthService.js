import axios from 'axios';
import api from '../lib/axios';
import supabase from '../lib/supabase';

export const healthService = {
  // Dashboard Summary
  getDashboardSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  // AI Symptom Checker
  checkSymptoms: async (symptomPayload) => {
    const response = await api.post('/symptoms/check', symptomPayload);
    return response.data;
  },

  // Predict health risk using scikit-learn models on FastAPI and save to Supabase
  predictRisk: async (assessmentId, diagnosticData) => {
    if (!assessmentId) {
      throw new Error('Assessment ID is required for prediction.');
    }

    const response = await api.post('/predict', {
      assessmentId,
      diagnosticData
    });

    return response.data;
  },

  // Upload Medical Record
  uploadRecord: async (formData) => {
    const response = await api.post('/records/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Fetch Records
  getRecords: async () => {
    const response = await api.get('/records');
    return response.data;
  },

  // Save Health Assessment details directly in Supabase
  saveHealthAssessment: async (assessmentData) => {
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User is not authenticated.');
    }

    // 2. Fetch session JWT existence
    const { data: { session } } = await supabase.auth.getSession();
    const jwtExists = !!session?.access_token;

    // Helper to convert inputs safely to boolean
    const toBoolean = (val) => {
      if (typeof val === 'boolean') return val;
      if (!val) return false;
      const lower = String(val).toLowerCase().trim();
      return ['yes', 'true', 'occasional', '1', 'frequently'].includes(lower);
    };

    // 3. Construct and convert payload values correctly
    const dbPayload = {
      user_id: user.id,
      member_id: assessmentData.member_id || null,
      age: assessmentData.age ? parseInt(assessmentData.age, 10) : null,
      gender: assessmentData.gender,
      height: assessmentData.height ? parseFloat(assessmentData.height) : null,
      weight: assessmentData.weight ? parseFloat(assessmentData.weight) : null,
      bmi: assessmentData.bmi ? parseFloat(assessmentData.bmi) : null,
      blood_group: assessmentData.blood_group || null,
      city: assessmentData.city,
      state: assessmentData.state,
      exercise: assessmentData.exercise,
      smoking: toBoolean(assessmentData.smoking),
      alcohol: toBoolean(assessmentData.alcohol),
      sleep: assessmentData.sleep ? parseFloat(assessmentData.sleep) : null,
      water_intake: assessmentData.water_intake ? parseFloat(assessmentData.water_intake) : null,
      food_preference: assessmentData.food_preference || null,
      occupation: assessmentData.occupation || null,
      fast_food: assessmentData.fast_food || null,
      sugary_drinks: assessmentData.sugary_drinks || null,
      stress: assessmentData.stress || null,
      screen_time: assessmentData.screen_time ? parseFloat(assessmentData.screen_time) : null,
      fruit_intake: assessmentData.fruit_intake || null,
      vegetable_intake: assessmentData.vegetable_intake || null,
      physical_activity: assessmentData.physical_activity || null,
      diet: assessmentData.diet || null,
      blood_pressure: assessmentData.blood_pressure,
      blood_sugar: assessmentData.blood_sugar ? parseFloat(assessmentData.blood_sugar) : null,
      cholesterol: assessmentData.cholesterol ? parseFloat(assessmentData.cholesterol) : null,
      heart_rate: assessmentData.heart_rate ? parseFloat(assessmentData.heart_rate) : null,
      known_diseases: assessmentData.known_diseases || null,
      medications: assessmentData.current_medicines || assessmentData.medications,
      allergies: assessmentData.allergies,
      family_history: assessmentData.family_history,
      symptoms: assessmentData.symptoms,
      // Optional laboratory & vitals metrics
      temperature: assessmentData.temperature ? parseFloat(assessmentData.temperature) : null,
      respiratory_rate: assessmentData.respiratory_rate ? parseInt(assessmentData.respiratory_rate, 10) : null,
      spo2: assessmentData.spo2 ? parseInt(assessmentData.spo2, 10) : null,
      waist_circumference: assessmentData.waist_circumference ? parseFloat(assessmentData.waist_circumference) : null,
      hip_circumference: assessmentData.hip_circumference ? parseFloat(assessmentData.hip_circumference) : null,
      hba1c: assessmentData.hba1c ? parseFloat(assessmentData.hba1c) : null,
      ldl: assessmentData.ldl ? parseFloat(assessmentData.ldl) : null,
      hdl: assessmentData.hdl ? parseFloat(assessmentData.hdl) : null,
      triglycerides: assessmentData.triglycerides ? parseFloat(assessmentData.triglycerides) : null,
      creatinine: assessmentData.creatinine ? parseFloat(assessmentData.creatinine) : null,
      egfr: assessmentData.egfr ? parseFloat(assessmentData.egfr) : null,
      ast: assessmentData.ast ? parseFloat(assessmentData.ast) : null,
      alt: assessmentData.alt ? parseFloat(assessmentData.alt) : null,
      uric_acid: assessmentData.uric_acid ? parseFloat(assessmentData.uric_acid) : null,
      hemoglobin: assessmentData.hemoglobin ? parseFloat(assessmentData.hemoglobin) : null,
      vitamin_d: assessmentData.vitamin_d ? parseFloat(assessmentData.vitamin_d) : null,
      vitamin_b12: assessmentData.vitamin_b12 ? parseFloat(assessmentData.vitamin_b12) : null
    };

    const tableName = 'health_records';

    // Log before insert
    console.log('--- INSERTING HEALTH RECORD ---');
    console.log('Current User:', user);
    console.log('JWT Exists:', jwtExists);
    console.log('Table Name:', tableName);
    console.log('Payload:', dbPayload);

    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([dbPayload])
        .select();

      console.log('Supabase Response:', data);
      console.log('Insert Error:', error);

      if (error) {
        // Self-healing fallback: retry inserting only the baseline columns if the new columns don't exist yet
        if (error.message?.includes('column') || error.code === 'PGRST204' || error.code === '42703') {
          console.warn('Initial health_records insert failed due to missing columns. Retrying with core fields only...');
          const corePayload = {
            user_id: dbPayload.user_id,
            member_id: dbPayload.member_id,
            age: dbPayload.age,
            gender: dbPayload.gender,
            height: dbPayload.height,
            weight: dbPayload.weight,
            bmi: dbPayload.bmi,
            blood_pressure: dbPayload.blood_pressure,
            blood_sugar: dbPayload.blood_sugar,
            cholesterol: dbPayload.cholesterol,
            heart_rate: dbPayload.heart_rate,
            smoking: dbPayload.smoking,
            alcohol: dbPayload.alcohol,
            exercise: dbPayload.exercise,
            sleep: dbPayload.sleep,
            family_history: dbPayload.family_history,
            city: dbPayload.city,
            state: dbPayload.state,
            symptoms: dbPayload.symptoms,
            medications: dbPayload.medications,
            allergies: dbPayload.allergies
          };
          const { data: retryData, error: retryError } = await supabase
            .from(tableName)
            .insert([corePayload])
            .select();
            
          if (retryError) {
            console.error('Fallback insert failed:', retryError);
            throw retryError;
          }
          return retryData && retryData.length > 0 ? retryData[0] : null;
        }
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Exception caught in saveHealthAssessment:', err);
      throw err;
    }
  },

  // Fetch the latest saved baseline assessment from Supabase
  getLatestHealthRecord: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication context missing or user session expired.');
    }

    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Fetch the latest saved prediction from Supabase
  getLatestPrediction: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication context missing or user session expired.');
    }

    const { data, error } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Fetch the latest saved AI report from Supabase
  getLatestAiReport: async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication context missing or user session expired.');
    }

    const { data, error } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  // Generate AI clinical report via Node.js backend
  generateAiReport: async (assessmentId, predictionId) => {
    const response = await api.post('/ai/report', {
      assessment_id: assessmentId,
      prediction_id: predictionId
    });
    return response.data;
  },

  // Fetch all EMR reports with search/sort queries
  getAllReports: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  // Fetch single EMR report by primary ID
  getReportById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // Delete EMR report record
  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  // Duplicate EMR report record to create a new historical entry
  duplicateReport: async (id) => {
    const response = await api.post(`/reports/${id}/duplicate`);
    return response.data;
  },

  // Family Members Management
  getFamilyMembers: async () => {
    const response = await api.get('/family-members');
    return response.data;
  },

  addFamilyMember: async (memberData) => {
    const response = await api.post('/family-members', memberData);
    return response.data;
  },

  deleteFamilyMember: async (id) => {
    const response = await api.delete(`/family-members/${id}`);
    return response.data;
  },
};

export default healthService;