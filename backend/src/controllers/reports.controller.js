import supabase from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Fetch all EMR reports with optional search and sorting
 */
export const getAllReports = async (req, res, next) => {
  try {
    const { q, sort, userId, memberId, risk, disease } = req.query;

    let query = supabase
      .from('health_reports')
      .select('*');

    // Filter by specific user (owner) - always derive from current authenticated user
    const ownerId = req.user.id;
    query = query.eq('user_id', ownerId);

    // Filter by specific family member if provided
    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    // Filter by risk category if provided
    if (risk) {
      query = query.eq('overall_risk', risk);
    }

    // Apply search filters
    if (q) {
      const searchStr = q.trim();
      query = query.or(
        `id.ilike.%${searchStr}%,` +
        `patient_name.ilike.%${searchStr}%,` +
        `overall_risk.ilike.%${searchStr}%,` +
        `symptoms.ilike.%${searchStr}%`
      );
    }

    // Apply sorting
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'score_desc') {
      query = query.order('health_score', { ascending: false });
    } else if (sort === 'score_asc') {
      query = query.order('health_score', { ascending: true });
    } else {
      // Default: Newest first
      query = query.order('created_at', { ascending: false });
    }

    let { data: reports, error } = await query;

    if (error) {
      logger.error('Failed to fetch reports from Supabase:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve reports' });
    }

    // Filter by disease in-memory for absolute correctness with JSONB paths
    if (reports && disease) {
      const fieldMap = {
        diabetes: 'diabetesRisk',
        cardio: 'cardioRisk',
        heart: 'cardioRisk',
        stroke: 'strokeRisk',
        kidney: 'kidneyRisk',
        liver: 'liverRisk',
        hypertension: 'hypertensionRisk',
        obesity: 'obesityRisk'
      };
      const targetField = fieldMap[disease.toLowerCase()];
      if (targetField) {
        reports = reports.filter(r => r.disease_risks && r.disease_risks[targetField] > 50);
      }
    }

    return res.json(reports || []);
  } catch (err) {
    logger.error('Error in getAllReports controller:', err);
    next(err);
  }
};

/**
 * Fetch a single report by ID
 */
export const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: report, error: reportErr } = await supabase
      .from('health_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (reportErr) {
      logger.error(`Failed to fetch report ${id} from Supabase:`, reportErr.message);
      return res.status(500).json({ error: 'Failed to retrieve report' });
    }

    if (!report) {
      return res.status(404).json({ error: 'Medical report not found' });
    }

    // 2. Fetch Owner User Profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', report.user_id)
      .maybeSingle();

    // 3. Fetch Family Member Profile if member_id exists
    let familyMember = null;
    if (report.member_id) {
      const { data: member } = await supabase
        .from('family_members')
        .select('*')
        .eq('member_id', report.member_id)
        .maybeSingle();
      familyMember = member;
    }

    // 4. Fetch Health Records (Assessment)
    let assessment = null;
    if (report.assessment_id) {
      const { data: rec } = await supabase
        .from('health_records')
        .select('*')
        .eq('id', report.assessment_id)
        .maybeSingle();
      assessment = rec;
    }

    // Self-healing fallback for legacy reports: query latest matching record created before the report
    if (!assessment) {
      const recQuery = supabase
        .from('health_records')
        .select('*')
        .eq('user_id', report.user_id)
        .order('created_at', { ascending: false });
      
      if (report.member_id) {
        recQuery.eq('member_id', report.member_id);
      }
      
      const { data: recs } = await recQuery;
      if (recs && recs.length > 0) {
        assessment = recs.find(r => new Date(r.created_at) <= new Date(report.created_at)) || recs[0];
      }
    }

    // 5. Fetch Risk Prediction
    let prediction = null;
    if (report.prediction_id) {
      const { data: pred } = await supabase
        .from('risk_predictions')
        .select('*')
        .eq('id', report.prediction_id)
        .maybeSingle();
      prediction = pred;
    }
    if (!prediction && assessment) {
      const { data: pred } = await supabase
        .from('risk_predictions')
        .select('*')
        .eq('assessment_id', assessment.id)
        .maybeSingle();
      prediction = pred;
    }

    // 6. Fetch AI Reports (Gemini details)
    let aiReport = null;
    if (prediction) {
      const { data: ai } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('prediction_id', prediction.id)
        .maybeSingle();
      aiReport = ai;
    }
    if (!aiReport && assessment) {
      const { data: ai } = await supabase
        .from('ai_reports')
        .select('*')
        .eq('assessment_id', assessment.id)
        .maybeSingle();
      aiReport = ai;
    }

    // 7. Validation Logging Checklist
    const validateField = (table, col, val, reason) => {
      if (val === null || val === undefined || val === '' || val === 'Not Provided') {
        console.warn(`[EMR Validation Warning] Table: ${table}, Column: ${col}, Reason: ${reason || 'Value is missing'}`);
      }
    };

    // Run diagnostics validation checks
    validateField('users', 'full_name', userProfile?.full_name, 'Owner profile name missing');
    if (report.member_id) {
      validateField('family_members', 'full_name', familyMember?.full_name, 'Family member name missing');
      validateField('family_members', 'relationship', familyMember?.relationship, 'Family relationship missing');
    }
    validateField('health_records', 'bmi', assessment?.bmi, 'Patient BMI not recorded');
    validateField('health_records', 'blood_pressure', assessment?.blood_pressure, 'Blood pressure vital missing');
    validateField('health_records', 'blood_sugar', assessment?.blood_sugar, 'Blood sugar vitals missing');
    validateField('risk_predictions', 'health_score', prediction?.health_score, 'AI ML Health Score missing');
    validateField('ai_reports', 'summary', aiReport?.summary, 'Gemini doctor advice summary missing');

    // 8. Compile consolidated report object (null fallbacks to "Not Provided")
    const consolidatedReport = {
      id: report.id,
      report_id: report.id,
      user_id: report.user_id,
      member_id: report.member_id,
      assessment_id: assessment?.id || "Not Provided",
      prediction_id: prediction?.id || "Not Provided",
      assessment_date: report.assessment_date || "Not Provided",
      assessment_time: report.assessment_time || "Not Provided",
      created_at: report.created_at,
      
      patient_info: {
        photo: familyMember?.photo || "Not Provided",
        patient_name: familyMember?.full_name || userProfile?.full_name || report.patient_name || "Not Provided",
        patient_id: report.member_id || report.user_id || "Not Provided",
        report_id: report.id,
        relationship: familyMember?.relationship || "Self",
        gender: familyMember?.gender || assessment?.gender || "Not Provided",
        age: familyMember?.age || assessment?.age || "Not Provided",
        dob: familyMember?.dob || "Not Provided",
        blood_group: familyMember?.blood_group || assessment?.blood_group || "Not Provided",
        height: familyMember?.height || assessment?.height || "Not Provided",
        weight: familyMember?.weight || assessment?.weight || "Not Provided",
        bmi: assessment?.bmi || "Not Provided",
        phone: familyMember?.phone || "Not Provided",
        emergency_contact: familyMember?.emergency_contact || "Not Provided",
        city: assessment?.city || "Not Provided",
        state: assessment?.state || "Not Provided",
      },

      lifestyle: {
        smoking: assessment?.smoking !== undefined ? (assessment.smoking ? "Yes" : "No") : "Not Provided",
        smoking_frequency: assessment?.smoking_frequency || (assessment?.smoking ? "Occasional" : "Never"),
        alcohol: assessment?.alcohol !== undefined ? (assessment.alcohol ? "Yes" : "No") : "Not Provided",
        alcohol_frequency: assessment?.alcohol_frequency || (assessment?.alcohol ? "Occasional" : "Never"),
        food_preference: assessment?.food_preference || assessment?.diet || "Not Provided",
        diet_preference: assessment?.food_preference || assessment?.diet || "Not Provided",
        fast_food_frequency: assessment?.fast_food || "Not Provided",
        sugary_drink_consumption: assessment?.sugary_drinks || "Not Provided",
        exercise: assessment?.exercise || "Not Provided",
        exercise_frequency: assessment?.exercise || "Not Provided",
        physical_activity_level: assessment?.physical_activity || "Not Provided",
        met_score: assessment?.met_score || "Not Provided",
        water_intake: assessment?.water_intake !== undefined ? `${assessment.water_intake} L/day` : "Not Provided",
        fruit_intake: assessment?.fruit_intake || "Not Provided",
        vegetable_intake: assessment?.vegetable_intake || "Not Provided",
        sleep_hours: assessment?.sleep !== undefined ? `${assessment.sleep} hrs/day` : "Not Provided",
        sleep_quality: assessment?.sleep_quality || "Not Provided",
        stress_level: assessment?.stress || "Not Provided",
        screen_time: assessment?.screen_time !== undefined ? `${assessment.screen_time} hrs/day` : "Not Provided",
      },

      medical_history: {
        known_diseases: assessment?.known_diseases || "Not Provided",
        current_medicines: assessment?.medications || assessment?.current_medicines || "Not Provided",
        allergies: assessment?.allergies || "Not Provided",
        previous_surgeries: assessment?.previous_surgeries || "Not Provided",
        hospitalizations: assessment?.hospitalizations || "Not Provided",
        vaccination_history: assessment?.vaccination_history || "Not Provided",
        family_history: assessment?.family_history || "Not Provided",
        genetic_diseases: assessment?.genetic_diseases || "Not Provided",
      },

      symptoms_details: {
        symptom_description: assessment?.symptoms || report.symptoms || "Not Provided",
        detected_symptoms: assessment?.detected_symptoms || (assessment?.symptoms ? [assessment.symptoms] : "Not Provided"),
        severity: assessment?.severity || "Not Provided",
        duration: assessment?.duration !== undefined ? `${assessment.duration} days` : "Not Provided",
      },

      vitals: {
        bmi: assessment?.bmi || "Not Provided",
        heart_rate: assessment?.heart_rate ? `${assessment.heart_rate} bpm` : "Not Provided",
        blood_pressure: assessment?.blood_pressure || "Not Provided",
        temperature: assessment?.temperature ? `${assessment.temperature} °F` : "Not Provided",
        respiratory_rate: assessment?.respiratory_rate ? `${assessment.respiratory_rate} rpm` : "Not Provided",
        spo2: assessment?.spo2 ? `${assessment.spo2} %` : "Not Provided",
        waist_circumference: assessment?.waist_circumference ? `${assessment.waist_circumference} cm` : "Not Provided",
        hip_circumference: assessment?.hip_circumference ? `${assessment.hip_circumference} cm` : "Not Provided",
      },

      lab_values: {
        fasting_blood_sugar: assessment?.blood_sugar ? `${assessment.blood_sugar} mg/dL` : "Not Provided",
        random_blood_sugar: assessment?.blood_sugar ? `${assessment.blood_sugar} mg/dL` : "Not Provided",
        hba1c: assessment?.hba1c ? `${assessment.hba1c} %` : "Not Provided",
        cholesterol: assessment?.cholesterol ? `${assessment.cholesterol} mg/dL` : "Not Provided",
        ldl: assessment?.ldl ? `${assessment.ldl} mg/dL` : "Not Provided",
        hdl: assessment?.hdl ? `${assessment.hdl} mg/dL` : "Not Provided",
        triglycerides: assessment?.triglycerides ? `${assessment.triglycerides} mg/dL` : "Not Provided",
        creatinine: assessment?.creatinine ? `${assessment.creatinine} mg/dL` : "Not Provided",
        egfr: assessment?.egfr ? `${assessment.egfr} mL/min/1.73m²` : "Not Provided",
        ast: assessment?.ast ? `${assessment.ast} U/L` : "Not Provided",
        alt: assessment?.alt ? `${assessment.alt} U/L` : "Not Provided",
        uric_acid: assessment?.uric_acid ? `${assessment.uric_acid} mg/dL` : "Not Provided",
        hemoglobin: assessment?.hemoglobin ? `${assessment.hemoglobin} g/dL` : "Not Provided",
        vitamin_d: assessment?.vitamin_d ? `${assessment.vitamin_d} ng/mL` : "Not Provided",
        vitamin_b12: assessment?.vitamin_b12 ? `${assessment.vitamin_b12} pg/mL` : "Not Provided",
      },

      prediction_results: {
        overall_health_score: prediction?.health_score || report.health_score || 0,
        overall_risk: prediction?.overall_risk || report.overall_risk || "Low",
        health_index: prediction?.health_score || report.health_score || 0,
        prediction_confidence: prediction?.confidence || 85,
        disease_risks: {
          diabetesRisk: prediction?.diabetes_risk || report.disease_risks?.diabetesRisk || 0,
          cardioRisk: prediction?.cardio_risk || report.disease_risks?.cardioRisk || 0,
          strokeRisk: prediction?.stroke_risk || report.disease_risks?.strokeRisk || 0,
          kidneyRisk: report.disease_risks?.kidneyRisk || Math.max(10, Math.min(95, Math.round(((prediction?.diabetes_risk || 0) + (prediction?.stroke_risk || 0)) / 2 - 5))),
          liverRisk: report.disease_risks?.liverRisk || Math.max(12, Math.min(92, Math.round(((prediction?.diabetes_risk || 0) * 0.8) + ((assessment?.alcohol === 'Yes' || assessment?.alcohol === true) ? 25 : 0)))),
          hypertensionRisk: report.disease_risks?.hypertensionRisk || Math.max(15, Math.min(98, Math.round(((prediction?.cardio_risk || 0) + (prediction?.stroke_risk || 0)) / 2 + 10))),
          obesityRisk: report.disease_risks?.obesityRisk || Math.max(10, Math.min(99, Math.round((assessment?.bmi || 0) > 25 ? ((assessment?.bmi || 0) - 20) * 8 : 15)))
        }
      },

      ai_analysis: {
        gemini_summary: aiReport?.summary || report.gemini_summary || "Not Provided",
        gemini_recommendations: {
          diet: aiReport?.diet || report.gemini_recommendations?.diet || [],
          exercise: aiReport?.exercise || report.gemini_recommendations?.exercise || [],
          medication: aiReport?.doctor_advice || report.gemini_recommendations?.doctor_advice || [],
          hydration: report.gemini_recommendations?.hydration || ["Drink at least 2.5-3.0 liters of water daily."],
          sleep: report.gemini_recommendations?.sleep || ["Maintain regular sleep schedules of 7-8 hours daily."],
          stress: report.gemini_recommendations?.stress || ["Practice regular stress management, including deep breathing techniques."],
          preventive_care: report.gemini_recommendations?.precautions || aiReport?.precautions || [],
          lifestyle: report.gemini_recommendations?.lifestyle || ["Optimize daily physical activity and reduce screen time."],
          medical_followup: aiReport?.emergency || report.gemini_recommendations?.emergency || []
        }
      }
    };

    return res.json(consolidatedReport);
  } catch (err) {
    logger.error('Error in getReportById controller:', err);
    next(err);
  }
};

/**
 * Delete a report record by ID
 */
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('health_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      logger.error(`Failed to delete report ${id}:`, error.message);
      return res.status(500).json({ error: 'Failed to delete report' });
    }

    return res.json({ success: true, message: 'Medical report successfully deleted' });
  } catch (err) {
    logger.error('Error in deleteReport controller:', err);
    next(err);
  }
};

/**
 * Duplicate a report record by ID, creating a new permanent entry
 */
export const duplicateReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch original record - restricted to owner
    const { data: original, error: fetchErr } = await supabase
      .from('health_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (fetchErr || !original) {
      logger.error(`Failed to fetch report for duplication ${id}:`, fetchErr?.message);
      return res.status(404).json({ error: 'Original report not found for duplication' });
    }

    // 2. Generate a new clinical report ID
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newReportId = `HG-${todayStr}-${randomSuffix}`;

    // 3. Compile duplicate payload
    const duplicatePayload = {
      ...original,
      id: newReportId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assessment_date: new Date().toISOString().split('T')[0],
      assessment_time: new Date().toTimeString().split(' ')[0],
    };

    // Remove any database default timestamps to prevent collisions
    delete duplicatePayload.id_numeric;

    // 4. Save duplicate to Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from('health_reports')
      .insert([duplicatePayload])
      .select();

    if (insertErr) {
      logger.error('Failed to save duplicated report to Supabase:', insertErr.message);
      return res.status(500).json({ error: 'Failed to duplicate medical report' });
    }

    return res.status(201).json(inserted[0]);
  } catch (err) {
    logger.error('Error in duplicateReport controller:', err);
    next(err);
  }
};
