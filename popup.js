/**
 * Handles logic for the popup UI (like form inputs, buttons in popup.html).
 * Updated to work on the same page where extension is loaded
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
      `Instruction: ${instruction}\nWorking on current page: ${domain}`;

    // Check if current tab is already a Salesforce org
    const isSalesforceOrg = url.includes('salesforce.com') || 
                           url.includes('force.com') || 
                           url.includes('.lightning.force.com') ||
                           url.includes('my.salesforce.com');

    if (!isSalesforceOrg) {
        document.getElementById("output").innerText = 
            `Please navigate to a Salesforce org first, then use this extension.`;
        return;
    }

    try {
        document.getElementById("output").innerText = `Generating action plan...`;
        
        const geminiResponse = await generateActionPlan(instruction, isSalesforceOrg, domain, tab.id); 
        if (!geminiResponse || geminiResponse.length == 0) {
            document.getElementById("output").innerText = `Gemini did not return a valid action plan.`;
        } else {
            document.getElementById("output").innerText = 
                `Executing automation on current page...`;
            
            // Execute the automation directly on current tab
            await executeOnCurrentTab(tab.id, geminiResponse);
            
            document.getElementById("output").innerText = 
                `Automation completed successfully!`;
        }
    } catch (ex) {
        document.getElementById("output").innerText = `Error: ${ex?.message}`;
    }
});

/**
 * Execute automation steps directly on the current tab using content script
 */
async function executeOnCurrentTab(tabId, actionPlan) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, {
            action: 'executeAutomation',
            actionPlan: actionPlan
        }, (response) => {
            if (chrome.runtime.lastError) {
                // If content script is not loaded, inject it first
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Failed to inject content script'));
                        return;
                    }
                    
                    // Try again after injecting content script
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {
                            action: 'executeAutomation',
                            actionPlan: actionPlan
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else if (response.success) {
                                resolve(response);
                            } else {
                                reject(new Error(response.error));
                            }
                        });
                    }, 1000);
                });
            } else if (response.success) {
                resolve(response);
            } else {
                reject(new Error(response.error));
            }
        });
    });
}

/**
 * Check if user is logged into Salesforce in current tab
 */
async function checkSalesforceLogin(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Check for common Salesforce logged-in indicators
                const isLoggedIn = !!(
                    document.querySelector('[data-aura-rendered-by]') ||
                    document.querySelector('.slds-') ||
                    document.querySelector('lightning-') ||
                    document.querySelector('.oneHeader') ||
                    (window.location.href.includes('lightning/') && !window.location.href.includes('login'))
                );
                return isLoggedIn;
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                resolve(false);
            } else {
                resolve(results && results[0] && results[0].result);
            }
        });
    });
}

/**
 * Call Gemini API to understand instruction and generate action plan for same-page execution
 */
async function generateActionPlan(instruction, isSalesforceOrg, currentDomain, currentTabId) {
    console.log("Generating action plan for same-page execution");
    
    try {
        // Call Gemini API through background script
        const geminiResponse = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'callGeminiAPI',
                data: { instruction, isSalesforceOrg, currentDomain, currentTabId, samePageExecution: true }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error));
                }
            });
        });

        // Check if user is logged in on current page
        const isLoggedIn = await checkSalesforceLogin(currentTabId);
        
        if (!isLoggedIn) {
            throw new Error('Please log into Salesforce first, then try again.');
        }

        console.log("Gemini response for same-page execution:", geminiResponse);
        return geminiResponse;

    } catch (ex) {
        let errorMsg = `Exception in generating action plan: ${ex?.message}`;
        throw new Error(errorMsg);
    }
}
