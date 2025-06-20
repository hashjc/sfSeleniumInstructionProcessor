/**
 * Handles logic for the popup UI (like form inputs, buttons in popup.html).
 * Use this for:
 */
document.getElementById("processBtn").addEventListener("click", async () => {
    const instruction = document.getElementById("userInput").value;

    //Ask user to enter an instruction
    if (!instruction) return alert("Please enter an instruction.");
    // Get current tab's URL
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = tab.url;
    const domain = new URL(url).origin;

    // Display the instruction and org URL
    document.getElementById("output").innerText =
      `Instruction: ${instruction}\nSalesforce Org URL: ${domain}`;

    // Replace this with your actual Gemini API call
    try {
        const geminiResponse = await generateActionPlan(instruction); // Simulate Gemini response
        if (!geminiResponse || geminiResponse.length == 0) {
            // Display the instruction and org URL
            document.getElementById("output").innerText = `Gemini did not return a valid object.`;
        } else {
            // Get the current tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const currentUrl = new URL(tabs[0].url);
              const baseUrl = `${currentUrl.origin}`;
              const createRecordUrl = `${baseUrl}/lightning/o/${geminiResponse[0].objectApiName}/new`;
              //const createRecordUrl = `${baseUrl}/lightning/o/${geminiResponse.objectApiName}/new`;

              // Redirect the tab to create record page
              chrome.tabs.update(tabs[0].id, { url: createRecordUrl });
            });
        }
    } catch (ex) {
        //DOM Error message
        // Display the instruction and org URL
        document.getElementById("output").innerText =
          `${ex?.message}`;
    }
});


function processActionPlan(actionPlan) {

}

/**
 * Call Gemini API to understand instruction and generate selenium action plan
 */
async function generateActionPlan(instruction) {
    console.log("Parse user instrucitons Selenium");
    const API_KEY = "AIzaSyD2SEIrk0TXk32YMmDJ83YvUIWUfvQEXTc";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const geminiPrompt = `
Generate a sequence of JavaScript DOM manipulation steps to automate the following user task on the Salesforce Lightning UI.
The output should be a JSON array of steps, where each step contains:
- "action": one of ["navigate", "click", "type", "selectByValue", "waitFor"]
- "details": an object with necessary fields like:
    - "url" for navigation
    - "selector" (CSS selector)
    - "text" or "value" for typing or selection
Try to use robust selectors based on IDs, stable classes, or aria-labels when possible.
Assume the user is logged into Salesforce.

Example:
User Task: "Log in to example.com with username 'user1' and password 'pass123' then click the login button."
Expected Output:
[
  { "action": "navigate", "details": { "url": "https://example.com/login" } },
  { "action": "type", "details": { "selector": "#username", "text": "user1" } },
  { "action": "type", "details": { "selector": "#password", "text": "pass123" } },
  { "action": "click", "details": { "selector": "#Login" } },
  { action: "app_launcher", details: { "objectName": "Account" } }
]

Now generate steps for:
User Task: ObjectName: Account.
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
        ]
    };
    let actionPlan = [];
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();
        if (response?.status >= 200 && response?.status < 300) {

          console.log('CP600 Response 200 data candidate ', data?.candidates);
            if (!data?.candidates || data.candidates.length === 0) {
                throw new Error(`Response code ${response.status}. No AI response received.`);
            }
            let rawResponse = data.candidates[0].content.parts[0].text;
            let jsonString = rawResponse.replace(/```json|```/g, "").trim();
            try {
                actionPlan = JSON.parse(jsonString);
                //return parsedData;
            } catch (ex) {
                let errorMsg = `Failed to parse AI response. Exception caught ${ex?.message} at line number ${ex?.lineNumber}. Response code ${response?.status}.`;
                throw new Error(errorMsg);
            }

        } else {

            let errorStatus = data?.error?.status;
            let errorMsg = data?.error?.message;
            throw new Error(`HTTP API Error: ${response?.status}. Status: ${errorStatus}. Message: ${errorMsg}`);

        }

        actionPlan.unshift(
            { action: "navigate", details: { url: "https://login.salesforce.com/" } },
            { action: "type", details: { selector: "#username", text: "<yourusername>" } },
            { action: "type", details: { selector: "#password", text: "<yourpassword>" } },
            { action: "click", details: { selector: "#Login" } },
            { action: "app_launcher", details: { selector: "#Login", "objectName": "Accounts" } }
        );
        console.log("Action pLan ", actionPlan);
        fetch("http://localhost:5001/run-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actionPlan)
        });

    } catch (ex) {
        let errorMsg = `Exception in parse user instruction: ${ex?.message}. At line number ${ex?.lineNumber}. Stack Trace: ${ex?.stack}`;
        throw new Error(errorMsg);
    }

}