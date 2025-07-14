// background.js - Service Worker for handling API calls (same-page execution)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGeminiAPI') {
    handleGeminiAPICall(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => {
        console.error('Gemini API Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
    }
    if (request.type === "statusUpdate") {
        console.log("[Background] Status update:", request.message);
        latestStatus = request.message;
    } else if (request.type === "getStatus") {
        sendResponse({ message: latestStatus });
        return true;
    }
});

async function handleGeminiAPICall(requestData) {
  const { instruction, isSalesforceOrg, currentDomain, currentTabId, samePageExecution } = requestData;

  const API_KEY = "AIzaSyAWpSq4nTD377qg4J4n7bxWiTifvz43IDU";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const geminiPrompt = `
You are a Salesforce Lightning automation expert. Generate JavaScript DOM automation steps to execute the following task DIRECTLY on the current Salesforce page (no new tabs or navigation).

User instruction: "${instruction}"

IMPORTANT: If the instruction contains multiple steps (e.g., "Step1.Create Account Step2.Create Contact"), handle each step sequentially in the same JSON array.

Generate a JSON array of steps where each step has:
- "action": one of ["click", "type", "selectByValue", "waitFor", "waitForVisible", "app_launcher", "sleep"]
- "details": object with required fields:
  - "selector": CSS selector or XPath (prefer CSS)
  - "text": for typing
  - "value": for selection
  - "timeout": for waits (default 10000ms)
  - "ms": for sleep duration
  - "objectName": for app_launcher (e.g., "Accounts", "Contacts", "Opportunities")
  - Do not include any comment in the JSON object.

RULES FOR MULTI-STEP CREATION:
 • If the input contains "Step1", "Step2", etc., generate for each step:
   1. { "action":"app_launcher",    "details":{ "objectName":"<ObjectAPIName>" } }
   2. { "action":"sleep",           "details":{ "ms":2000 } }
   3. { "action":"waitForUserSave", "details":{ "message":"Please click Save to complete {step description}, then click Continue." } }
   4. { "action":"sleep",           "details":{ "ms":2000 } }

 • Do not click Save automatically—always use "waitForUserSave".
 • Return only the JSON array of steps, with no additional text.

Key requirements:
1. Work on CURRENT page - no navigation/new tabs
2. Use modern Lightning UI selectors
3. Include proper waits for elements to load
4. For creating records: use app_launcher first, then form filling steps
5. For multiple objects: complete one object creation before starting the next
6. Add sleep between different object creations for stability

Example for "Step1.Create Account Step2.Create Contact":
[
 { "action":"app_launcher",    "details":{ "objectName":"Accounts" } },
  { "action":"sleep",           "details":{ "ms":2000 } },
  { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Account, then click Continue." } },
  { "action":"sleep",           "details":{ "ms":2000 } },
  { "action":"app_launcher",    "details":{ "objectName":"Contacts" } },
  { "action":"sleep",           "details":{ "ms":2000 } },
  { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Contact, then click Continue." } },
  { "action":"sleep",           "details":{ "ms":2000 } }
]

Pattern recognition:
- If instruction contains "Step1", "Step2", etc., treat each as separate object creation
- If instruction contains "Create [Object1]" and "Create [Object2]", handle sequentially
- Always add proper waits and sleep between different object creations
- Use toast message wait to confirm record creation before proceeding

Generate ONLY the JSON array, no additional text:
`; 



  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: geminiPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096, // Increased for multiple objects
    }
  };

  try {
    console.log('Making Gemini API request for multi-object execution...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Chrome Extension"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data?.candidates || data.candidates.length === 0) {
      throw new Error(`No response from Gemini API`);
    }

    if (data.candidates[0]?.finishReason === 'SAFETY') {
      throw new Error('Request blocked by safety filters');
    }

    let rawResponse = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', rawResponse);

    // Clean and parse JSON
    let jsonString = rawResponse.replace(/```json|```/g, "").trim();

    // Extract JSON array if wrapped in text
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    try {
      const actionPlan = JSON.parse(jsonString);
      console.log('Generated action plan for multi-object execution:', actionPlan);

      // Validate action plan
      if (!Array.isArray(actionPlan)) {
        throw new Error('Action plan must be an array');
      }

      // Additional validation for multi-object scenarios
      const appLauncherActions = actionPlan.filter(step => step.action === 'app_launcher');
      if (appLauncherActions.length > 1) {
        console.log(`Multi-object creation detected: ${appLauncherActions.length} objects`);
      }

      return actionPlan;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    console.error('Gemini API error:', error);
    throw new Error(`API call failed: ${error.message}`);
  }
}

// Helper function to parse multi-step instructions
function parseMultiStepInstruction(instruction) {
  // Parse instructions like "Step1.Create Account Step2.Create Contact"
  const stepPattern = /Step(\d+)\.(.+?)(?=Step\d+\.|$)/g;
  const steps = [];
  let match;
  
  while ((match = stepPattern.exec(instruction)) !== null) {
    steps.push({
      stepNumber: parseInt(match[1]),
      action: match[2].trim()
    });
  }
  
  return steps.length > 0 ? steps : [{ stepNumber: 1, action: instruction }];
}

// Usage example:
// const instruction = "Step1.Create Account Step2.Create Contact Step3.Create Opportunity";
// const steps = parseMultiStepInstruction(instruction);
// console.log(steps);
// Output: [
//   { stepNumber: 1, action: "Create Account" },
//   { stepNumber: 2, action: "Create Contact" },
//   { stepNumber: 3, action: "Create Opportunity" }
// ]
