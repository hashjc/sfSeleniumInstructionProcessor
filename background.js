// background.js - Enhanced Service Worker for handling API calls with multi-object creation

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGeminiAPI') {
    handleGeminiAPICall(request.data)
      .then((response) => {
        console.log('response action plan -----',response);
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Gemini API Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
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

IMPORTANT: If the instruction contains multiple steps that require record relationships (e.g., "Step1.Create Account Step2.Create Contact on that Account"), handle each step sequentially and pass record context between steps. Use the Related List Quick Links when possible instead of navigating to separate tabs.

Generate a JSON array of steps where each step has:
- "action": one of ["click", "type", "selectByValue", "waitFor", "waitForVisible", "app_launcher", "sleep", "waitForUserSave", "captureRecordId", "navigateToRelatedList", "clickNewInRelatedList"]
- "details": object with required fields:
  - "selector": CSS selector or XPath (prefer CSS)
  - "text": for typing
  - "value": for selection
  - "timeout": for waits (default 10000ms)
  - "ms": for sleep duration
  - "objectName": for app_launcher (e.g., "Accounts", "Contacts", "Opportunities")
  - "recordVariable": for captureRecordId (e.g., "accountId")
  - "relatedListName": for navigateToRelatedList (e.g., "Contacts")
  - "parentRecordVariable": for creating related records
  - "message": for waitForUserSave

RULES FOR MULTI-STEP CREATION WITH RELATIONSHIPS:
For instructions like "Step1.Create Account Step2.Create Contact on that Account":

Step 1 (Create Parent Record):
1. { "action":"app_launcher", "details":{ "objectName":"Accounts" } }
2. { "action":"sleep", "details":{ "ms":2000 } }
3. { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Account, then click Continue." } }
4. { "action":"captureRecordId", "details":{ "recordVariable":"accountId" } }
5. { "action":"sleep", "details":{ "ms":2000 } }

Step 2 (Create Related Record using Quick Links):
6. { "action":"navigateToRelatedList", "details":{ "relatedListName":"Contacts", "parentRecordVariable":"accountId" } }
7. { "action":"sleep", "details":{ "ms":2000 } }
8. { "action":"clickNewInRelatedList", "details":{ "relatedListName":"Contacts" } }
9. { "action":"sleep", "details":{ "ms":2000 } }
10. { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Contact, then click Continue." } }

IMPORTANT: The navigateToRelatedList action will first try to use "Related List Quick Links" section on the Account page, which keeps the user on the same page and automatically establishes the relationship. This is more reliable than navigating to separate tabs.

OBJECT RELATIONSHIP MAPPING:
- Account → Contacts: relatedListName: "Contacts"
- Account → Opportunities: relatedListName: "Opportunities"
- Account → Cases: relatedListName: "Cases"
- Contact → Opportunities: relatedListName: "Opportunities"
- Opportunity → Quote: relatedListName: "Quotes"

Key requirements:
1. Work on CURRENT page - no navigation/new tabs
2. Use Related List Quick Links when possible for better UX
3. Use modern Lightning UI selectors
4. Include proper waits for elements to load
5. Capture record IDs after creation for relationship building
6. Handle lookup field population automatically when creating related records
7. The Account lookup field should be automatically populated with the parent Account name

Example for "Step1.Create Account Step2.Create Contact on that Account":
[
  { "action":"app_launcher", "details":{ "objectName":"Accounts" } },
  { "action":"sleep", "details":{ "ms":2000 } },
  { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Account, then click Continue." } },
  { "action":"captureRecordId", "details":{ "recordVariable":"accountId" } },
  { "action":"sleep", "details":{ "ms":2000 } },
  { "action":"navigateToRelatedList", "details":{ "relatedListName":"Contacts", "parentRecordVariable":"accountId" } },
  { "action":"sleep", "details":{ "ms":2000 } },
  { "action":"clickNewInRelatedList", "details":{ "relatedListName":"Contacts" } },
  { "action":"sleep", "details":{ "ms":2000 } },
  { "action":"waitForUserSave", "details":{ "message":"Please click Save to create the Contact, then click Continue." } }
]

Pattern recognition:
- If instruction mentions creating records "on" or "for" previous records, use related list approach
- Always try Related List Quick Links first before tab navigation
- Always capture record IDs when subsequent steps might need them
- Use proper relationship navigation for child records
- The system will automatically populate lookup fields with parent record names

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
      maxOutputTokens: 4096,
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
