import { GoogleGenerativeAI } from "@google/generative-ai";

// --- ENVIRONMENT VARIABLES ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SAMBANOVA_API_KEY = import.meta.env.VITE_SAMBANOVA_API_KEY; // Add this to your .env

if (!GEMINI_API_KEY) console.error("CRITICAL ERROR: Missing VITE_GEMINI_API_KEY.");
if (!SAMBANOVA_API_KEY) console.warn("WARNING: Missing VITE_SAMBANOVA_API_KEY. Fallback layer 2 will be skipped.");

// --- INITIALIZE GEMINI ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- 1. LOCAL KNOWLEDGE BASE (Now the 3rd Fallback) ---
const KNOWLEDGE_BASE = [
  {
    pattern: /(pothole|pit|manhole|crater|road damage|broken road|sinkhole)/i,
    response: {
      category: "Potholes", severity: "Medium", estimatedTime: "24-48 Hours", impactScope: 60,
      summary: "Detected surface degradation potentially hazardous to vehicles.",
      precautions: ["Place a red cloth or reflective cone.", "Drive slowly.", "Do not fill with loose soil."],
      diyFixes: ["Fill with gravel or cold asphalt.", "Report GPS coordinates.", "Use sandbags."]
    }
  },
  {
    pattern: /(electric|wire|spark|shock|short\s?circuit|current|pole|street\s?light|lamp|voltage)/i,
    response: {
      category: "Street Light / Electricity", severity: "Critical", estimatedTime: "2-4 Hours", impactScope: 95,
      summary: "High-voltage electrical hazard detected. Immediate intervention required.",
      precautions: ["STAY AWAY 10m+.", "Do not touch metal.", "Keep children indoors."],
      diyFixes: ["Do NOT touch.", "Call electricity board.", "Cordon off area."]
    }
  },
  {
    pattern: /(water|leak|pipe|burst|flood|drainage|sewage|overflow)/i,
    response: {
      category: "Water Leakage", severity: "High", estimatedTime: "4-6 Hours", impactScope: 75,
      summary: "Active water loss or contamination risk identified.",
      precautions: ["Avoid stagnant water.", "Turn off main valve.", "Move valuables up."],
      diyFixes: ["Wrap leak with rubber.", "Divert water with sandbags.", "Clear storm drains."]
    }
  },
  {
    pattern: /(garbage|trash|waste|dump|smell|stink|rubbish|dustbin|litter)/i,
    response: {
      category: "Garbage", severity: "Low", estimatedTime: "1 Day", impactScope: 30,
      summary: "Accumulated waste posing hygiene and odor issues.",
      precautions: ["Wear a mask.", "Do not burn waste.", "Keep area dry."],
      diyFixes: ["Segregate waste.", "Sprinkle bleaching powder.", "Organize cleanup."]
    }
  },
  {
    pattern: /(manhole|sewer|drain cover|open drain|chamber)/i,
    response: {
      category: "Manhole", severity: "Critical", estimatedTime: "4-8 Hours", impactScope: 90,
      summary: "Open manhole posing severe fall hazard.",
      precautions: ["Do not walk in flood.", "Watch children.", "No weak covers."],
      diyFixes: ["Insert warning stick.", "Place heavy stones.", "Barricade with tape."]
    }
  }
];

// --- HELPER: CONVERT IMAGE TO BASE64 ---
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- MAIN FUNCTION ---
export const getAiAdvice = async (imageFile, title, description) => {
  console.log("🚀 Starting AI Analysis...");

  // 1. TRY GEMINI (First Choice - Vision + Text)
  try {
    console.log("🤖 Attempting Gemini API...");
    const result = await callGemini(imageFile, title, description);
    console.log("✅ Gemini Success");
    return result;
  } catch (geminiError) {
    console.warn("⚠️ Gemini Failed:", geminiError.message);
  }

  // 2. TRY SAMBANOVA (Second Choice - Fast Llama 3.1)
  try {
    if (!SAMBANOVA_API_KEY) throw new Error("SambaNova Key missing.");
    console.log("🦁 Attempting SambaNova API...");
    const result = await callSambaNova(title, description); // Currently text-only
    console.log("✅ SambaNova Success");
    return result;
  } catch (sambaError) {
    console.warn("⚠️ SambaNova Failed:", sambaError.message);
  }

  // 3. TRY LOCAL KNOWLEDGE BASE (Third Choice - Regex)
  console.log("🧠 Checking Local Knowledge Base...");
  const localResult = checkKnowledgeBase(title, description);
  if (localResult) {
    console.log("✅ Knowledge Base Match Found");
    return localResult;
  }

  // 4. OFFLINE FALLBACK
  console.error("❌ All Analysis Methods Failed.");
  return getOfflineFallback();
};


// --- IMPLEMENTATION: GEMINI ---
async function callGemini(imageFile, title, description) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } 
  });

  const prompt = `
    You are an expert Civil Engineer. Analyze this issue.
    Title: "${title}"
    Description: "${description}"
    Return a raw JSON object with these EXACT keys:
    {
      "severity": "Critical" | "High" | "Medium" | "Low",
      "category": "String",
      "estimatedTime": "String",
      "impactScope": Integer (1-100),
      "precautions": ["Tip 1", "Tip 2", "Tip 3"],
      "diyFixes": ["Fix 1", "Fix 2", "Fix 3"],
      "summary": "One concise sentence."
    }
  `;

  let promptParts = [prompt];
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    promptParts.push(imagePart);
  }

  const result = await model.generateContent(promptParts);
  return JSON.parse(result.response.text());
}


// --- IMPLEMENTATION: SAMBANOVA (Llama 3.1) ---
async function callSambaNova(title, description) {
  const systemPrompt = `
    You are an expert Civil Engineer. Output ONLY valid JSON.
    Analyze this civic issue based on the description.
    Return JSON with keys: severity, category, estimatedTime, impactScope, precautions, diyFixes, summary.
  `;

  const userPrompt = `Title: ${title}\nDescription: ${description}`;

  const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SAMBANOVA_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "Meta-Llama-3.1-70B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" } // Enforces JSON
    })
  });

  if (!response.ok) throw new Error(`SambaNova API Error: ${response.statusText}`);
  
  const data = await response.json();
  const textContent = data.choices[0].message.content;
  return JSON.parse(textContent);
}


// --- IMPLEMENTATION: LOCAL KNOWLEDGE BASE ---
function checkKnowledgeBase(title, description) {
  const searchText = `${title || ""} ${description || ""}`;
  
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.pattern.test(searchText)) {
      return entry.response;
    }
  }
  return null;
}


// --- FALLBACK ---
const getOfflineFallback = () => ({
  severity: "Medium",
  category: "Unidentified Issue",
  estimatedTime: "Unknown",
  impactScope: 0,
  precautions: ["Ensure safety first.", "Keep distance from the hazard."],
  diyFixes: ["Please try submitting again with a clearer description."],
  summary: "AI analysis failed. Please rely on manual inspection."
});
