/**
 * Symptom Factors Data - Mapped to HPO IDs where applicable
 * Clinical assessment modifiers for the symptom checker
 */

export interface SymptomFactor {
	id: string;
	category: SymptomFactorCategory;
	name: string;
	nameRo: string;
	hpoId?: string; // Human Phenotype Ontology ID if available
	description?: string;
}

export type SymptomFactorCategory =
	| "pain_quality"
	| "triggers"
	| "relief"
	| "accompanying"
	| "duration"
	| "severity"
	| "onset"
	| "frequency"
	| "location_modifier";

export interface SymptomFactorCategoryInfo {
	id: SymptomFactorCategory;
	name: string;
	nameRo: string;
	description: string;
	descriptionRo: string;
	allowMultiple: boolean;
	icon: string;
}

export const SYMPTOM_FACTOR_CATEGORIES: SymptomFactorCategoryInfo[] = [
	{
		id: "pain_quality",
		name: "Pain Description",
		nameRo: "Descrierea durerii",
		description: "How would you describe the pain?",
		descriptionRo: "Cum ați descrie durerea?",
		allowMultiple: true,
		icon: "🎯",
	},
	{
		id: "triggers",
		name: "Triggered or worsened by",
		nameRo: "Declanșat sau agravat de",
		description: "What makes the symptoms worse?",
		descriptionRo: "Ce agravează simptomele?",
		allowMultiple: true,
		icon: "⚡",
	},
	{
		id: "relief",
		name: "Relieved by",
		nameRo: "Ameliorat de",
		description: "What helps relieve the symptoms?",
		descriptionRo: "Ce ameliorează simptomele?",
		allowMultiple: true,
		icon: "💊",
	},
	{
		id: "accompanying",
		name: "Accompanied by",
		nameRo: "Însoțit de",
		description: "Other symptoms that occur together",
		descriptionRo: "Alte simptome care apar împreună",
		allowMultiple: true,
		icon: "🔗",
	},
	{
		id: "onset",
		name: "Onset",
		nameRo: "Debut",
		description: "How did the symptoms start?",
		descriptionRo: "Cum au început simptomele?",
		allowMultiple: false,
		icon: "🕐",
	},
	{
		id: "duration",
		name: "Duration",
		nameRo: "Durată",
		description: "How long have you had these symptoms?",
		descriptionRo: "De cât timp aveți aceste simptome?",
		allowMultiple: false,
		icon: "⏱️",
	},
	{
		id: "frequency",
		name: "Frequency",
		nameRo: "Frecvență",
		description: "How often do the symptoms occur?",
		descriptionRo: "Cât de des apar simptomele?",
		allowMultiple: false,
		icon: "🔄",
	},
	{
		id: "severity",
		name: "Severity",
		nameRo: "Severitate",
		description: "How severe are the symptoms (1-10)?",
		descriptionRo: "Cât de severe sunt simptomele (1-10)?",
		allowMultiple: false,
		icon: "📊",
	},
	{
		id: "location_modifier",
		name: "Location Details",
		nameRo: "Detalii localizare",
		description: "Where exactly is the symptom located?",
		descriptionRo: "Unde anume sunt simptomele?",
		allowMultiple: true,
		icon: "📍",
	},
];

export const SYMPTOM_FACTORS: Record<SymptomFactorCategory, SymptomFactor[]> = {
	pain_quality: [
		{
			id: "pq_sharp",
			category: "pain_quality",
			name: "Sharp/Stabbing",
			nameRo: "Ascuțită/Înțepătoare",
			hpoId: "HP:0025279",
		},
		{
			id: "pq_dull",
			category: "pain_quality",
			name: "Dull/Aching",
			nameRo: "Surdă/Dureroasă",
			hpoId: "HP:0025280",
		},
		{
			id: "pq_burning",
			category: "pain_quality",
			name: "Burning",
			nameRo: "Arsură",
			hpoId: "HP:0025278",
		},
		{
			id: "pq_cramping",
			category: "pain_quality",
			name: "Cramping",
			nameRo: "Crampe",
			hpoId: "HP:0003394",
		},
		{
			id: "pq_throbbing",
			category: "pain_quality",
			name: "Throbbing/Pulsating",
			nameRo: "Pulsatilă",
		},
		{
			id: "pq_pressure",
			category: "pain_quality",
			name: "Pressure/Squeezing",
			nameRo: "Presiune/Strângere",
		},
		{
			id: "pq_tearing",
			category: "pain_quality",
			name: "Tearing/Ripping",
			nameRo: "Ruptură/Sfâșiere",
		},
		{
			id: "pq_radiating",
			category: "pain_quality",
			name: "Radiating",
			nameRo: "Iradiază",
			hpoId: "HP:0003470",
		},
		{
			id: "pq_tingling",
			category: "pain_quality",
			name: "Tingling/Pins and needles",
			nameRo: "Furnicături",
			hpoId: "HP:0003401",
		},
		{
			id: "pq_electric",
			category: "pain_quality",
			name: "Electric shock-like",
			nameRo: "Ca un șoc electric",
		},
		{
			id: "pq_heaviness",
			category: "pain_quality",
			name: "Heaviness",
			nameRo: "Greutate",
		},
		{
			id: "pq_tightness",
			category: "pain_quality",
			name: "Tightness",
			nameRo: "Strânsoare",
			hpoId: "HP:0002792",
		},
	],
	triggers: [
		{
			id: "tr_exertion",
			category: "triggers",
			name: "Physical exertion",
			nameRo: "Efort fizic",
			hpoId: "HP:0025276",
		},
		{
			id: "tr_rest",
			category: "triggers",
			name: "Rest/Inactivity",
			nameRo: "Odihnă/Inactivitate",
		},
		{
			id: "tr_eating",
			category: "triggers",
			name: "After eating",
			nameRo: "După masă",
		},
		{
			id: "tr_fasting",
			category: "triggers",
			name: "Empty stomach/Fasting",
			nameRo: "Stomac gol/Post",
		},
		{
			id: "tr_stress",
			category: "triggers",
			name: "Emotional stress",
			nameRo: "Stres emoțional",
		},
		{
			id: "tr_movement",
			category: "triggers",
			name: "Movement/Position change",
			nameRo: "Mișcare/Schimbare poziție",
		},
		{
			id: "tr_breathing",
			category: "triggers",
			name: "Deep breathing",
			nameRo: "Respirație adâncă",
			hpoId: "HP:0002098",
		},
		{
			id: "tr_cough",
			category: "triggers",
			name: "Coughing/Sneezing",
			nameRo: "Tuse/Strănut",
		},
		{
			id: "tr_cold",
			category: "triggers",
			name: "Cold exposure",
			nameRo: "Expunere la frig",
		},
		{
			id: "tr_heat",
			category: "triggers",
			name: "Heat exposure",
			nameRo: "Expunere la căldură",
		},
		{
			id: "tr_touch",
			category: "triggers",
			name: "Touch/Pressure",
			nameRo: "Atingere/Presiune",
		},
		{
			id: "tr_lying",
			category: "triggers",
			name: "Lying down",
			nameRo: "Poziție culcat",
		},
		{
			id: "tr_standing",
			category: "triggers",
			name: "Standing up",
			nameRo: "Ridicare în picioare",
		},
		{
			id: "tr_bending",
			category: "triggers",
			name: "Bending over",
			nameRo: "Aplecarea",
		},
		{
			id: "tr_night",
			category: "triggers",
			name: "Night time",
			nameRo: "Noaptea",
			hpoId: "HP:0025277",
		},
		{
			id: "tr_morning",
			category: "triggers",
			name: "Morning",
			nameRo: "Dimineața",
		},
		{
			id: "tr_alcohol",
			category: "triggers",
			name: "Alcohol consumption",
			nameRo: "Consum alcool",
		},
		{
			id: "tr_caffeine",
			category: "triggers",
			name: "Caffeine",
			nameRo: "Cofeină",
		},
		{
			id: "tr_certain_foods",
			category: "triggers",
			name: "Certain foods",
			nameRo: "Anumite alimente",
		},
		{
			id: "tr_medication",
			category: "triggers",
			name: "After taking medication",
			nameRo: "După medicație",
		},
	],
	relief: [
		{ id: "rl_rest", category: "relief", name: "Rest", nameRo: "Odihnă" },
		{
			id: "rl_movement",
			category: "relief",
			name: "Movement/Activity",
			nameRo: "Mișcare/Activitate",
		},
		{ id: "rl_eating", category: "relief", name: "Eating", nameRo: "Mâncare" },
		{
			id: "rl_fasting",
			category: "relief",
			name: "Not eating",
			nameRo: "Post alimentar",
		},
		{
			id: "rl_antacids",
			category: "relief",
			name: "Antacids",
			nameRo: "Antiacide",
		},
		{
			id: "rl_painkillers",
			category: "relief",
			name: "Pain medication",
			nameRo: "Analgezice",
		},
		{
			id: "rl_nsaids",
			category: "relief",
			name: "Anti-inflammatory drugs",
			nameRo: "Antiinflamatoare",
		},
		{
			id: "rl_heat",
			category: "relief",
			name: "Heat application",
			nameRo: "Aplicare căldură",
		},
		{
			id: "rl_cold",
			category: "relief",
			name: "Cold application",
			nameRo: "Aplicare frig",
		},
		{
			id: "rl_position",
			category: "relief",
			name: "Position change",
			nameRo: "Schimbare poziție",
		},
		{
			id: "rl_sitting",
			category: "relief",
			name: "Sitting down",
			nameRo: "Șezut",
		},
		{
			id: "rl_lying",
			category: "relief",
			name: "Lying down",
			nameRo: "Culcat",
		},
		{
			id: "rl_standing",
			category: "relief",
			name: "Standing",
			nameRo: "În picioare",
		},
		{
			id: "rl_leaning",
			category: "relief",
			name: "Leaning forward",
			nameRo: "Aplecare înainte",
		},
		{ id: "rl_massage", category: "relief", name: "Massage", nameRo: "Masaj" },
		{
			id: "rl_stretching",
			category: "relief",
			name: "Stretching",
			nameRo: "Întinderi",
		},
		{
			id: "rl_nothing",
			category: "relief",
			name: "Nothing helps",
			nameRo: "Nimic nu ajută",
		},
	],
	accompanying: [
		{
			id: "ac_nausea",
			category: "accompanying",
			name: "Nausea",
			nameRo: "Greață",
			hpoId: "HP:0002018",
		},
		{
			id: "ac_vomiting",
			category: "accompanying",
			name: "Vomiting",
			nameRo: "Vărsături",
			hpoId: "HP:0002013",
		},
		{
			id: "ac_sweating",
			category: "accompanying",
			name: "Sweating",
			nameRo: "Transpirație",
			hpoId: "HP:0000975",
		},
		{
			id: "ac_cold_sweats",
			category: "accompanying",
			name: "Cold sweats",
			nameRo: "Transpirații reci",
		},
		{
			id: "ac_fever",
			category: "accompanying",
			name: "Fever",
			nameRo: "Febră",
			hpoId: "HP:0001945",
		},
		{
			id: "ac_chills",
			category: "accompanying",
			name: "Chills",
			nameRo: "Frisoane",
			hpoId: "HP:0025143",
		},
		{
			id: "ac_dizziness",
			category: "accompanying",
			name: "Dizziness",
			nameRo: "Amețeală",
			hpoId: "HP:0002321",
		},
		{
			id: "ac_lightheaded",
			category: "accompanying",
			name: "Lightheadedness",
			nameRo: "Senzație de leșin",
		},
		{
			id: "ac_fainting",
			category: "accompanying",
			name: "Fainting",
			nameRo: "Leșin",
			hpoId: "HP:0001279",
		},
		{
			id: "ac_shortness",
			category: "accompanying",
			name: "Shortness of breath",
			nameRo: "Dificultăți respiratorii",
			hpoId: "HP:0002094",
		},
		{
			id: "ac_palpitations",
			category: "accompanying",
			name: "Palpitations",
			nameRo: "Palpitații",
			hpoId: "HP:0001962",
		},
		{
			id: "ac_fatigue",
			category: "accompanying",
			name: "Fatigue",
			nameRo: "Oboseală",
			hpoId: "HP:0012378",
		},
		{
			id: "ac_weakness",
			category: "accompanying",
			name: "Weakness",
			nameRo: "Slăbiciune",
			hpoId: "HP:0001324",
		},
		{
			id: "ac_headache",
			category: "accompanying",
			name: "Headache",
			nameRo: "Durere de cap",
			hpoId: "HP:0002315",
		},
		{
			id: "ac_blurred",
			category: "accompanying",
			name: "Blurred vision",
			nameRo: "Vedere neclară",
			hpoId: "HP:0000622",
		},
		{
			id: "ac_double_vision",
			category: "accompanying",
			name: "Double vision",
			nameRo: "Vedere dublă",
			hpoId: "HP:0000651",
		},
		{
			id: "ac_numbness",
			category: "accompanying",
			name: "Numbness",
			nameRo: "Amorțeală",
			hpoId: "HP:0003474",
		},
		{
			id: "ac_tingling",
			category: "accompanying",
			name: "Tingling",
			nameRo: "Furnicături",
			hpoId: "HP:0003401",
		},
		{
			id: "ac_anxiety",
			category: "accompanying",
			name: "Anxiety",
			nameRo: "Anxietate",
			hpoId: "HP:0000739",
		},
		{
			id: "ac_confusion",
			category: "accompanying",
			name: "Confusion",
			nameRo: "Confuzie",
			hpoId: "HP:0001289",
		},
		{
			id: "ac_weight_loss",
			category: "accompanying",
			name: "Weight loss",
			nameRo: "Scădere în greutate",
			hpoId: "HP:0001824",
		},
		{
			id: "ac_weight_gain",
			category: "accompanying",
			name: "Weight gain",
			nameRo: "Creștere în greutate",
			hpoId: "HP:0004324",
		},
		{
			id: "ac_appetite_loss",
			category: "accompanying",
			name: "Loss of appetite",
			nameRo: "Lipsa poftei de mâncare",
			hpoId: "HP:0004396",
		},
		{
			id: "ac_increased_appetite",
			category: "accompanying",
			name: "Increased appetite",
			nameRo: "Poftă crescută de mâncare",
			hpoId: "HP:0002591",
		},
		{
			id: "ac_thirst",
			category: "accompanying",
			name: "Excessive thirst",
			nameRo: "Sete excesivă",
			hpoId: "HP:0001959",
		},
		{
			id: "ac_frequent_urination",
			category: "accompanying",
			name: "Frequent urination",
			nameRo: "Urinare frecventă",
			hpoId: "HP:0000012",
		},
		{
			id: "ac_diarrhea",
			category: "accompanying",
			name: "Diarrhea",
			nameRo: "Diaree",
			hpoId: "HP:0002014",
		},
		{
			id: "ac_constipation",
			category: "accompanying",
			name: "Constipation",
			nameRo: "Constipație",
			hpoId: "HP:0002019",
		},
		{
			id: "ac_bloating",
			category: "accompanying",
			name: "Bloating",
			nameRo: "Balonare",
			hpoId: "HP:0003270",
		},
		{
			id: "ac_cough",
			category: "accompanying",
			name: "Cough",
			nameRo: "Tuse",
			hpoId: "HP:0012735",
		},
		{
			id: "ac_wheezing",
			category: "accompanying",
			name: "Wheezing",
			nameRo: "Respirație șuierătoare",
			hpoId: "HP:0001256",
		},
		{
			id: "ac_rash",
			category: "accompanying",
			name: "Skin rash",
			nameRo: "Erupție cutanată",
			hpoId: "HP:0000988",
		},
		{
			id: "ac_itching",
			category: "accompanying",
			name: "Itching",
			nameRo: "Mâncărime",
			hpoId: "HP:0000989",
		},
		{
			id: "ac_swelling",
			category: "accompanying",
			name: "Swelling",
			nameRo: "Umflătură",
			hpoId: "HP:0001004",
		},
		{
			id: "ac_joint_pain",
			category: "accompanying",
			name: "Joint pain",
			nameRo: "Durere articulară",
			hpoId: "HP:0002829",
		},
		{
			id: "ac_muscle_pain",
			category: "accompanying",
			name: "Muscle pain",
			nameRo: "Durere musculară",
			hpoId: "HP:0003326",
		},
		{
			id: "ac_insomnia",
			category: "accompanying",
			name: "Insomnia",
			nameRo: "Insomnie",
			hpoId: "HP:0100785",
		},
	],
	onset: [
		{
			id: "on_sudden",
			category: "onset",
			name: "Sudden onset (seconds)",
			nameRo: "Debut brusc (secunde)",
			hpoId: "HP:0011009",
		},
		{
			id: "on_rapid",
			category: "onset",
			name: "Rapid onset (minutes)",
			nameRo: "Debut rapid (minute)",
		},
		{
			id: "on_gradual",
			category: "onset",
			name: "Gradual onset (hours/days)",
			nameRo: "Debut gradual (ore/zile)",
			hpoId: "HP:0003674",
		},
		{
			id: "on_insidious",
			category: "onset",
			name: "Insidious (weeks/months)",
			nameRo: "Insidios (săptămâni/luni)",
		},
	],
	duration: [
		{
			id: "du_seconds",
			category: "duration",
			name: "Seconds",
			nameRo: "Secunde",
		},
		{
			id: "du_minutes",
			category: "duration",
			name: "Less than 30 minutes",
			nameRo: "Mai puțin de 30 minute",
		},
		{
			id: "du_hours",
			category: "duration",
			name: "30 minutes to a few hours",
			nameRo: "30 minute - câteva ore",
		},
		{
			id: "du_day",
			category: "duration",
			name: "About a day",
			nameRo: "Aproximativ o zi",
		},
		{
			id: "du_days",
			category: "duration",
			name: "Several days (2-6 days)",
			nameRo: "Câteva zile (2-6 zile)",
		},
		{
			id: "du_week",
			category: "duration",
			name: "About a week",
			nameRo: "Aproximativ o săptămână",
		},
		{
			id: "du_weeks",
			category: "duration",
			name: "Several weeks",
			nameRo: "Câteva săptămâni",
		},
		{
			id: "du_month",
			category: "duration",
			name: "About a month",
			nameRo: "Aproximativ o lună",
		},
		{
			id: "du_months",
			category: "duration",
			name: "Several months",
			nameRo: "Câteva luni",
		},
		{ id: "du_years", category: "duration", name: "Years", nameRo: "Ani" },
	],
	frequency: [
		{
			id: "fr_constant",
			category: "frequency",
			name: "Constant/Continuous",
			nameRo: "Constant/Continuu",
		},
		{
			id: "fr_hourly",
			category: "frequency",
			name: "Multiple times per hour",
			nameRo: "De mai multe ori pe oră",
		},
		{
			id: "fr_daily_multiple",
			category: "frequency",
			name: "Multiple times per day",
			nameRo: "De mai multe ori pe zi",
		},
		{
			id: "fr_daily",
			category: "frequency",
			name: "Once daily",
			nameRo: "Odată pe zi",
		},
		{
			id: "fr_weekly_multiple",
			category: "frequency",
			name: "Several times per week",
			nameRo: "De mai multe ori pe săptămână",
		},
		{
			id: "fr_weekly",
			category: "frequency",
			name: "Once a week",
			nameRo: "Odată pe săptămână",
		},
		{
			id: "fr_monthly",
			category: "frequency",
			name: "Once a month",
			nameRo: "Odată pe lună",
		},
		{
			id: "fr_occasional",
			category: "frequency",
			name: "Occasionally/Rarely",
			nameRo: "Ocazional/Rar",
		},
		{
			id: "fr_first_time",
			category: "frequency",
			name: "First time ever",
			nameRo: "Prima dată",
		},
	],
	severity: [
		{
			id: "sv_1",
			category: "severity",
			name: "1 - Barely noticeable",
			nameRo: "1 - Abia perceptibil",
		},
		{
			id: "sv_2",
			category: "severity",
			name: "2 - Very mild",
			nameRo: "2 - Foarte ușor",
		},
		{ id: "sv_3", category: "severity", name: "3 - Mild", nameRo: "3 - Ușor" },
		{
			id: "sv_4",
			category: "severity",
			name: "4 - Mild to moderate",
			nameRo: "4 - Ușor spre moderat",
		},
		{
			id: "sv_5",
			category: "severity",
			name: "5 - Moderate",
			nameRo: "5 - Moderat",
		},
		{
			id: "sv_6",
			category: "severity",
			name: "6 - Moderate to severe",
			nameRo: "6 - Moderat spre sever",
		},
		{
			id: "sv_7",
			category: "severity",
			name: "7 - Severe",
			nameRo: "7 - Sever",
		},
		{
			id: "sv_8",
			category: "severity",
			name: "8 - Very severe",
			nameRo: "8 - Foarte sever",
		},
		{
			id: "sv_9",
			category: "severity",
			name: "9 - Extremely severe",
			nameRo: "9 - Extrem de sever",
		},
		{
			id: "sv_10",
			category: "severity",
			name: "10 - Worst imaginable",
			nameRo: "10 - Cel mai rău posibil",
		},
	],
	location_modifier: [
		{
			id: "lm_left",
			category: "location_modifier",
			name: "Left side",
			nameRo: "Partea stângă",
		},
		{
			id: "lm_right",
			category: "location_modifier",
			name: "Right side",
			nameRo: "Partea dreaptă",
		},
		{
			id: "lm_bilateral",
			category: "location_modifier",
			name: "Both sides",
			nameRo: "Ambele părți",
		},
		{
			id: "lm_center",
			category: "location_modifier",
			name: "Center/Midline",
			nameRo: "Centru/Linie mediană",
		},
		{
			id: "lm_upper",
			category: "location_modifier",
			name: "Upper part",
			nameRo: "Partea superioară",
		},
		{
			id: "lm_lower",
			category: "location_modifier",
			name: "Lower part",
			nameRo: "Partea inferioară",
		},
		{
			id: "lm_front",
			category: "location_modifier",
			name: "Front/Anterior",
			nameRo: "Față/Anterior",
		},
		{
			id: "lm_back",
			category: "location_modifier",
			name: "Back/Posterior",
			nameRo: "Spate/Posterior",
		},
		{
			id: "lm_deep",
			category: "location_modifier",
			name: "Deep inside",
			nameRo: "Adânc în interior",
		},
		{
			id: "lm_superficial",
			category: "location_modifier",
			name: "On the surface",
			nameRo: "La suprafață",
		},
		{
			id: "lm_diffuse",
			category: "location_modifier",
			name: "Diffuse/All over",
			nameRo: "Difuz/Peste tot",
		},
		{
			id: "lm_localized",
			category: "location_modifier",
			name: "Localized/Specific point",
			nameRo: "Localizat/Punct specific",
		},
		{
			id: "lm_moving",
			category: "location_modifier",
			name: "Moving/Changes location",
			nameRo: "Se mișcă/Își schimbă locul",
		},
	],
};

/**
 * Get all factors for a category
 */
export function getFactorsByCategory(
	category: SymptomFactorCategory,
): SymptomFactor[] {
	return SYMPTOM_FACTORS[category] || [];
}

/**
 * Get factor by ID
 */
export function getFactorById(id: string): SymptomFactor | undefined {
	for (const factors of Object.values(SYMPTOM_FACTORS)) {
		const found = factors.find((f) => f.id === id);
		if (found) return found;
	}
	return undefined;
}

/**
 * Get category info by ID
 */
export function getCategoryInfo(
	category: SymptomFactorCategory,
): SymptomFactorCategoryInfo | undefined {
	return SYMPTOM_FACTOR_CATEGORIES.find((c) => c.id === category);
}

/**
 * Search factors by name
 */
export function searchFactors(query: string): SymptomFactor[] {
	const lowerQuery = query.toLowerCase();
	const results: SymptomFactor[] = [];

	for (const factors of Object.values(SYMPTOM_FACTORS)) {
		for (const factor of factors) {
			if (
				factor.name.toLowerCase().includes(lowerQuery) ||
				factor.nameRo.toLowerCase().includes(lowerQuery)
			) {
				results.push(factor);
			}
		}
	}

	return results;
}

/**
 * Get HPO IDs from selected factors
 */
export function getHpoIdsFromFactors(factorIds: string[]): string[] {
	const hpoIds: string[] = [];

	for (const id of factorIds) {
		const factor = getFactorById(id);
		if (factor?.hpoId) {
			hpoIds.push(factor.hpoId);
		}
	}

	return hpoIds;
}

/**
 * Emergency symptoms that should trigger immediate alert
 */
export const EMERGENCY_SYMPTOMS = [
	"Chest pain with shortness of breath",
	"Sudden severe headache",
	"Difficulty speaking or understanding speech",
	"Sudden numbness or weakness on one side",
	"Sudden vision changes",
	"Severe abdominal pain",
	"Coughing or vomiting blood",
	"High fever with stiff neck",
	"Severe allergic reaction",
	"Suicidal thoughts",
];

export const EMERGENCY_SYMPTOMS_RO = [
	"Durere în piept cu dificultăți de respirație",
	"Durere de cap severă bruscă",
	"Dificultate de vorbire sau înțelegere",
	"Amorțeală sau slăbiciune bruscă pe o parte",
	"Modificări bruște ale vederii",
	"Durere abdominală severă",
	"Tuse sau vărsături cu sânge",
	"Febră mare cu gât rigid",
	"Reacție alergică severă",
	"Gânduri suicidare",
];

// ============================================================================
// SYMPTOM-SPECIFIC FACTORS (Mayo Clinic-style)
// Each symptom type has its own set of relevant factors organized by category
// ============================================================================

export interface SymptomSpecificFactor {
	id: string;
	name: string;
	nameRo: string;
	hpoId?: string;
}

export interface SymptomSpecificCategory {
	id: string;
	name: string;
	nameRo: string;
	description: string;
	descriptionRo: string;
	icon: string;
	allowMultiple: boolean;
	factors: SymptomSpecificFactor[];
}

export interface SymptomProfile {
	// Body part UBERON ID or symptom type key
	id: string;
	// Symptom type name
	name: string;
	nameRo: string;
	// Specific categories for this symptom
	categories: SymptomSpecificCategory[];
}

// Headache-specific factors (based on Mayo Clinic)
const HEADACHE_FACTORS: SymptomProfile = {
	id: "headache",
	name: "Headaches",
	nameRo: "Dureri de cap",
	categories: [
		{
			id: "pain_intensity",
			name: "Pain is",
			nameRo: "Durerea este",
			description: "How would you describe the pain intensity?",
			descriptionRo: "Cum ați descrie intensitatea durerii?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{ id: "h_extreme", name: "Extreme", nameRo: "Extremă" },
				{
					id: "h_mild_moderate",
					name: "Mild to moderate",
					nameRo: "Ușoară spre moderată",
				},
				{
					id: "h_moderate_severe",
					name: "Moderate to severe",
					nameRo: "Moderată spre severă",
				},
				{
					id: "h_pressure",
					name: "Pressure or squeezing sensation",
					nameRo: "Senzație de presiune sau strângere",
					hpoId: "HP:0002792",
				},
				{
					id: "h_stabbing",
					name: "Stabbing or burning",
					nameRo: "Înțepătoare sau arsură",
					hpoId: "HP:0025279",
				},
				{
					id: "h_throbbing",
					name: "Throbbing",
					nameRo: "Pulsatilă",
					hpoId: "HP:0025280",
				},
			],
		},
		{
			id: "pain_location",
			name: "Pain located",
			nameRo: "Durerea localizată",
			description: "Where is the pain located?",
			descriptionRo: "Unde este localizată durerea?",
			icon: "📍",
			allowMultiple: true,
			factors: [
				{
					id: "h_loc_one_eye",
					name: "Around one eye or radiates from one eye",
					nameRo: "În jurul unui ochi sau iradiază de la un ochi",
				},
				{
					id: "h_loc_temples",
					name: "Around your temples",
					nameRo: "În jurul tâmplelor",
				},
				{
					id: "h_loc_both_sides",
					name: "On both sides of your head",
					nameRo: "Pe ambele părți ale capului",
				},
				{
					id: "h_loc_one_side",
					name: "On one side of your head",
					nameRo: "Pe o parte a capului",
				},
				{ id: "h_loc_back", name: "Back of head/neck", nameRo: "Ceafa/gât" },
				{ id: "h_loc_forehead", name: "Forehead", nameRo: "Frunte" },
			],
		},
		{
			id: "onset",
			name: "Onset is",
			nameRo: "Debutul este",
			description: "How did the headache start?",
			descriptionRo: "Cum a început durerea de cap?",
			icon: "🕐",
			allowMultiple: false,
			factors: [
				{
					id: "h_onset_gradual",
					name: "Gradual",
					nameRo: "Gradual",
					hpoId: "HP:0003674",
				},
				{
					id: "h_onset_injury",
					name: "Preceded by a head injury or fall",
					nameRo: "Precedat de o lovitură la cap sau cădere",
				},
				{
					id: "h_onset_medication",
					name: "Preceded by frequent use of pain medication",
					nameRo: "Precedat de utilizare frecventă de analgezice",
				},
				{
					id: "h_onset_visual",
					name: "Preceded by visual or other sensory disturbances",
					nameRo: "Precedat de tulburări vizuale sau senzoriale",
				},
				{
					id: "h_onset_sudden",
					name: "Sudden",
					nameRo: "Brusc",
					hpoId: "HP:0011009",
				},
			],
		},
		{
			id: "duration",
			name: "Duration of headache is",
			nameRo: "Durata durerii de cap este",
			description: "How long does the headache last?",
			descriptionRo: "Cât durează durerea de cap?",
			icon: "⏱️",
			allowMultiple: false,
			factors: [
				{
					id: "h_dur_hours_days",
					name: "A few hours to days",
					nameRo: "Câteva ore până la zile",
				},
				{
					id: "h_dur_minutes_hours",
					name: "A few minutes to hours",
					nameRo: "Câteva minute până la ore",
				},
				{
					id: "h_dur_seconds",
					name: "Seconds to minutes",
					nameRo: "Secunde până la minute",
				},
				{
					id: "h_dur_constant",
					name: "Constant/continuous",
					nameRo: "Constantă/continuă",
				},
			],
		},
		{
			id: "recurrence",
			name: "Recurrence of headache",
			nameRo: "Recurența durerii de cap",
			description: "How often does it recur?",
			descriptionRo: "Cât de des revine?",
			icon: "🔄",
			allowMultiple: true,
			factors: [
				{
					id: "h_rec_more_frequent",
					name: "Gradually becomes more frequent",
					nameRo: "Devine treptat mai frecventă",
				},
				{
					id: "h_rec_same_time",
					name: "Is often the same time every day",
					nameRo: "Apare adesea la aceeași oră în fiecare zi",
				},
				{ id: "h_rec_daily", name: "Is daily", nameRo: "Este zilnică" },
				{
					id: "h_rec_weekly",
					name: "Weekly or less",
					nameRo: "Săptămânală sau mai rar",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșată sau agravată de",
			description: "What makes it worse?",
			descriptionRo: "Ce o agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{
					id: "h_tr_sleep",
					name: "Change in sleep patterns",
					nameRo: "Schimbări în tiparele de somn",
				},
				{ id: "h_tr_chewing", name: "Chewing", nameRo: "Mestecat" },
				{
					id: "h_tr_teeth",
					name: "Clenching or grinding teeth",
					nameRo: "Încleștarea sau scrâșnirea dinților",
				},
				{
					id: "h_tr_activities",
					name: "Everyday activities",
					nameRo: "Activități zilnice",
				},
				{
					id: "h_tr_hormonal",
					name: "Hormonal changes",
					nameRo: "Schimbări hormonale",
				},
				{ id: "h_tr_orgasm", name: "Orgasm", nameRo: "Orgasm" },
				{ id: "h_tr_posture", name: "Poor posture", nameRo: "Postură proastă" },
				{ id: "h_tr_stress", name: "Stress", nameRo: "Stres" },
				{ id: "h_tr_alcohol", name: "Alcohol", nameRo: "Alcool" },
				{ id: "h_tr_caffeine", name: "Caffeine", nameRo: "Cofeină" },
				{
					id: "h_tr_bright_light",
					name: "Bright lights",
					nameRo: "Lumini puternice",
				},
				{ id: "h_tr_noise", name: "Loud noises", nameRo: "Zgomote puternice" },
				{ id: "h_tr_foods", name: "Certain foods", nameRo: "Anumite alimente" },
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorată de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{
					id: "h_rl_dark",
					name: "Lying down in the dark",
					nameRo: "Culcat în întuneric",
				},
				{
					id: "h_rl_otc",
					name: "Over-the-counter pain medication",
					nameRo: "Analgezice fără prescripție",
				},
				{ id: "h_rl_rest", name: "Rest", nameRo: "Odihnă" },
				{ id: "h_rl_sleep", name: "Sleep", nameRo: "Somn" },
				{ id: "h_rl_cold", name: "Cold compress", nameRo: "Compresă rece" },
				{
					id: "h_rl_quiet",
					name: "Quiet environment",
					nameRo: "Mediu liniștit",
				},
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțită de",
			description: "Other symptoms that occur together",
			descriptionRo: "Alte simptome care apar împreună",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "h_ac_personality",
					name: "Change in personality, behaviors or mental status",
					nameRo: "Schimbări de personalitate, comportament sau stare mentală",
				},
				{
					id: "h_ac_confusion",
					name: "Confusion",
					nameRo: "Confuzie",
					hpoId: "HP:0001289",
				},
				{
					id: "h_ac_speaking",
					name: "Difficulty speaking",
					nameRo: "Dificultate de vorbire",
				},
				{
					id: "h_ac_dizziness",
					name: "Dizziness",
					nameRo: "Amețeală",
					hpoId: "HP:0002321",
				},
				{
					id: "h_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{ id: "h_ac_jaw_pain", name: "Jaw pain", nameRo: "Durere de maxilar" },
				{
					id: "h_ac_memory",
					name: "Memory loss or forgetfulness",
					nameRo: "Pierderea memoriei sau uitare",
				},
				{
					id: "h_ac_muscle_joint",
					name: "Muscle or joint aches",
					nameRo: "Dureri musculare sau articulare",
				},
				{
					id: "h_ac_nausea",
					name: "Nausea or vomiting",
					nameRo: "Greață sau vărsături",
					hpoId: "HP:0002018",
				},
				{
					id: "h_ac_weakness",
					name: "Persistent weakness or numbness",
					nameRo: "Slăbiciune sau amorțeală persistentă",
					hpoId: "HP:0001324",
				},
				{
					id: "h_ac_restless",
					name: "Restlessness or agitation",
					nameRo: "Neliniște sau agitație",
				},
				{
					id: "h_ac_runny_nose",
					name: "Runny or stuffy nose",
					nameRo: "Nas care curge sau înfundat",
				},
				{
					id: "h_ac_seizures",
					name: "Seizures",
					nameRo: "Convulsii",
					hpoId: "HP:0001250",
				},
				{
					id: "h_ac_light_noise",
					name: "Sensitivity to light or noise",
					nameRo: "Sensibilitate la lumină sau zgomot",
					hpoId: "HP:0000613",
				},
				{ id: "h_ac_stiff_neck", name: "Stiff neck", nameRo: "Gât rigid" },
				{
					id: "h_ac_tender_scalp",
					name: "Tender scalp",
					nameRo: "Scalp sensibil",
				},
				{
					id: "h_ac_vision",
					name: "Vision problems",
					nameRo: "Probleme de vedere",
					hpoId: "HP:0000622",
				},
				{
					id: "h_ac_eye_watering",
					name: "Eye watering or redness",
					nameRo: "Lăcrimare sau înroșire a ochilor",
				},
			],
		},
	],
};

// Abdominal pain-specific factors (based on Mayo Clinic)
const ABDOMINAL_PAIN_FACTORS: SymptomProfile = {
	id: "abdominal",
	name: "Abdominal pain",
	nameRo: "Durere abdominală",
	categories: [
		{
			id: "pain_quality",
			name: "Pain is",
			nameRo: "Durerea este",
			description: "How would you describe the pain?",
			descriptionRo: "Cum ați descrie durerea?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{
					id: "a_burning",
					name: "Burning",
					nameRo: "Arsură",
					hpoId: "HP:0025278",
				},
				{
					id: "a_crampy",
					name: "Crampy",
					nameRo: "Crampe",
					hpoId: "HP:0003394",
				},
				{ id: "a_dull", name: "Dull", nameRo: "Surdă" },
				{ id: "a_gnawing", name: "Gnawing", nameRo: "Rozătoare" },
				{ id: "a_intense", name: "Intense", nameRo: "Intensă" },
				{
					id: "a_intermittent",
					name: "Intermittent or episodic",
					nameRo: "Intermitentă sau episodică",
				},
				{
					id: "a_ongoing",
					name: "Ongoing (chronic)",
					nameRo: "Continuă (cronică)",
				},
				{
					id: "a_sharp",
					name: "Sharp",
					nameRo: "Ascuțită",
					hpoId: "HP:0025279",
				},
				{ id: "a_steady", name: "Steady", nameRo: "Constantă" },
				{
					id: "a_sudden",
					name: "Sudden (acute)",
					nameRo: "Bruscă (acută)",
					hpoId: "HP:0011009",
				},
				{
					id: "a_worsening",
					name: "Worsening or progressing",
					nameRo: "Se agravează sau progresează",
				},
			],
		},
		{
			id: "pain_location",
			name: "Pain located in",
			nameRo: "Durerea localizată în",
			description: "Where is the pain located?",
			descriptionRo: "Unde este localizată durerea?",
			icon: "📍",
			allowMultiple: true,
			factors: [
				{
					id: "a_loc_radiates",
					name: "Abdomen but radiates to other parts of the body",
					nameRo: "Abdomen dar iradiază în alte părți ale corpului",
				},
				{
					id: "a_loc_lower",
					name: "Lower abdomen",
					nameRo: "Abdomenul inferior",
				},
				{
					id: "a_loc_middle",
					name: "Middle abdomen",
					nameRo: "Abdomenul mijlociu",
				},
				{
					id: "a_loc_upper",
					name: "Upper abdomen",
					nameRo: "Abdomenul superior",
				},
				{ id: "a_loc_one_side", name: "One side", nameRo: "O singură parte" },
				{
					id: "a_loc_both_sides",
					name: "One or both sides",
					nameRo: "Una sau ambele părți",
				},
				{
					id: "a_loc_around_navel",
					name: "Around the navel",
					nameRo: "În jurul buricului",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșată sau agravată de",
			description: "What makes it worse?",
			descriptionRo: "Ce o agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{
					id: "a_tr_coughing",
					name: "Coughing or other jarring movements",
					nameRo: "Tuse sau alte mișcări bruște",
				},
				{
					id: "a_tr_alcohol",
					name: "Drinking alcohol",
					nameRo: "Consum de alcool",
				},
				{
					id: "a_tr_foods",
					name: "Eating certain foods",
					nameRo: "Consumul anumitor alimente",
				},
				{
					id: "a_tr_eating",
					name: "Eating in general",
					nameRo: "Mâncatul în general",
				},
				{
					id: "a_tr_menstrual",
					name: "Menstrual cycle",
					nameRo: "Ciclul menstrual",
				},
				{ id: "a_tr_stress", name: "Stress", nameRo: "Stres" },
				{
					id: "a_tr_fatty",
					name: "Fatty or greasy foods",
					nameRo: "Alimente grase",
				},
				{ id: "a_tr_spicy", name: "Spicy foods", nameRo: "Alimente picante" },
				{ id: "a_tr_dairy", name: "Dairy products", nameRo: "Produse lactate" },
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorată de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{ id: "a_rl_antacids", name: "Antacids", nameRo: "Antiacide" },
				{
					id: "a_rl_avoid_foods",
					name: "Avoiding certain foods",
					nameRo: "Evitarea anumitor alimente",
				},
				{
					id: "a_rl_position",
					name: "Changing position",
					nameRo: "Schimbarea poziției",
				},
				{
					id: "a_rl_water",
					name: "Drinking more water",
					nameRo: "Consumul de mai multă apă",
				},
				{
					id: "a_rl_eat_certain",
					name: "Eating certain foods",
					nameRo: "Consumul anumitor alimente",
				},
				{
					id: "a_rl_fiber",
					name: "Eating more fiber",
					nameRo: "Consumul de mai multe fibre",
				},
				{
					id: "a_rl_bowel",
					name: "Having a bowel movement",
					nameRo: "După scaun",
				},
				{
					id: "a_rl_heat",
					name: "Heat application",
					nameRo: "Aplicarea căldurii",
				},
				{ id: "a_rl_rest", name: "Rest", nameRo: "Odihnă" },
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțită de",
			description: "Other symptoms that occur together",
			descriptionRo: "Alte simptome care apar împreună",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "a_ac_swelling",
					name: "Abdominal swelling",
					nameRo: "Umflare abdominală",
					hpoId: "HP:0003270",
				},
				{
					id: "a_ac_bloody_stool",
					name: "Black or bloody stools",
					nameRo: "Scaune negre sau cu sânge",
				},
				{
					id: "a_ac_constipation",
					name: "Constipation",
					nameRo: "Constipație",
					hpoId: "HP:0002019",
				},
				{
					id: "a_ac_diarrhea",
					name: "Diarrhea",
					nameRo: "Diaree",
					hpoId: "HP:0002014",
				},
				{
					id: "a_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{
					id: "a_ac_bowel_urge",
					name: "Inability to move bowels in spite of urge",
					nameRo: "Incapacitatea de a avea scaun în ciuda nevoii",
				},
				{
					id: "a_ac_loose_stool",
					name: "Loose, watery stools",
					nameRo: "Scaune moi, apoase",
				},
				{
					id: "a_ac_nausea",
					name: "Nausea or vomiting",
					nameRo: "Greață sau vărsături",
					hpoId: "HP:0002018",
				},
				{ id: "a_ac_gas", name: "Passing gas", nameRo: "Flatulență" },
				{
					id: "a_ac_pulsing",
					name: "Pulsing sensation near the navel",
					nameRo: "Senzație pulsatilă lângă buric",
				},
				{
					id: "a_ac_rash",
					name: "Rash",
					nameRo: "Erupție cutanată",
					hpoId: "HP:0000988",
				},
				{
					id: "a_ac_rumbling",
					name: "Stomach growling or rumbling",
					nameRo: "Zgomote stomacale",
				},
				{
					id: "a_ac_weight_loss",
					name: "Unintended weight loss",
					nameRo: "Scădere neintenționată în greutate",
					hpoId: "HP:0001824",
				},
				{
					id: "a_ac_bowel_urgent",
					name: "Urgent need to have a bowel movement",
					nameRo: "Nevoia urgentă de a avea scaun",
				},
				{
					id: "a_ac_blood_urine",
					name: "Blood in urine",
					nameRo: "Sânge în urină",
					hpoId: "HP:0000790",
				},
				{
					id: "a_ac_jaundice",
					name: "Yellowing of skin (jaundice)",
					nameRo: "Îngălbenirea pielii (icter)",
					hpoId: "HP:0000952",
				},
			],
		},
	],
};

// Chest pain-specific factors
const CHEST_PAIN_FACTORS: SymptomProfile = {
	id: "chest",
	name: "Chest pain",
	nameRo: "Durere în piept",
	categories: [
		{
			id: "pain_quality",
			name: "Pain is",
			nameRo: "Durerea este",
			description: "How would you describe the pain?",
			descriptionRo: "Cum ați descrie durerea?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{
					id: "c_sharp",
					name: "Sharp or stabbing",
					nameRo: "Ascuțită sau înțepătoare",
					hpoId: "HP:0025279",
				},
				{ id: "c_dull", name: "Dull or aching", nameRo: "Surdă sau dureroasă" },
				{
					id: "c_pressure",
					name: "Pressure or squeezing",
					nameRo: "Presiune sau strângere",
					hpoId: "HP:0002792",
				},
				{
					id: "c_burning",
					name: "Burning",
					nameRo: "Arsură",
					hpoId: "HP:0025278",
				},
				{ id: "c_tightness", name: "Tightness", nameRo: "Strânsoare" },
				{ id: "c_crushing", name: "Crushing", nameRo: "Zdrobitoare" },
				{
					id: "c_radiating",
					name: "Radiating to arm, neck, jaw or back",
					nameRo: "Iradiază în braț, gât, maxilar sau spate",
					hpoId: "HP:0003470",
				},
			],
		},
		{
			id: "pain_location",
			name: "Pain located",
			nameRo: "Durerea localizată",
			description: "Where is the pain located?",
			descriptionRo: "Unde este localizată durerea?",
			icon: "📍",
			allowMultiple: true,
			factors: [
				{
					id: "c_loc_center",
					name: "Center of chest",
					nameRo: "Centrul pieptului",
				},
				{
					id: "c_loc_left",
					name: "Left side of chest",
					nameRo: "Partea stângă a pieptului",
				},
				{
					id: "c_loc_right",
					name: "Right side of chest",
					nameRo: "Partea dreaptă a pieptului",
				},
				{ id: "c_loc_upper", name: "Upper chest", nameRo: "Pieptul superior" },
				{
					id: "c_loc_sternum",
					name: "Behind the breastbone",
					nameRo: "În spatele sternului",
				},
				{
					id: "c_loc_ribs",
					name: "Along the ribs",
					nameRo: "De-a lungul coastelor",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșată sau agravată de",
			description: "What makes it worse?",
			descriptionRo: "Ce o agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{
					id: "c_tr_exertion",
					name: "Physical exertion",
					nameRo: "Efort fizic",
					hpoId: "HP:0025276",
				},
				{
					id: "c_tr_breathing",
					name: "Deep breathing",
					nameRo: "Respirație adâncă",
				},
				{ id: "c_tr_coughing", name: "Coughing", nameRo: "Tuse" },
				{ id: "c_tr_eating", name: "Eating", nameRo: "Mâncare" },
				{ id: "c_tr_lying", name: "Lying down", nameRo: "Culcat" },
				{
					id: "c_tr_stress",
					name: "Emotional stress",
					nameRo: "Stres emoțional",
				},
				{ id: "c_tr_cold", name: "Cold weather", nameRo: "Vreme rece" },
				{
					id: "c_tr_pressing",
					name: "Pressing on chest",
					nameRo: "Apăsare pe piept",
				},
				{
					id: "c_tr_movement",
					name: "Arm or body movement",
					nameRo: "Mișcarea brațului sau corpului",
				},
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorată de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{ id: "c_rl_rest", name: "Rest", nameRo: "Odihnă" },
				{
					id: "c_rl_nitroglycerin",
					name: "Nitroglycerin",
					nameRo: "Nitroglicerină",
				},
				{ id: "c_rl_antacids", name: "Antacids", nameRo: "Antiacide" },
				{
					id: "c_rl_sitting",
					name: "Sitting up or leaning forward",
					nameRo: "Stat în șezut sau aplecare înainte",
				},
				{
					id: "c_rl_painkillers",
					name: "Pain medication",
					nameRo: "Analgezice",
				},
				{
					id: "c_rl_position",
					name: "Changing position",
					nameRo: "Schimbarea poziției",
				},
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțită de",
			description: "Other symptoms that occur together",
			descriptionRo: "Alte simptome care apar împreună",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "c_ac_shortness",
					name: "Shortness of breath",
					nameRo: "Dificultăți de respirație",
					hpoId: "HP:0002094",
				},
				{
					id: "c_ac_sweating",
					name: "Sweating",
					nameRo: "Transpirație",
					hpoId: "HP:0000975",
				},
				{
					id: "c_ac_nausea",
					name: "Nausea or vomiting",
					nameRo: "Greață sau vărsături",
					hpoId: "HP:0002018",
				},
				{
					id: "c_ac_dizziness",
					name: "Dizziness or lightheadedness",
					nameRo: "Amețeală",
					hpoId: "HP:0002321",
				},
				{
					id: "c_ac_palpitations",
					name: "Palpitations or irregular heartbeat",
					nameRo: "Palpitații sau bătăi neregulate ale inimii",
					hpoId: "HP:0001962",
				},
				{
					id: "c_ac_fatigue",
					name: "Fatigue",
					nameRo: "Oboseală",
					hpoId: "HP:0012378",
				},
				{
					id: "c_ac_anxiety",
					name: "Anxiety or sense of doom",
					nameRo: "Anxietate sau senzație de pericol iminent",
					hpoId: "HP:0000739",
				},
				{
					id: "c_ac_cough",
					name: "Cough",
					nameRo: "Tuse",
					hpoId: "HP:0012735",
				},
				{
					id: "c_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{
					id: "c_ac_arm_numbness",
					name: "Numbness in arm or hand",
					nameRo: "Amorțeală în braț sau mână",
					hpoId: "HP:0003474",
				},
				{ id: "c_ac_heartburn", name: "Heartburn", nameRo: "Arsuri la stomac" },
			],
		},
		{
			id: "duration",
			name: "Duration",
			nameRo: "Durată",
			description: "How long does the pain last?",
			descriptionRo: "Cât durează durerea?",
			icon: "⏱️",
			allowMultiple: false,
			factors: [
				{
					id: "c_dur_seconds",
					name: "A few seconds",
					nameRo: "Câteva secunde",
				},
				{ id: "c_dur_minutes", name: "A few minutes", nameRo: "Câteva minute" },
				{
					id: "c_dur_30min",
					name: "More than 30 minutes",
					nameRo: "Mai mult de 30 de minute",
				},
				{ id: "c_dur_hours", name: "Hours", nameRo: "Ore" },
				{ id: "c_dur_constant", name: "Constant", nameRo: "Constantă" },
			],
		},
	],
};

// Back pain-specific factors
const BACK_PAIN_FACTORS: SymptomProfile = {
	id: "back",
	name: "Back pain",
	nameRo: "Durere de spate",
	categories: [
		{
			id: "pain_quality",
			name: "Pain is",
			nameRo: "Durerea este",
			description: "How would you describe the pain?",
			descriptionRo: "Cum ați descrie durerea?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{
					id: "b_aching",
					name: "Aching or stiff",
					nameRo: "Dureroasă sau rigidă",
				},
				{
					id: "b_sharp",
					name: "Sharp or stabbing",
					nameRo: "Ascuțită sau înțepătoare",
					hpoId: "HP:0025279",
				},
				{
					id: "b_burning",
					name: "Burning",
					nameRo: "Arsură",
					hpoId: "HP:0025278",
				},
				{
					id: "b_shooting",
					name: "Shooting down the leg",
					nameRo: "Se propagă în picior",
				},
				{ id: "b_throbbing", name: "Throbbing", nameRo: "Pulsatilă" },
				{ id: "b_constant", name: "Constant", nameRo: "Constantă" },
				{
					id: "b_comes_goes",
					name: "Comes and goes",
					nameRo: "Vine și pleacă",
				},
			],
		},
		{
			id: "pain_location",
			name: "Pain located in",
			nameRo: "Durerea localizată în",
			description: "Where is the pain located?",
			descriptionRo: "Unde este localizată durerea?",
			icon: "📍",
			allowMultiple: true,
			factors: [
				{
					id: "b_loc_upper",
					name: "Upper back",
					nameRo: "Partea superioară a spatelui",
				},
				{
					id: "b_loc_middle",
					name: "Middle back",
					nameRo: "Mijlocul spatelui",
				},
				{
					id: "b_loc_lower",
					name: "Lower back",
					nameRo: "Partea inferioară a spatelui",
				},
				{ id: "b_loc_left", name: "Left side", nameRo: "Partea stângă" },
				{ id: "b_loc_right", name: "Right side", nameRo: "Partea dreaptă" },
				{
					id: "b_loc_buttocks",
					name: "Radiating to buttocks",
					nameRo: "Iradiază în fese",
				},
				{
					id: "b_loc_leg",
					name: "Radiating down leg",
					nameRo: "Iradiază în picior",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșată sau agravată de",
			description: "What makes it worse?",
			descriptionRo: "Ce o agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{
					id: "b_tr_sitting",
					name: "Prolonged sitting",
					nameRo: "Stat prelungit",
				},
				{
					id: "b_tr_standing",
					name: "Prolonged standing",
					nameRo: "Stat în picioare prelungit",
				},
				{ id: "b_tr_bending", name: "Bending over", nameRo: "Aplecarea" },
				{
					id: "b_tr_lifting",
					name: "Lifting heavy objects",
					nameRo: "Ridicarea greutăților",
				},
				{ id: "b_tr_twisting", name: "Twisting", nameRo: "Răsucirea" },
				{
					id: "b_tr_coughing",
					name: "Coughing or sneezing",
					nameRo: "Tuse sau strănut",
				},
				{ id: "b_tr_walking", name: "Walking", nameRo: "Mersul pe jos" },
				{
					id: "b_tr_morning",
					name: "Morning (after waking)",
					nameRo: "Dimineața (după trezire)",
				},
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorată de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{ id: "b_rl_rest", name: "Rest", nameRo: "Odihnă" },
				{
					id: "b_rl_movement",
					name: "Gentle movement",
					nameRo: "Mișcare ușoară",
				},
				{ id: "b_rl_stretching", name: "Stretching", nameRo: "Întinderi" },
				{
					id: "b_rl_heat",
					name: "Heat application",
					nameRo: "Aplicarea căldurii",
				},
				{
					id: "b_rl_cold",
					name: "Ice/cold application",
					nameRo: "Aplicarea gheții/frigului",
				},
				{
					id: "b_rl_position",
					name: "Changing position",
					nameRo: "Schimbarea poziției",
				},
				{
					id: "b_rl_painkillers",
					name: "Pain medication",
					nameRo: "Analgezice",
				},
				{ id: "b_rl_lying", name: "Lying down", nameRo: "Culcat" },
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțită de",
			description: "Other symptoms that occur together",
			descriptionRo: "Alte simptome care apar împreună",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "b_ac_numbness",
					name: "Numbness or tingling in legs",
					nameRo: "Amorțeală sau furnicături în picioare",
					hpoId: "HP:0003474",
				},
				{
					id: "b_ac_weakness",
					name: "Leg weakness",
					nameRo: "Slăbiciune în picioare",
					hpoId: "HP:0001324",
				},
				{
					id: "b_ac_bladder",
					name: "Bladder or bowel problems",
					nameRo: "Probleme vezicale sau intestinale",
				},
				{
					id: "b_ac_stiffness",
					name: "Morning stiffness",
					nameRo: "Rigiditate matinală",
				},
				{
					id: "b_ac_muscle_spasm",
					name: "Muscle spasms",
					nameRo: "Spasme musculare",
				},
				{
					id: "b_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{
					id: "b_ac_weight_loss",
					name: "Unexplained weight loss",
					nameRo: "Scădere inexplicabilă în greutate",
					hpoId: "HP:0001824",
				},
			],
		},
	],
};

// Joint/Musculoskeletal pain factors
const JOINT_PAIN_FACTORS: SymptomProfile = {
	id: "joint",
	name: "Joint pain",
	nameRo: "Durere articulară",
	categories: [
		{
			id: "pain_quality",
			name: "Pain is",
			nameRo: "Durerea este",
			description: "How would you describe the pain?",
			descriptionRo: "Cum ați descrie durerea?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{ id: "j_aching", name: "Aching", nameRo: "Dureroasă" },
				{
					id: "j_sharp",
					name: "Sharp",
					nameRo: "Ascuțită",
					hpoId: "HP:0025279",
				},
				{ id: "j_stiff", name: "Stiff", nameRo: "Rigidă" },
				{ id: "j_throbbing", name: "Throbbing", nameRo: "Pulsatilă" },
				{
					id: "j_burning",
					name: "Burning",
					nameRo: "Arsură",
					hpoId: "HP:0025278",
				},
				{
					id: "j_grinding",
					name: "Grinding sensation",
					nameRo: "Senzație de scrâșnet",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșată sau agravată de",
			description: "What makes it worse?",
			descriptionRo: "Ce o agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{ id: "j_tr_movement", name: "Movement", nameRo: "Mișcare" },
				{
					id: "j_tr_rest",
					name: "After rest/inactivity",
					nameRo: "După odihnă/inactivitate",
				},
				{
					id: "j_tr_weight",
					name: "Weight bearing",
					nameRo: "Susținerea greutății",
				},
				{ id: "j_tr_cold", name: "Cold weather", nameRo: "Vreme rece" },
				{ id: "j_tr_damp", name: "Damp weather", nameRo: "Vreme umedă" },
				{ id: "j_tr_morning", name: "Morning", nameRo: "Dimineața" },
				{
					id: "j_tr_overuse",
					name: "Overuse/repetitive motion",
					nameRo: "Suprasolicitare/mișcări repetitive",
				},
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorată de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{ id: "j_rl_rest", name: "Rest", nameRo: "Odihnă" },
				{
					id: "j_rl_movement",
					name: "Gentle movement",
					nameRo: "Mișcare ușoară",
				},
				{ id: "j_rl_heat", name: "Heat", nameRo: "Căldură" },
				{ id: "j_rl_cold", name: "Ice/Cold", nameRo: "Gheață/Frig" },
				{
					id: "j_rl_nsaids",
					name: "Anti-inflammatory medication",
					nameRo: "Antiinflamatoare",
				},
				{ id: "j_rl_elevation", name: "Elevation", nameRo: "Elevare" },
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțită de",
			description: "Other symptoms that occur together",
			descriptionRo: "Alte simptome care apar împreună",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "j_ac_swelling",
					name: "Swelling",
					nameRo: "Umflătură",
					hpoId: "HP:0001004",
				},
				{ id: "j_ac_redness", name: "Redness", nameRo: "Roșeață" },
				{
					id: "j_ac_warmth",
					name: "Warmth over joint",
					nameRo: "Căldură peste articulație",
				},
				{ id: "j_ac_stiffness", name: "Stiffness", nameRo: "Rigiditate" },
				{
					id: "j_ac_limited",
					name: "Limited range of motion",
					nameRo: "Mobilitate limitată",
				},
				{
					id: "j_ac_clicking",
					name: "Clicking or popping",
					nameRo: "Pocnituri sau trosnituri",
				},
				{
					id: "j_ac_weakness",
					name: "Weakness",
					nameRo: "Slăbiciune",
					hpoId: "HP:0001324",
				},
				{
					id: "j_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{
					id: "j_ac_fatigue",
					name: "Fatigue",
					nameRo: "Oboseală",
					hpoId: "HP:0012378",
				},
			],
		},
	],
};

// Generic/Default pain factors (fallback)
const GENERIC_PAIN_FACTORS: SymptomProfile = {
	id: "generic",
	name: "General symptoms",
	nameRo: "Simptome generale",
	categories: [
		{
			id: "pain_quality",
			name: "Symptom is",
			nameRo: "Simptomul este",
			description: "How would you describe it?",
			descriptionRo: "Cum l-ați descrie?",
			icon: "🎯",
			allowMultiple: true,
			factors: [
				{ id: "g_mild", name: "Mild", nameRo: "Ușor" },
				{ id: "g_moderate", name: "Moderate", nameRo: "Moderat" },
				{ id: "g_severe", name: "Severe", nameRo: "Sever" },
				{ id: "g_constant", name: "Constant", nameRo: "Constant" },
				{
					id: "g_intermittent",
					name: "Comes and goes",
					nameRo: "Vine și pleacă",
				},
				{ id: "g_worsening", name: "Getting worse", nameRo: "Se agravează" },
			],
		},
		{
			id: "onset",
			name: "Started",
			nameRo: "A început",
			description: "When did it start?",
			descriptionRo: "Când a început?",
			icon: "🕐",
			allowMultiple: false,
			factors: [
				{
					id: "g_onset_sudden",
					name: "Suddenly",
					nameRo: "Brusc",
					hpoId: "HP:0011009",
				},
				{
					id: "g_onset_gradual",
					name: "Gradually",
					nameRo: "Treptat",
					hpoId: "HP:0003674",
				},
				{
					id: "g_onset_after_event",
					name: "After a specific event",
					nameRo: "După un eveniment specific",
				},
			],
		},
		{
			id: "triggers",
			name: "Triggered or worsened by",
			nameRo: "Declanșat sau agravat de",
			description: "What makes it worse?",
			descriptionRo: "Ce îl agravează?",
			icon: "⚡",
			allowMultiple: true,
			factors: [
				{
					id: "g_tr_activity",
					name: "Physical activity",
					nameRo: "Activitate fizică",
				},
				{ id: "g_tr_rest", name: "Rest", nameRo: "Odihnă" },
				{ id: "g_tr_stress", name: "Stress", nameRo: "Stres" },
				{ id: "g_tr_eating", name: "Eating", nameRo: "Mâncare" },
				{
					id: "g_tr_time",
					name: "Certain time of day",
					nameRo: "Anumite momente ale zilei",
				},
			],
		},
		{
			id: "relief",
			name: "Relieved by",
			nameRo: "Ameliorat de",
			description: "What helps?",
			descriptionRo: "Ce ajută?",
			icon: "💊",
			allowMultiple: true,
			factors: [
				{ id: "g_rl_rest", name: "Rest", nameRo: "Odihnă" },
				{ id: "g_rl_medication", name: "Medication", nameRo: "Medicație" },
				{ id: "g_rl_nothing", name: "Nothing helps", nameRo: "Nimic nu ajută" },
			],
		},
		{
			id: "accompanying",
			name: "Accompanied by",
			nameRo: "Însoțit de",
			description: "Other symptoms",
			descriptionRo: "Alte simptome",
			icon: "🔗",
			allowMultiple: true,
			factors: [
				{
					id: "g_ac_fever",
					name: "Fever",
					nameRo: "Febră",
					hpoId: "HP:0001945",
				},
				{
					id: "g_ac_fatigue",
					name: "Fatigue",
					nameRo: "Oboseală",
					hpoId: "HP:0012378",
				},
				{
					id: "g_ac_nausea",
					name: "Nausea",
					nameRo: "Greață",
					hpoId: "HP:0002018",
				},
				{
					id: "g_ac_appetite",
					name: "Loss of appetite",
					nameRo: "Lipsa poftei de mâncare",
					hpoId: "HP:0004396",
				},
				{
					id: "g_ac_weight",
					name: "Weight changes",
					nameRo: "Modificări ale greutății",
				},
			],
		},
	],
};

// All symptom profiles
export const SYMPTOM_PROFILES: SymptomProfile[] = [
	HEADACHE_FACTORS,
	ABDOMINAL_PAIN_FACTORS,
	CHEST_PAIN_FACTORS,
	BACK_PAIN_FACTORS,
	JOINT_PAIN_FACTORS,
	GENERIC_PAIN_FACTORS,
];

// Body part to symptom profile mapping
const BODY_PART_TO_PROFILE: Record<string, string> = {
	// Head and brain
	"UBERON:0000033": "headache", // Head
	"UBERON:0000955": "headache", // Brain
	// Chest, heart, and respiratory
	"UBERON:0000310": "chest", // Chest
	"UBERON:0000948": "chest", // Heart
	"UBERON:0002048": "chest", // Lung
	"UBERON:0002185": "chest", // Bronchus
	"UBERON:0002082": "chest", // Thoracic cavity
	"UBERON:0002407": "chest", // Pericardium
	"UBERON:0000947": "chest", // Aorta
	// Abdomen and GI
	"UBERON:0000002": "abdominal", // Abdomen
	"UBERON:0000945": "abdominal", // Stomach
	"UBERON:0002107": "abdominal", // Liver
	"UBERON:0002113": "abdominal", // Kidney
	"UBERON:0000160": "abdominal", // Intestine
	"UBERON:0002116": "abdominal", // Small intestine
	"UBERON:0001155": "abdominal", // Colon
	"UBERON:0001052": "abdominal", // Rectum
	"UBERON:0001264": "abdominal", // Pancreas
	"UBERON:0002110": "abdominal", // Gallbladder
	"UBERON:0001043": "abdominal", // Esophagus
	// Back and spine
	"UBERON:0001137": "back", // Spine
	"UBERON:0000009": "back", // Back
	"UBERON:0000976": "back", // Neck (cervical)
	// Musculoskeletal / Joint areas
	"UBERON:0001630": "joint", // Muscle
	"UBERON:0000982": "joint", // Joint
	"UBERON:0001465": "joint", // Knee
	"UBERON:0001461": "joint", // Elbow
	"UBERON:0001467": "joint", // Shoulder
	"UBERON:0000376": "joint", // Hip
	"UBERON:0001488": "joint", // Ankle
	"UBERON:0004458": "joint", // Wrist
	"UBERON:0001460": "joint", // Arm
	"UBERON:0000978": "joint", // Leg
	"UBERON:0002398": "joint", // Hand
	"UBERON:0002387": "joint", // Foot
	"UBERON:0002378": "joint", // Finger
	"UBERON:0001466": "joint", // Toe
	"UBERON:0001474": "joint", // Bone
	"UBERON:0002355": "joint", // Pelvis
};

/**
 * Get the symptom profile for a given body part
 */
export function getSymptomProfileForBodyPart(uberonId: string): SymptomProfile {
	const profileId = BODY_PART_TO_PROFILE[uberonId];
	if (profileId) {
		const profile = SYMPTOM_PROFILES.find((p) => p.id === profileId);
		if (profile) return profile;
	}
	// Return generic if no specific mapping
	return GENERIC_PAIN_FACTORS;
}

/**
 * Get merged symptom profiles for multiple body parts
 * Returns unique categories with combined factors
 */
export function getMergedSymptomProfiles(uberonIds: string[]): SymptomProfile {
	if (uberonIds.length === 0) {
		return GENERIC_PAIN_FACTORS;
	}

	// Get all relevant profiles
	const profiles = uberonIds.map((id) => getSymptomProfileForBodyPart(id));

	// If all profiles are the same, return that profile
	const uniqueProfileIds = [...new Set(profiles.map((p) => p.id))];
	if (uniqueProfileIds.length === 1) {
		return profiles[0];
	}

	// Merge profiles - combine categories and factors
	const mergedCategories: Map<string, SymptomSpecificCategory> = new Map();

	for (const profile of profiles) {
		for (const category of profile.categories) {
			const existing = mergedCategories.get(category.id);
			if (existing) {
				// Merge factors
				const existingFactorIds = new Set(existing.factors.map((f) => f.id));
				const newFactors = category.factors.filter(
					(f) => !existingFactorIds.has(f.id),
				);
				existing.factors = [...existing.factors, ...newFactors];
			} else {
				// Add new category
				mergedCategories.set(category.id, {
					...category,
					factors: [...category.factors],
				});
			}
		}
	}

	return {
		id: "merged",
		name: "Multiple areas",
		nameRo: "Zone multiple",
		categories: Array.from(mergedCategories.values()),
	};
}

/**
 * Get HPO IDs from symptom-specific factors
 */
export function getHpoIdsFromSymptomFactors(
	factorIds: string[],
	profiles: SymptomProfile[],
): string[] {
	const hpoIds: string[] = [];

	for (const profile of profiles) {
		for (const category of profile.categories) {
			for (const factor of category.factors) {
				if (factorIds.includes(factor.id) && factor.hpoId) {
					hpoIds.push(factor.hpoId);
				}
			}
		}
	}

	return [...new Set(hpoIds)];
}
