import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clipboard, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Sparkles,
  Heart,
  Calendar,
  Layers,
  Users,
  Dumbbell,
  Stethoscope,
  Activity,
  FileText
} from 'lucide-react';
import healthService from '../../services/healthService';
import { authService } from '../../services/authService';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export const HealthAssessmentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { search } = useLocation();

  // Fetch family members list for select patient step
  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembersList'],
    queryFn: healthService.getFamilyMembers,
  });

  const memberIdFromUrl = new URLSearchParams(search).get('memberId');

  const [step, setStep] = useState(memberIdFromUrl ? 1 : 0);
  const [selectedMemberId, setSelectedMemberId] = useState(memberIdFromUrl || '');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Health Assessment Logged Successfully!');
  const [toastType, setToastType] = useState('success');

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger, reset } = useForm({
    defaultValues: {
      member_id: memberIdFromUrl || '',
      full_name: '',
      age: '',
      gender: '',
      height: '',
      weight: '',
      bmi: '',
      blood_group: '',
      city: '',
      state: '',
      exercise: 'Moderate',
      smoking: 'No',
      alcohol: 'No',
      sleep: '8',
      water_intake: '2',
      food_preference: 'Veg',
      occupation: '',
      fast_food: 'Occasional',
      sugary_drinks: 'Occasional',
      stress: 'Moderate',
      screen_time: '5',
      fruit_intake: 'Occasional',
      vegetable_intake: 'Daily',
      physical_activity: 'Moderate',
      diet: 'Balanced',
      blood_pressure: '',
      blood_sugar: '',
      heart_rate: '',
      cholesterol: '',
      known_diseases: '',
      current_medicines: '',
      allergies: '',
      family_history: '',
      symptoms: '',
      // Optional advanced laboratory metrics & advanced vitals
      temperature: '',
      respiratory_rate: '',
      spo2: '',
      waist_circumference: '',
      hip_circumference: '',
      hba1c: '',
      ldl: '',
      hdl: '',
      triglycerides: '',
      creatinine: '',
      egfr: '',
      ast: '',
      alt: '',
      uric_acid: '',
      hemoglobin: '',
      vitamin_d: '',
      vitamin_b12: ''
    }
  });

  const weight = watch('weight');
  const height = watch('height');
  const bmiValue = watch('bmi');

  // Auto pre-populate member info when selected
  useEffect(() => {
    if (selectedMemberId && familyMembers.length > 0) {
      const member = familyMembers.find(m => m.member_id === selectedMemberId);
      if (member) {
        setValue('member_id', member.member_id);
        setValue('full_name', member.full_name);
        setValue('age', String(member.age || ''));
        setValue('gender', member.gender);
        setValue('blood_group', member.blood_group || '');
        setValue('height', String(member.height || ''));
        setValue('weight', String(member.weight || ''));
        setValue('phone', member.phone || '');
      }
    }
  }, [selectedMemberId, familyMembers, setValue]);

  // Auto calculation of BMI (Weight / Height in meters squared)
  useEffect(() => {
    if (weight && height) {
      const hMetres = parseFloat(height) / 100;
      const calculatedBmi = (parseFloat(weight) / (hMetres * hMetres)).toFixed(1);
      setValue('bmi', calculatedBmi);
    } else {
      setValue('bmi', '');
    }
  }, [weight, height, setValue]);

  // Mutation to save health assessment and generate prediction + AI report
  const mutation = useMutation({
    mutationFn: async (assessmentData) => {
      // Ensure user profile exists in public.users table before inserting
      await authService.ensureUserProfile();

      console.log('Sending Assessment payload:', assessmentData);

      // 1. Save Assessment
      const assessment = await healthService.saveHealthAssessment(assessmentData);
      if (!assessment || !assessment.id) {
        throw new Error("Failed to save health assessment.");
      }

      // 2. Predict Risk (Check duplicate -> call FastAPI -> save risk_predictions)
      const bpStr = assessment.blood_pressure || '120';
      const bpValue = parseInt(bpStr.split('/')[0] || bpStr || '120', 10);
      const bsValue = parseInt(assessment.blood_sugar || '90', 10);

      const formattedPayload = {
        age: parseInt(assessment.age, 10),
        gender: assessment.gender,
        height: parseFloat(assessment.height),
        weight: parseFloat(assessment.weight),
        bmi: parseFloat(assessment.bmi),
        blood_pressure: bpValue,
        blood_sugar: bsValue,
        exercise: assessment.exercise || 'Moderate',
        smoking: assessment.smoking || 'No',
        alcohol: assessment.alcohol || 'No',
        sleep: parseFloat(assessment.sleep || '8'),
        family_history: assessment.family_history || 'None',
        symptoms: assessment.symptoms || '',
      };

      const prediction = await healthService.predictRisk(assessment.id, formattedPayload);
      if (!prediction || !prediction.id) {
        throw new Error("Failed to generate risk prediction.");
      }

      // 3. Call Gemini & Save report
      const aiReport = await healthService.generateAiReport(assessment.id, prediction.id);
      return { assessment, prediction, aiReport };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latestHealthRecord'] });
      queryClient.invalidateQueries({ queryKey: ['latestPrediction'] });
      queryClient.invalidateQueries({ queryKey: ['latestAiReport'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['allReportsForCards'] });
      queryClient.invalidateQueries({ queryKey: ['emrSiblingReportsForView'] });
      setToastType('success');
      setToastMessage('Health Assessment Logged Successfully!');
      setShowToast(true);
      reset();
      setStep(0);
      setSelectedMemberId('');
      setTimeout(() => {
        setShowToast(false);
        navigate('/');
      }, 3000);
    },
    onError: (err) => {
      console.error('Mutation save health assessment failed:', err);
      setToastType('error');
      setToastMessage(err.message || 'Failed to save health assessment.');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 6000);
    }
  });

  const validateStep = async () => {
    let fields = [];
    if (step === 1) {
      fields = ['age', 'gender', 'height', 'weight', 'city', 'state'];
    } else if (step === 3) {
      fields = ['symptoms'];
    }

    if (fields.length > 0) {
      const isValid = await trigger(fields);
      return isValid;
    }
    return true;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep();
    if (isStepValid) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = (data) => {
    // Format values before database insert
    const formattedPayload = {
      member_id: data.member_id || null,
      full_name: data.full_name || null,
      age: parseInt(data.age, 10),
      gender: data.gender,
      height: parseFloat(data.height),
      weight: parseFloat(data.weight),
      bmi: data.bmi ? parseFloat(data.bmi) : null,
      blood_group: data.blood_group || null,
      city: data.city,
      state: data.state,
      exercise: data.exercise || null,
      smoking: data.smoking || null,
      alcohol: data.alcohol || null,
      sleep: data.sleep ? parseFloat(data.sleep) : null,
      water_intake: data.water_intake ? parseFloat(data.water_intake) : null,
      food_preference: data.food_preference || null,
      occupation: data.occupation || null,
      fast_food: data.fast_food || null,
      sugary_drinks: data.sugary_drinks || null,
      stress: data.stress || null,
      screen_time: data.screen_time ? parseFloat(data.screen_time) : null,
      fruit_intake: data.fruit_intake || null,
      vegetable_intake: data.vegetable_intake || null,
      physical_activity: data.physical_activity || null,
      diet: data.diet || null,
      blood_pressure: data.blood_pressure || null,
      blood_sugar: data.blood_sugar ? parseFloat(data.blood_sugar) : null,
      heart_rate: data.heart_rate ? parseFloat(data.heart_rate) : null,
      cholesterol: data.cholesterol ? parseFloat(data.cholesterol) : null,
      known_diseases: data.known_diseases || null,
      current_medicines: data.current_medicines || null,
      allergies: data.allergies || null,
      family_history: data.family_history || null,
      symptoms: data.symptoms,
      // Optional laboratory parameters & advanced vitals
      temperature: data.temperature ? parseFloat(data.temperature) : null,
      respiratory_rate: data.respiratory_rate ? parseInt(data.respiratory_rate, 10) : null,
      spo2: data.spo2 ? parseInt(data.spo2, 10) : null,
      waist_circumference: data.waist_circumference ? parseFloat(data.waist_circumference) : null,
      hip_circumference: data.hip_circumference ? parseFloat(data.hip_circumference) : null,
      hba1c: data.hba1c ? parseFloat(data.hba1c) : null,
      ldl: data.ldl ? parseFloat(data.ldl) : null,
      hdl: data.hdl ? parseFloat(data.hdl) : null,
      triglycerides: data.triglycerides ? parseFloat(data.triglycerides) : null,
      creatinine: data.creatinine ? parseFloat(data.creatinine) : null,
      egfr: data.egfr ? parseFloat(data.egfr) : null,
      ast: data.ast ? parseFloat(data.ast) : null,
      alt: data.alt ? parseFloat(data.alt) : null,
      uric_acid: data.uric_acid ? parseFloat(data.uric_acid) : null,
      hemoglobin: data.hemoglobin ? parseFloat(data.hemoglobin) : null,
      vitamin_d: data.vitamin_d ? parseFloat(data.vitamin_d) : null,
      vitamin_b12: data.vitamin_b12 ? parseFloat(data.vitamin_b12) : null
    };
    mutation.mutate(formattedPayload);
  };

  const stepsMeta = [
    { label: 'Personal Information', desc: 'Demographics profile' },
    { label: 'Lifestyle Choices', desc: 'Social & habits metrics' },
    { label: 'Medical & Symptoms', desc: 'History, vitals & symptoms' },
    { label: 'Laboratory Results', desc: '(Optional) Advanced clinical panel' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white font-bold text-xs ${
              toastType === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <AlertCircle size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-805 dark:text-slate-100 flex items-center gap-2">
          <Clipboard className="text-teal-600 dark:text-teal-400 animate-pulse" size={24} />
          Baseline Health Assessment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Record diagnostics baselines and active complaints.</p>
      </div>

      {/* Steps Progress Indicator */}
      {step > 0 && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm transition-colors duration-200">
          {stepsMeta.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted 
                      ? 'bg-teal-600 text-white' 
                      : isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                  }`}>
                    {isCompleted ? <Check size={12} /> : stepNum}
                  </div>
                  <span className={`text-xs font-semibold hidden md:inline truncate ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                <div className={`h-1 w-full rounded-full ${
                  isCompleted ? 'bg-teal-600' : isActive ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-900'
                }`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Form Wizard Card */}
      <Card>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              
              {/* STEP 0: SELECT FAMILY MEMBER */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 py-4"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 text-center">
                    <Users className="h-10 w-10 text-teal-600 mx-auto mb-2 animate-bounce" />
                    <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">Select EMR Patient Profile</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Evaluate a registered family member or return to add a new profile.</p>
                  </div>

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">
                        Patient Profile
                      </label>
                      <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-805 dark:text-white transition-all outline-none text-xs font-bold"
                      >
                        <option value="">-- Select Family Member --</option>
                        {familyMembers.map(m => (
                          <option key={m.member_id} value={m.member_id}>
                            {m.full_name} ({m.relationship})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="flex-1 text-xs font-bold py-2.5"
                      >
                        Back to Dashboard
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (!selectedMemberId) {
                            alert('Please select a patient profile to proceed.');
                            return;
                          }
                          setStep(1);
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs font-bold py-2.5"
                      >
                        Start Diagnostic Wizard
                      </Button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-xs font-bold text-teal-650 hover:text-teal-750 underline"
                      >
                        + Create New Patient Profile
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: PERSONAL DETAILS */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="text-md font-bold text-slate-800">Step 1: Personal Information</h3>
                    <p className="text-xs text-slate-400">Demographic details and physical baselines.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Full Name"
                      placeholder="e.g. John Shah"
                      error={errors.full_name?.message}
                      id="full_name"
                      {...register('full_name')}
                    />

                    <Input
                      label="Age *"
                      type="number"
                      placeholder="e.g. 35"
                      error={errors.age?.message}
                      id="age"
                      {...register('age', { 
                        required: 'Age is required.',
                        min: { value: 1, message: 'Invalid age' }
                      })}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="gender" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Gender *
                      </label>
                      <select
                        id="gender"
                        className={`w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm ${
                          errors.gender ? 'border-red-400 dark:border-red-400' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        {...register('gender', { required: 'Gender selection is required.' })}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && (
                        <span className="text-xs text-red-500 font-medium">{errors.gender.message}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Height (cm) *"
                      type="number"
                      placeholder="e.g. 175"
                      error={errors.height?.message}
                      id="height"
                      {...register('height', { 
                        required: 'Height is required.',
                        min: { value: 30, message: 'Invalid height' }
                      })}
                    />

                    <Input
                      label="Weight (kg) *"
                      type="number"
                      placeholder="e.g. 70"
                      error={errors.weight?.message}
                      id="weight"
                      {...register('weight', { 
                        required: 'Weight is required.',
                        min: { value: 5, message: 'Invalid weight' }
                      })}
                    />

                    <div className="relative">
                      <Input
                        label="Body Mass Index (BMI)"
                        type="text"
                        placeholder="Calculated automatically"
                        id="bmi"
                        readOnly
                        className="bg-slate-50/50 cursor-not-allowed"
                        {...register('bmi')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="blood_group" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Blood Group
                      </label>
                      <select
                        id="blood_group"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm"
                        {...register('blood_group')}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <Input
                      label="City *"
                      placeholder="e.g. Chicago"
                      error={errors.city?.message}
                      id="city"
                      {...register('city', { required: 'City is required.' })}
                    />

                    <Input
                      label="State *"
                      placeholder="e.g. Illinois"
                      error={errors.state?.message}
                      id="state"
                      {...register('state', { required: 'State is required.' })}
                    />
                  </div>
                </motion.div>
              )}

              {/* STEP 2: LIFESTYLE & SOCIAL HABITS */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="text-md font-bold text-slate-800">Step 2: Lifestyle Habits</h3>
                    <p className="text-xs text-slate-400">Activity index and lifestyle factors.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="exercise" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Exercise Frequency
                      </label>
                      <select
                        id="exercise"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm"
                        {...register('exercise')}
                      >
                        <option value="None">None</option>
                        <option value="Light">Light (1-2 days/week)</option>
                        <option value="Moderate">Moderate (3-4 days/week)</option>
                        <option value="Active">Active (5+ days/week)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="smoking" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Smoking Habits
                      </label>
                      <select
                        id="smoking"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm"
                        {...register('smoking')}
                      >
                        <option value="No">No</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="alcohol" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Alcohol Habits
                      </label>
                      <select
                        id="alcohol"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm"
                        {...register('alcohol')}
                      >
                        <option value="No">No</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Sleep (Hours/Day)"
                      type="number"
                      placeholder="e.g. 7"
                      id="sleep"
                      {...register('sleep')}
                    />

                    <Input
                      label="Water Intake (Litres/Day)"
                      type="number"
                      placeholder="e.g. 2"
                      id="water_intake"
                      {...register('water_intake')}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="food_preference" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Dietary Preference
                      </label>
                      <select
                        id="food_preference"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-805 dark:text-white transition-all outline-none text-sm"
                        {...register('food_preference')}
                      >
                        <option value="Veg">Vegetarian</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Keto">Keto</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Input
                      label="Occupation"
                      placeholder="e.g. Software Engineer"
                      id="occupation"
                      {...register('occupation')}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="fast_food" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Fast Food Frequency
                      </label>
                      <select
                        id="fast_food"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm"
                        {...register('fast_food')}
                      >
                        <option value="Rarely">Rarely</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="sugary_drinks" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Sugary Drinks Load
                      </label>
                      <select
                        id="sugary_drinks"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm"
                        {...register('sugary_drinks')}
                      >
                        <option value="Rarely">Rarely</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="stress" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Daily Stress Index
                      </label>
                      <select
                        id="stress"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm"
                        {...register('stress')}
                      >
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <Input
                      label="Screen Time (Hours/Day)"
                      type="number"
                      placeholder="e.g. 6"
                      id="screen_time"
                      {...register('screen_time')}
                    />

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="diet" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Diet Plan
                      </label>
                      <select
                        id="diet"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm"
                        {...register('diet')}
                      >
                        <option value="Balanced">Balanced Diet</option>
                        <option value="High Protein">High Protein</option>
                        <option value="Low Carb">Low Carb</option>
                        <option value="Mediterranean">Mediterranean</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: MEDICAL INFORMATION & ACTIVE SYMPTOMS */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="text-md font-bold text-slate-800">Step 3: Medical Information & Symptoms</h3>
                    <p className="text-xs text-slate-400">Clinical diagnostics, medical history, and symptoms.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <Input
                      label="Blood Pressure (mmHg)"
                      placeholder="e.g. 120/80"
                      id="blood_pressure"
                      {...register('blood_pressure')}
                    />

                    <Input
                      label="Blood Sugar (mg/dL)"
                      type="number"
                      placeholder="e.g. 95"
                      id="blood_sugar"
                      {...register('blood_sugar')}
                    />

                    <Input
                      label="Heart Rate (bpm)"
                      type="number"
                      placeholder="e.g. 72"
                      id="heart_rate"
                      {...register('heart_rate')}
                    />

                    <Input
                      label="Cholesterol (mg/dL)"
                      type="number"
                      placeholder="e.g. 190"
                      id="cholesterol"
                      {...register('cholesterol')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="known_diseases" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Known Diseases / Conditions
                      </label>
                      <textarea
                        id="known_diseases"
                        placeholder="e.g. Hypertension, Asthma"
                        className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm focus:border-brand-500"
                        {...register('known_diseases')}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="current_medicines" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Current Medications
                      </label>
                      <textarea
                        id="current_medicines"
                        placeholder="e.g. Lisinopril 10mg once daily"
                        className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm focus:border-brand-500"
                        {...register('current_medicines')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="allergies" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Allergies
                      </label>
                      <textarea
                        id="allergies"
                        placeholder="e.g. Penicillin, Peanuts"
                        className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm focus:border-brand-500"
                        {...register('allergies')}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 w-full">
                      <label htmlFor="family_history" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Family Medical History
                      </label>
                      <textarea
                        id="family_history"
                        placeholder="e.g. Father has Heart Disease, Mother has Type-2 Diabetes"
                        className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-808 dark:text-white transition-all outline-none text-sm focus:border-brand-500"
                        {...register('family_history')}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="symptoms" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Symptom Log Description *
                    </label>
                    <textarea
                      id="symptoms"
                      placeholder="I have headache, chest pain and dizziness for the last 3 days..."
                      className={`w-full min-h-[100px] px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all outline-none text-sm focus:ring-1 ${
                        errors.symptoms 
                          ? 'border-red-400 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20'
                      }`}
                      {...register('symptoms', { 
                        required: 'Symptom log descriptions are required.' 
                      })}
                    />
                    {errors.symptoms && (
                      <span className="text-xs text-red-500 font-medium">{errors.symptoms.message}</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: OPTIONAL LABORATORY RESULTS & ADVANCED VITALS */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-50 pb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-bold text-slate-800">Step 4: Laboratory Results & Advanced Vitals (Optional)</h3>
                      <p className="text-xs text-slate-400">Skip or leave these fields blank if you do not have them.</p>
                    </div>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                      OPTIONAL SECTION
                    </span>
                  </div>

                  {/* Vitals */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Activity size={14} className="text-teal-600" />
                      1. Advanced Vital Signs
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Input
                        label="Temperature (°F)"
                        placeholder="e.g. 98.6"
                        type="number"
                        step="0.1"
                        id="temperature"
                        {...register('temperature')}
                      />
                      <Input
                        label="SpO2 (%)"
                        placeholder="e.g. 98"
                        type="number"
                        id="spo2"
                        {...register('spo2')}
                      />
                      <Input
                        label="Respiratory (rpm)"
                        placeholder="e.g. 16"
                        type="number"
                        id="respiratory_rate"
                        {...register('respiratory_rate')}
                      />
                      <Input
                        label="Waist Circ. (cm)"
                        placeholder="e.g. 88"
                        type="number"
                        id="waist_circumference"
                        {...register('waist_circumference')}
                      />
                      <Input
                        label="Hip Circ. (cm)"
                        placeholder="e.g. 96"
                        type="number"
                        id="hip_circumference"
                        {...register('hip_circumference')}
                      />
                    </div>
                  </div>

                  {/* Metabolic Panel */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers size={14} className="text-indigo-650" />
                      2. Lipid & Glycemic Panel
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        label="HbA1c (%)"
                        placeholder="e.g. 5.6"
                        type="number"
                        step="0.1"
                        id="hba1c"
                        {...register('hba1c')}
                      />
                      <Input
                        label="LDL Cholesterol (mg/dL)"
                        placeholder="e.g. 100"
                        type="number"
                        id="ldl"
                        {...register('ldl')}
                      />
                      <Input
                        label="HDL Cholesterol (mg/dL)"
                        placeholder="e.g. 50"
                        type="number"
                        id="hdl"
                        {...register('hdl')}
                      />
                      <Input
                        label="Triglycerides (mg/dL)"
                        placeholder="e.g. 150"
                        type="number"
                        id="triglycerides"
                        {...register('triglycerides')}
                      />
                    </div>
                  </div>

                  {/* Kidney, Liver & Blood Panel */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Stethoscope size={14} className="text-indigo-650" />
                      3. Kidney, Liver, & Blood Panels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        label="Serum Creatinine (mg/dL)"
                        placeholder="e.g. 0.9"
                        type="number"
                        step="0.01"
                        id="creatinine"
                        {...register('creatinine')}
                      />
                      <Input
                        label="eGFR (mL/min/1.73m²)"
                        placeholder="e.g. 95"
                        type="number"
                        id="egfr"
                        {...register('egfr')}
                      />
                      <Input
                        label="Liver AST (U/L)"
                        placeholder="e.g. 25"
                        type="number"
                        id="ast"
                        {...register('ast')}
                      />
                      <Input
                        label="Liver ALT (U/L)"
                        placeholder="e.g. 30"
                        type="number"
                        id="alt"
                        {...register('alt')}
                      />
                      <Input
                        label="Uric Acid (mg/dL)"
                        placeholder="e.g. 5.5"
                        type="number"
                        step="0.1"
                        id="uric_acid"
                        {...register('uric_acid')}
                      />
                      <Input
                        label="Hemoglobin (g/dL)"
                        placeholder="e.g. 14.2"
                        type="number"
                        step="0.1"
                        id="hemoglobin"
                        {...register('hemoglobin')}
                      />
                      <Input
                        label="Vitamin D3 (ng/mL)"
                        placeholder="e.g. 32"
                        type="number"
                        id="vitamin_d"
                        {...register('vitamin_d')}
                      />
                      <Input
                        label="Vitamin B12 (pg/mL)"
                        placeholder="e.g. 450"
                        type="number"
                        id="vitamin_b12"
                        {...register('vitamin_b12')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Navigation Buttons */}
            {step > 0 && (
              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-xs font-bold py-2 px-3 rounded-xl border-slate-200"
                  onClick={handlePrev}
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {step < 4 ? (
                    <Button
                      type="button"
                      className="gap-2 bg-teal-650 hover:bg-teal-750 text-xs font-bold py-2 px-4 rounded-xl"
                      onClick={handleNext}
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        className="gap-2 bg-teal-600 hover:bg-teal-700 text-xs font-bold py-2 px-4 rounded-xl shadow-premium"
                        loading={mutation.isPending}
                      >
                        <Sparkles size={16} />
                        Save EMR Assessment
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthAssessmentPage;
