// background.js - Service Worker for handling API calls (same-page execution)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateActionPlanForUserInstructions') {
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

  const API_KEY = "AIzaSyDJmSlrT7qztmzQ_Lov6tL25iWdlyIzHbI";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const geminiPrompt = `
You are a Salesforce Lightning automation expert. Generate JavaScript DOM automation steps to execute the following task DIRECTLY on the current Salesforce page (no new tabs or navigation).

There are going to be multiple ordered user instructions: Example "Step 1: Create Account. Step 2: Create Contact".
Here is the actual user provided instructions: "${instruction}"

For each user provided instruction, generate a JSON array of steps where each step has:
- "action": one of ["click", "type", "selectByValue", "waitFor", "waitForVisible", "app_launcher", "sleep"]
- "details": object with required fields:
  - "selector": CSS selector or XPath (prefer CSS)
  - "text": for typing
  - "value": for selection
  - "timeout": for waits (default 10000ms)
  - "ms": for sleep duration
  - "objectName": for app_launcher (e.g., "Accounts", "Contacts", "Opportunities")
  - Do not include any comment in the JSON object.

Key requirements:
1. Work on CURRENT page - no navigation/new tabs
2. Use modern Lightning UI selectors
3. Include proper waits for elements to load
4. For creating records: use app_launcher first, then form filling steps

Instructions:
1. You need to generate an action plan to complete the user provided instructions.
2. The output must be a JSON array. It is going to be an array of array where each element in the array is an "action plan".
3. An action plan consists of a set of steps that needs to be performed to complete a step in user provided instruction.
Below is an example of action plan for - "Create account":
[
  { "action": "app_launcher", "details": { "objectName": "Accounts" } },
  { "action": "waitFor", "details": { "selector": "input[name='Name']", "timeout": 5000 } },
  { "action": "type", "details": { "selector": "input[name='Name']", "text": "New Account Name" } },
  { "action": "autofill", "details": { } },
  { "action": "click", "details": { "selector": "button[name='SaveEdit']" } },

]
4. After opening the record for, i.e. in the autofill step the record fields are populated.
5. Ensure to not omit the autofill step from action plan for any object.


6. We will have one action plan for each object.
7. If there are 'N' user instructions, then there will be N items in array.
8. Assume all object names are valid.
9. Generate ONLY the valid JSON array, no additional text or comments.
10. Ensure the JSON output STRICTLY does not contain ANY comments.

  `

/*
//Single Object Prompt
  const geminiPrompt = `
You are a Salesforce Lightning automation expert. Generate JavaScript DOM automation steps to execute the following task DIRECTLY on the current Salesforce page (no new tabs or navigation).

User instruction: "${instruction}"

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

Key requirements:
1. Work on CURRENT page - no navigation/new tabs
2. Use modern Lightning UI selectors
3. Include proper waits for elements to load
4. For creating records: use app_launcher first, then form filling steps

Example for "Create a new account":
[
  { "action": "app_launcher", "details": { "objectName": "Accounts" } },
  { "action": "waitFor", "details": { "selector": "input[name='Name']", "timeout": 5000 } },
  { "action": "type", "details": { "selector": "input[name='Name']", "text": "New Account Name" } },
  { "action": "click", "details": { "selector": "button[name='SaveEdit']" } }
]

Generate ONLY the JSON array, no additional text:
`;
*/

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
      maxOutputTokens: 2048,
    }
  };

  try {
    console.log('Making Gemini API request for same-page execution...');

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
      console.log('Generated action plan for same-page execution:', actionPlan);

      // Validate action plan
      if (!Array.isArray(actionPlan)) {
        throw new Error('Action plan must be an array');
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
