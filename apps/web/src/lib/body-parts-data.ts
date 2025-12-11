/**
 * Body Parts Data - Mapped to UBERON Ontology IDs
 * Used for the symptom checker body part selection
 */

export interface BodyPart {
	id: string; // UBERON ID
	name: string;
	nameRo: string; // Romanian translation
	icon?: string;
	parentSystem: BodySystem;
}

export type BodySystem =
	| "head_neck"
	| "cardiovascular"
	| "respiratory"
	| "gastrointestinal"
	| "urinary"
	| "musculoskeletal"
	| "integumentary"
	| "endocrine"
	| "immune"
	| "reproductive"
	| "thorax";

export interface BodySystemInfo {
	id: BodySystem;
	name: string;
	nameRo: string;
	icon: string;
}

export const BODY_SYSTEMS: BodySystemInfo[] = [
	{ id: "head_neck", name: "Head & Neck", nameRo: "Cap și Gât", icon: "🧠" },
	{
		id: "cardiovascular",
		name: "Cardiovascular",
		nameRo: "Cardiovascular",
		icon: "❤️",
	},
	{ id: "respiratory", name: "Respiratory", nameRo: "Respirator", icon: "🫁" },
	{
		id: "thorax",
		name: "Thorax / Chest",
		nameRo: "Torace / Piept",
		icon: "🫀",
	},
	{
		id: "gastrointestinal",
		name: "Gastrointestinal",
		nameRo: "Gastrointestinal",
		icon: "🍽️",
	},
	{ id: "urinary", name: "Urinary", nameRo: "Urinar", icon: "💧" },
	{
		id: "musculoskeletal",
		name: "Musculoskeletal",
		nameRo: "Musculo-scheletic",
		icon: "🦴",
	},
	{
		id: "integumentary",
		name: "Skin & Hair",
		nameRo: "Piele și Păr",
		icon: "🧴",
	},
	{ id: "endocrine", name: "Endocrine", nameRo: "Endocrin", icon: "⚗️" },
	{
		id: "immune",
		name: "Immune / Lymphatic",
		nameRo: "Imunitar / Limfatic",
		icon: "🛡️",
	},
	{
		id: "reproductive",
		name: "Reproductive",
		nameRo: "Reproductiv",
		icon: "🧬",
	},
];

export const COMMON_BODY_PARTS: BodyPart[] = [
	// Head & Neck
	{
		id: "UBERON:0000033",
		name: "Head",
		nameRo: "Cap",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000955",
		name: "Brain",
		nameRo: "Creier",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000970",
		name: "Eye",
		nameRo: "Ochi",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001690",
		name: "Ear",
		nameRo: "Ureche",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000004",
		name: "Nose",
		nameRo: "Nas",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001723",
		name: "Tongue",
		nameRo: "Limbă",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0000165",
		name: "Mouth",
		nameRo: "Gură",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001567",
		name: "Throat",
		nameRo: "Gât",
		parentSystem: "head_neck",
	},
	{
		id: "UBERON:0001042",
		name: "Trachea",
		nameRo: "Trahee",
		parentSystem: "head_neck",
	},

	// Cardiovascular
	{
		id: "UBERON:0000948",
		name: "Heart",
		nameRo: "Inimă",
		parentSystem: "cardiovascular",
	},
	{
		id: "UBERON:0000178",
		name: "Blood",
		nameRo: "Sânge",
		parentSystem: "cardiovascular",
	},
	{
		id: "UBERON:0001981",
		name: "Blood vessel",
		nameRo: "Vas de sânge",
		parentSystem: "cardiovascular",
	},
	{
		id: "UBERON:0000947",
		name: "Aorta",
		nameRo: "Aortă",
		parentSystem: "cardiovascular",
	},

	// Respiratory
	{
		id: "UBERON:0002048",
		name: "Lung",
		nameRo: "Plămân",
		parentSystem: "respiratory",
	},
	{
		id: "UBERON:0002185",
		name: "Bronchus",
		nameRo: "Bronhie",
		parentSystem: "respiratory",
	},

	// Thorax
	{
		id: "UBERON:0000310",
		name: "Chest",
		nameRo: "Piept",
		parentSystem: "thorax",
	},
	{
		id: "UBERON:0002082",
		name: "Thoracic cavity",
		nameRo: "Cavitate toracică",
		parentSystem: "thorax",
	},
	{
		id: "UBERON:0002407",
		name: "Pericardium",
		nameRo: "Pericard",
		parentSystem: "thorax",
	},

	// Gastrointestinal
	{
		id: "UBERON:0000002",
		name: "Abdomen",
		nameRo: "Abdomen",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0001043",
		name: "Esophagus",
		nameRo: "Esofag",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0000945",
		name: "Stomach",
		nameRo: "Stomac",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0000160",
		name: "Intestine",
		nameRo: "Intestin",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0002116",
		name: "Small intestine",
		nameRo: "Intestin subțire",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0001155",
		name: "Colon",
		nameRo: "Colon",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0001052",
		name: "Rectum",
		nameRo: "Rect",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0002107",
		name: "Liver",
		nameRo: "Ficat",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0001264",
		name: "Pancreas",
		nameRo: "Pancreas",
		parentSystem: "gastrointestinal",
	},
	{
		id: "UBERON:0002110",
		name: "Gallbladder",
		nameRo: "Vezică biliară",
		parentSystem: "gastrointestinal",
	},

	// Urinary
	{
		id: "UBERON:0002113",
		name: "Kidney",
		nameRo: "Rinichi",
		parentSystem: "urinary",
	},
	{
		id: "UBERON:0001255",
		name: "Urinary bladder",
		nameRo: "Vezică urinară",
		parentSystem: "urinary",
	},
	{
		id: "UBERON:0000056",
		name: "Ureter",
		nameRo: "Ureter",
		parentSystem: "urinary",
	},
	{
		id: "UBERON:0000057",
		name: "Urethra",
		nameRo: "Uretra",
		parentSystem: "urinary",
	},

	// Musculoskeletal
	{
		id: "UBERON:0001137",
		name: "Spine",
		nameRo: "Coloană vertebrală",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0000976",
		name: "Neck",
		nameRo: "Gât (cervical)",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001467",
		name: "Shoulder",
		nameRo: "Umăr",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001460",
		name: "Arm",
		nameRo: "Braț",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001461",
		name: "Elbow",
		nameRo: "Cot",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0004458",
		name: "Wrist",
		nameRo: "Încheietură mâini",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0002398",
		name: "Hand",
		nameRo: "Mână",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0002378",
		name: "Finger",
		nameRo: "Deget mână",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0000009",
		name: "Back",
		nameRo: "Spate",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0002355",
		name: "Pelvis",
		nameRo: "Pelvis",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0000376",
		name: "Hip",
		nameRo: "Șold",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0000978",
		name: "Leg",
		nameRo: "Picior",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001465",
		name: "Knee",
		nameRo: "Genunchi",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001488",
		name: "Ankle",
		nameRo: "Gleznă",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0002387",
		name: "Foot",
		nameRo: "Labă picior",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001466",
		name: "Toe",
		nameRo: "Deget picior",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001474",
		name: "Bone",
		nameRo: "Os",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0001630",
		name: "Muscle",
		nameRo: "Mușchi",
		parentSystem: "musculoskeletal",
	},
	{
		id: "UBERON:0000982",
		name: "Joint",
		nameRo: "Articulație",
		parentSystem: "musculoskeletal",
	},

	// Skin
	{
		id: "UBERON:0002097",
		name: "Skin",
		nameRo: "Piele",
		parentSystem: "integumentary",
	},
	{
		id: "UBERON:0001003",
		name: "Nails",
		nameRo: "Unghii",
		parentSystem: "integumentary",
	},
	{
		id: "UBERON:0010166",
		name: "Hair",
		nameRo: "Păr",
		parentSystem: "integumentary",
	},

	// Endocrine
	{
		id: "UBERON:0002046",
		name: "Thyroid gland",
		nameRo: "Glandă tiroidă",
		parentSystem: "endocrine",
	},
	{
		id: "UBERON:0002369",
		name: "Adrenal gland",
		nameRo: "Glandă suprarenală",
		parentSystem: "endocrine",
	},
	{
		id: "UBERON:0000007",
		name: "Pituitary gland",
		nameRo: "Glandă pituitară",
		parentSystem: "endocrine",
	},

	// Immune/Lymphatic
	{
		id: "UBERON:0002106",
		name: "Spleen",
		nameRo: "Splină",
		parentSystem: "immune",
	},
	{
		id: "UBERON:0000029",
		name: "Lymph node",
		nameRo: "Ganglion limfatic",
		parentSystem: "immune",
	},
	{
		id: "UBERON:0002370",
		name: "Thymus",
		nameRo: "Timus",
		parentSystem: "immune",
	},

	// Reproductive
	{
		id: "UBERON:0000995",
		name: "Uterus",
		nameRo: "Uter",
		parentSystem: "reproductive",
	},
	{
		id: "UBERON:0000992",
		name: "Ovary",
		nameRo: "Ovar",
		parentSystem: "reproductive",
	},
	{
		id: "UBERON:0000473",
		name: "Testis",
		nameRo: "Testicul",
		parentSystem: "reproductive",
	},
	{
		id: "UBERON:0002367",
		name: "Prostate",
		nameRo: "Prostată",
		parentSystem: "reproductive",
	},
	{
		id: "UBERON:0000997",
		name: "Vagina",
		nameRo: "Vagin",
		parentSystem: "reproductive",
	},
	{
		id: "UBERON:0000996",
		name: "Breast",
		nameRo: "Sân",
		parentSystem: "reproductive",
	},
];

/**
 * Get body parts by system
 */
export function getBodyPartsBySystem(system: BodySystem): BodyPart[] {
	return COMMON_BODY_PARTS.filter((part) => part.parentSystem === system);
}

/**
 * Get body part by ID
 */
export function getBodyPartById(id: string): BodyPart | undefined {
	return COMMON_BODY_PARTS.find((part) => part.id === id);
}

/**
 * Search body parts by name (English or Romanian)
 */
export function searchBodyParts(query: string): BodyPart[] {
	const lowerQuery = query.toLowerCase();
	return COMMON_BODY_PARTS.filter(
		(part) =>
			part.name.toLowerCase().includes(lowerQuery) ||
			part.nameRo.toLowerCase().includes(lowerQuery),
	);
}
