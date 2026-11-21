export interface ClinicalExtraction {
  symptom?: string;
  duration?: string;
  severity?: string;
  allergies?: string[];
  medicalHistory?: string[];
  medications?: string[];
  redFlags?: string[];
  originalExpression?: string;
  clinicalMapping?: string;
  requiresDoctorReview: boolean;
  confidence: 'low' | 'medium' | 'high';
}

const SYMPTOM_KEYWORDS: Record<string, string> = {
  'sar dard': 'Headache',
  'headache': 'Headache',
  'chakkar': 'Dizziness',
  'dizziness': 'Dizziness',
  'bukhar': 'Fever',
  'fever': 'Fever',
  'ukhri': 'Cough',
  'cough': 'Cough',
  'sardi': 'Cold',
  'cold': 'Cold',
  'dard': 'Pain',
  'pain': 'Pain',
  'ultadi': 'Vomiting',
  'vomiting': 'Vomiting',
  'dast': 'Diarrhea',
  'diarrhea': 'Diarrhea',
  'sans lena': 'Shortness of breath',
  'shortness of breath': 'Shortness of breath',
  'chhati me dard': 'Chest pain',
  'chest pain': 'Chest pain',
};

const DURATION_KEYWORDS: Record<string, string> = {
  'kal se': 'Since yesterday',
  'subah se': 'Since this morning',
  'since yesterday': 'Since yesterday',
  'since this morning': 'Since this morning',
  'hours': 'Hours',
  'days': 'Days',
  'weeks': 'Weeks',
  'ghante': 'Hours',
  'din': 'Days',
};

const SEVERITY_KEYWORDS: Record<string, string> = {
  'saat': '7/10',
  'seven': '7/10',
  'teevra': 'Severe',
  'severe': 'Severe',
  'mild': 'Mild',
  'halka': 'Mild',
  'moderate': 'Moderate',
  'madhyam': 'Moderate',
};

const RED_FLAG_KEYWORDS: string[] = [
  'chest pain', 'chhati me dard', 'shortness of breath', 'sans lena',
  'unconscious', 'behoshi', 'severe bleeding', 'teez rakt',
  'stroke', 'paralysis', 'lakwa', 'suicide', 'aatmahatya',
];

const MEDICATION_KEYWORDS: string[] = [
  'paracetamol', 'crocin', 'ibuprofen', 'combiflam',
  'omeprazole', 'ranitidine', 'amlodipine', 'metformin',
];

export function extractClinicalInfo(text: string): ClinicalExtraction {
  const lower = text.toLowerCase();
  const extraction: ClinicalExtraction = {
    requiresDoctorReview: true,
    confidence: 'low',
  };

  // Extract symptom
  let foundSymptom = false;
  for (const [key, value] of Object.entries(SYMPTOM_KEYWORDS)) {
    if (lower.includes(key)) {
      extraction.symptom = value;
      extraction.originalExpression = key;
      extraction.clinicalMapping = `${value} / possible related condition`;
      foundSymptom = true;
      break;
    }
  }
  if (!foundSymptom) {
    extraction.symptom = 'Unspecified symptom';
    extraction.originalExpression = text.slice(0, 50);
    extraction.clinicalMapping = 'Requires clinical correlation';
  }

  // Extract duration
  for (const [key, value] of Object.entries(DURATION_KEYWORDS)) {
    if (lower.includes(key)) {
      extraction.duration = value;
      break;
    }
  }

  // Extract severity
  for (const [key, value] of Object.entries(SEVERITY_KEYWORDS)) {
    if (lower.includes(key)) {
      extraction.severity = value;
      break;
    }
  }

  // Extract red flags
  extraction.redFlags = RED_FLAG_KEYWORDS.filter((k) => lower.includes(k));

  // Extract medications
  extraction.medications = MEDICATION_KEYWORDS.filter((k) => lower.includes(k));

  // Confidence
  if (extraction.symptom && extraction.duration) extraction.confidence = 'medium';
  if (extraction.symptom && extraction.duration && extraction.severity) extraction.confidence = 'high';

  // Red flags require review
  if (extraction.redFlags.length > 0) extraction.requiresDoctorReview = true;

  return extraction;
}

export function formatExtractionForNotes(extraction: ClinicalExtraction): string {
  const lines: string[] = [];
  if (extraction.symptom) lines.push(`Symptom: ${extraction.symptom}`);
  if (extraction.originalExpression) lines.push(`Original expression: "${extraction.originalExpression}"`);
  if (extraction.duration) lines.push(`Duration: ${extraction.duration}`);
  if (extraction.severity) lines.push(`Severity: ${extraction.severity}`);
  if (extraction.clinicalMapping) lines.push(`Clinical mapping: ${extraction.clinicalMapping}`);
  if (extraction.medications?.length) lines.push(`Medications mentioned: ${extraction.medications.join(', ')}`);
  if (extraction.allergies?.length) lines.push(`Allergies: ${extraction.allergies.join(', ')}`);
  if (extraction.redFlags?.length) lines.push(`Red flags: ${extraction.redFlags.join(', ')}`);
  lines.push(`Requires doctor review: ${extraction.requiresDoctorReview ? 'Yes' : 'No'}`);
  lines.push(`Confidence: ${extraction.confidence}`);
  return lines.join('\n');
}
