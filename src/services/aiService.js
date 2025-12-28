import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: Missing VITE_GEMINI_API_KEY in .env file.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- 1. LOCAL KNOWLEDGE BASE (Smart Keyword Detection) ---
const KNOWLEDGE_BASE = [
  {
    // Matches: pothole, pit, crater, road damage, broken road
    pattern: /(pothole|pit|crater|road damage|broken road|sinkhole)/i,
    response: {
      category: "Potholes",
      severity: "Medium",
      estimatedTime: "24-48 Hours",
      impactScope: 60,
      summary: "Detected surface degradation potentially hazardous to vehicles.",
      precautions: [
        "Place a red cloth or reflective cone near the pit.",
        "Drive slowly and maintain distance.",
        "Do not attempt to fill with loose soil (it washes away)."
      ],
      diyFixes: [
        "Fill with gravel or cold asphalt mix if available.",
        "Report exact GPS coordinates to municipal corporation.",
        "Use sandbags to divert water accumulation."
      ]
    }
  },
  {
    // Matches: electric, wire, spark, shock, short circuit, shortcircuit, current, pole, street light, streetlight
    pattern: /(electric|wire|spark|shock|short\s?circuit|current|pole|street\s?light|lamp|voltage)/i,
    response: {
      category: "Street Light / Electricity",
      severity: "Critical",
      estimatedTime: "2-4 Hours",
      impactScope: 95,
      summary: "High-voltage electrical hazard detected. Immediate intervention required.",
      precautions: [
        "STAY AWAY: Maintain at least 10 meters distance.",
        "Do not touch any metal objects nearby.",
        "Keep children and pets indoors."
      ],
      diyFixes: [
        "Do NOT attempt any physical fix.",
        "Call the emergency electricity board helpline immediately.",
        "Cordon off the area with rope if safe to do so."
      ]
    }
  },
  {
    // Matches: water, leak, pipe, burst, flood, drainage, sewage, flowing
    pattern: /(water|leak|pipe|burst|flood|drainage|sewage|overflow)/i,
    response: {
      category: "Water Leakage",
      severity: "High",
      estimatedTime: "4-6 Hours",
      impactScope: 75,
      summary: "Active water loss or contamination risk identified.",
      precautions: [
        "Avoid contact with stagnant water (contamination risk).",
        "Turn off the main valve if accessible and safe.",
        "Move valuable items to higher ground."
      ],
      diyFixes: [
        "Wrap the leak with rubber sheets or cycle tubes temporarily.",
        "Use sandbags to divert water flow away from homes.",
        "Clear debris blocking the nearest storm drain."
      ]
    }
  },
  {
    // Matches: garbage, trash, waste, dump, smell, stink, rubbish, dustbin
    pattern: /(garbage|trash|waste|dump|smell|stink|rubbish|dustbin|litter)/i,
    response: {
      category: "Garbage",
      severity: "Low",
      estimatedTime: "1 Day",
      impactScope: 30,
      summary: "Accumulated waste posing hygiene and odor issues.",
      precautions: [
        "Wear a mask to avoid inhaling foul odors/spores.",
        "Do not burn the garbage (toxic fumes).",
        "Keep the area dry to prevent mosquito breeding."
      ],
      diyFixes: [
        "Segregate any visible dry/wet waste if safe.",
        "Sprinkle bleaching powder to control odor and pests.",
        "Organize a community cleanup drive for non-hazardous waste."
      ]
    }
  },
  {
    // Matches: manhole, sewer cover, drain cover, open drain, chamber
    pattern: /(manhole|sewer|drain cover|open drain|chamber)/i,
    response: {
      category: "Manhole",
      severity: "Critical",
      estimatedTime: "4-8 Hours",
      impactScope: 90,
      summary: "Open manhole posing severe fall hazard to pedestrians/vehicles.",
      precautions: [
        "Do not walk through flooded streets (hidden manholes).",
        "Keep a close watch on children playing nearby.",
        "Do not attempt to cover with weak wood/cardboard."
      ],
      diyFixes: [
        "Insert a long branch/stick inside to warn passersby.",
        "Place heavy stones or a tire around the opening.",
        "Barricade with visible tape or red flags."
      ]
    }
  }
];

async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- UPDATED FUNCTION SIGNATURE TO ACCEPT TITLE ---
export const getAiAdvice = async (imageFile, title, description) => {
  
  // Combine Title and Description for scanning
  const searchText = `${title || ""} ${description || ""}`;

  // --- 2. INSTANT KEYWORD CHECK ---
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.pattern.test(searchText)) { 
      console.log("⚡ Instant Match Found:", entry.response.category);
      // Simulate small delay for "thinking" effect
      await new Promise(r => setTimeout(r, 800)); 
      return entry.response;
    }
  }

  // --- 3. FALLBACK TO GEMINI API (If no keywords match) ---
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" } 
    });

    const userPrompt = `
      You are an expert Civil Engineer. 
      Analyze the attached image (if provided).
      Issue Title: "${title}"
      Description: "${description}"
      
      Return a raw JSON object with these EXACT keys:
      {
        "severity": "Critical" | "High" | "Medium" | "Low",
        "category": "String (e.g. Pothole, Electrical, Water, Garbage)",
        "estimatedTime": "String (e.g. 4 Hours, 2 Days)",
        "impactScope": Integer (1-100),
        "precautions": ["Short tip 1", "Short tip 2", "Short tip 3"],
        "diyFixes": ["Temporary fix 1", "Temporary fix 2", "Temporary fix 3"],
        "summary": "One concise sentence describing the specific technical failure."
      }
    `;

    let promptParts = [userPrompt];
    
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      promptParts.push(imagePart);
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return JSON.parse(response.text());

  } catch (error) {
    console.error("Gemini API Request Failed:", error);
    return getOfflineFallback();
  }
};

const getOfflineFallback = () => ({
  severity: "Medium",
  category: "Connection Error",
  estimatedTime: "Unknown",
  impactScope: 0,
  precautions: ["Check your internet connection."],
  diyFixes: ["Retry the analysis."],
  summary: "Could not reach Gemini AI. Please check your API key and network."
});
