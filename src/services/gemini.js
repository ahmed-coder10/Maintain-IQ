import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbService } from './db';

// ----------------------------------------------------
// RULE-BASED FALLBACK ENGINE
// ----------------------------------------------------
const FALLBACK_TRIAGE = [
  {
    keywords: ['ac', 'hvac', 'leak', 'water', 'cooling', 'temperature', 'filter', 'rattle', 'noise'],
    category: 'HVAC',
    priority: 'High',
    title: 'HVAC Condensation Leakage & Performance Degradation',
    causes: [
      'Clogged condensate drain line',
      'Frozen evaporator coil due to low airflow',
      'Dirty air filter restricting circulation',
      'Loose fan blade or blower wheel housing'
    ],
    checks: [
      'Turn off the unit immediately if water is near electrical wiring.',
      'Check if air filter is dark or dusty and replace if necessary.',
      'Inspect the condensate drain pan for standing water or overflows.',
      'Listen closely to locate the source of vibration/noise (motor vs. housing).'
    ],
    warning: 'CAUTION: Disconnect main power breaker before opening HVAC access panels. Do not touch electrical circuits if wet.'
  },
  {
    keywords: ['projector', 'hdmi', 'flicker', 'display', 'screen', 'lamp', 'bulb', 'cable'],
    category: 'Electronics',
    priority: 'Medium',
    title: 'Projector Interface Connection & Display Instability',
    causes: [
      'Loose or damaged HDMI cable connection',
      'Improper input resolution/frequency output from source',
      'Projector lamp reaching end of operational life',
      'Overheated optical engine triggering safety shutdown'
    ],
    checks: [
      'Test connection with a different HDMI cable and input device.',
      'Check system temperature; ensure ventilation vents are clean and unobstructed.',
      'Inspect the lamp hour timer in the projector system settings menu.',
      'Perform a factory reset of the display output configuration.'
    ],
    warning: 'WARNING: Projector lamps operate under high pressure and temperature. Allow lamp to cool for at least 45 minutes before attempting service.'
  },
  {
    keywords: ['generator', 'diesel', 'engine', 'start', 'power', 'battery', 'ats', 'transfer'],
    category: 'Electrical',
    priority: 'Critical',
    title: 'Emergency Generator Auto-Transfer & Starting Failure',
    causes: [
      'Low starter battery voltage or corroded terminals',
      'Clogged diesel fuel filter or air lock in lines',
      'Faulty Automatic Transfer Switch (ATS) controller board',
      'Emergency stop button remains engaged/active'
    ],
    checks: [
      'Verify the physical position of the emergency stop buttons on control panel.',
      'Measure starter battery voltage with a multimeter (must read >12.4V or >24.8V).',
      'Check block heater temperature; the block should feel warm to the touch.',
      'Confirm fuel level is above 50% and check fuel lines for visible leaks.'
    ],
    warning: 'DANGER: High voltage risk. The ATS and Generator control panels contain live busbars. Only qualified electrical technicians should access these enclosures.'
  },
  {
    keywords: ['switch', 'network', 'router', 'poe', 'port', 'offline', 'internet', 'ethernet'],
    category: 'Networking',
    priority: 'High',
    title: 'IT Network Switch Core Port Offline / PoE Shutdown',
    causes: [
      'Static discharge or power surge on ethernet line',
      'PoE power budget exceeded on core controller board',
      'Firmware crash or loopback broadcast storm on network segment',
      'Failed RJ-45 transceiver module'
    ],
    checks: [
      'Locate status LED codes on switch faceplate (amber vs flashing green).',
      'Inspect connected cables for physical damage or broken retaining clips.',
      'Disconnect non-essential PoE devices to test if power budget is exceeded.',
      'Access management console via CLI to check log events and port states.'
    ],
    warning: 'IMPORTANT: Unplugging network equipment may cause business interruption. Coordinate outages with network administrator.'
  }
];

const getGeneralFallback = (complaintText) => {
  return {
    title: `reported issue: ${complaintText.length > 40 ? complaintText.substring(0, 37) + '...' : complaintText}`,
    category: 'General Maintenance',
    priority: 'Medium',
    causes: [
      'Mechanical wear and tear',
      'Asset requires routine calibration/service',
      'Connection or cable interface degradation'
    ],
    checks: [
      'Perform a full power cycle of the equipment.',
      'Inspect outer casing and cables for physical damage.',
      'Check operational logs or error code displays on panel.'
    ],
    warning: 'NOTICE: Always wear appropriate personal protective equipment (PPE) before beginning inspections.'
  };
};

export const geminiService = {
  async triageIssue(complaintText, assetContext = null) {
    // Fetch settings to check for API keys
    const settings = await dbService.getSettings();
    const apiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        console.log("MaintainIQ: Initiating Gemini AI Issue Triage...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: "application/json" }
        });

        const systemPrompt = `
          You are an expert AI maintenance coordinator.
          Your task is to analyze a natural-language maintenance complaint and output a structured JSON response to triage the issue.
          
          User Complaint: "${complaintText}"
          ${assetContext ? `Asset Context: ${JSON.stringify(assetContext)}` : ''}

          Return a JSON object matching this exact TypeScript structure:
          {
            "title": string, // A short, professional technical title for the maintenance ticket
            "category": string, // Suggested category (e.g. Electrical, HVAC, Plumbing, Electronics, Mechanical, Networking, IT, General)
            "priority": "Low" | "Medium" | "High" | "Critical", // Based on safety hazards and business impact
            "causes": string[], // Array of 3-4 possible technical causes of the failure
            "checks": string[], // Array of 3-4 safe, initial diagnostic checks a technician/user can perform
            "warning": string // A clear, highly safety-focused warning regarding hazards (electrical, fire, mechanical pressure)
          }

          Safety guidelines:
          - Never give instructions that encourage unsafe actions, like touching exposed high-voltage wires, working on hot engines, or opening compressed systems without proper release.
          - Remind the user of safety lockouts and PPE.
          - Make the instructions precise and technical.
        `;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        const parsedJson = JSON.parse(responseText);
        
        return {
          title: parsedJson.title,
          category: parsedJson.category,
          priority: parsedJson.priority,
          causes: parsedJson.causes || [],
          checks: parsedJson.checks || [],
          warning: parsedJson.warning,
          isAiTriaged: true
        };
      } catch (error) {
        console.error("MaintainIQ: Gemini API failed, switching to rule-based fallback.", error);
      }
    }

    // Rule-based fallback
    console.log("MaintainIQ: Rule-Based Fallback AI Triage active.");
    const query = complaintText.toLowerCase();
    
    // Find matching rule-based entry
    const match = FALLBACK_TRIAGE.find(item => 
      item.keywords.some(keyword => query.includes(keyword))
    );

    if (match) {
      return {
        title: match.title,
        category: match.category,
        priority: match.priority,
        causes: match.causes,
        checks: match.checks,
        warning: match.warning,
        isAiTriaged: true
      };
    }

    // Default general fallback
    return {
      ...getGeneralFallback(complaintText),
      isAiTriaged: true
    };
  }
};
