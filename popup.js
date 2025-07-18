// popup.js - Enhanced popup with multi-object creation support
document.getElementById("processBtn").addEventListener("click", async () => {
    const instruction = document.getElementById("userInput").value;

    if (!instruction) return alert("Please enter an instruction.");

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = tab.url;
    const domain = new URL(url).origin;

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
        document.getElementById("output").innerText = `Agent Generating Actions for Multi-Object Creation`;

        const geminiResponse = await generateActionPlan(instruction, isSalesforceOrg, domain, tab.id); 
        if (!geminiResponse || geminiResponse.length == 0) {
            document.getElementById("output").innerText = `Gemini did not return a valid action plan.`;
            return;
        }

        // Display the number of steps for multi-object creation
        const appLauncherSteps = geminiResponse.filter(step => step.action === 'app_launcher').length;
        const captureSteps = geminiResponse.filter(step => step.action === 'captureRecordId').length;
        const relatedListSteps = geminiResponse.filter(step => step.action === 'navigateToRelatedList').length;
        
        let stepMessage = '';
        if (appLauncherSteps > 1) {
            stepMessage = `Multi-object creation detected: ${appLauncherSteps} objects with ${relatedListSteps} relationships. Process started!`;
        } else if (relatedListSteps > 0) {
            stepMessage = `Related object creation detected. Process started!`;
        } else {
            stepMessage = `Process started! Executing ${geminiResponse.length} steps`;
        }
            
        document.getElementById("output").innerText = stepMessage;

        // Show additional info for complex workflows
        if (appLauncherSteps > 1) {
            setTimeout(() => {
                document.getElementById("output").innerText += `\n\nTip: You'll need to click Save for each object creation step.`;
            }, 2000);
        }

        setTimeout(() => {
            window.close();
        }, 3000);

        await executeOnCurrentTab(tab.id, geminiResponse);

    } catch (ex) {
        document.getElementById("output").innerText = `Error: ${ex?.message}`;
        console.error("Popup error:", ex);
    }
});

async function executeOnCurrentTab(tabId, actionPlan) {
    return new Promise((resolve, reject) => {
        // Log the action plan for debugging
        console.log("Executing action plan:", actionPlan);
        
        chrome.tabs.sendMessage(tabId, {
            action: 'executeAutomation',
            actionPlan: actionPlan
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log("Content script not found, injecting...");
                
                // Inject content script if not already present
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to inject content script:", chrome.runtime.lastError);
                        reject(new Error('Failed to inject content script'));
                        return;
                    }

                    console.log("Content script injected successfully");
                    
                    // Wait a bit for content script to initialize
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {
                            action: 'executeAutomation',
                            actionPlan: actionPlan
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Error sending message after injection:", chrome.runtime.lastError);
                                reject(new Error(chrome.runtime.lastError.message));
                            } else if (response && response.success) {
                                console.log("Automation completed successfully");
                                resolve(response);
                            } else {
                                console.error("Automation failed:", response);
                                reject(new Error(response ? response.error : 'Unknown error'));
                            }
                        });
                    }, 1000);
                });
            } else if (response && response.success) {
                console.log("Automation completed successfully");
                resolve(response);
            } else {
                console.error("Automation failed:", response);
                reject(new Error(response ? response.error : 'Unknown error'));
            }
        });
    });
}

async function checkSalesforceLogin(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Check for various Salesforce Lightning indicators
                const isLoggedIn = !!(
                    document.querySelector('[data-aura-rendered-by]') ||
                    document.querySelector('.slds-') ||
                    document.querySelector('lightning-') ||
                    document.querySelector('.oneHeader') ||
                    document.querySelector('.slds-global-header') ||
                    document.querySelector('.forceEntityIcon') ||
                    (window.location.href.includes('lightning/') && !window.location.href.includes('login')) ||
                    (window.location.href.includes('salesforce.com') && !window.location.href.includes('login'))
                );
                
                console.log("Salesforce login check:", isLoggedIn);
                return isLoggedIn;
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error checking Salesforce login:", chrome.runtime.lastError);
                resolve(false);
            } else {
                const isLoggedIn = results && results[0] && results[0].result;
                console.log("Login check result:", isLoggedIn);
                resolve(isLoggedIn);
            }
        });
    });
}

async function generateActionPlan(instruction, isSalesforceOrg, currentDomain, currentTabId) {
    try {
        console.log("Generating action plan for instruction:", instruction);
        
        const geminiResponse = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'callGeminiAPI',
                data: { 
                    instruction, 
                    isSalesforceOrg, 
                    currentDomain, 
                    currentTabId, 
                    samePageExecution: true 
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    console.log("Gemini API response received:", response.data);
                    resolve(response.data);
                } else {
                    console.error("Gemini API error:", response);
                    reject(new Error(response ? response.error : 'Unknown error from Gemini API'));
                }
            });
        });

        // Check if user is logged into Salesforce
        const isLoggedIn = await checkSalesforceLogin(currentTabId);

        if (!isLoggedIn) {
            throw new Error('Please log into Salesforce first, then try again.');
        }

        // Validate the action plan
        if (!Array.isArray(geminiResponse)) {
            throw new Error('Invalid action plan format received from AI');
        }

        // Log action plan details for debugging
        console.log("Action plan validation:");
        console.log("- Total steps:", geminiResponse.length);
        console.log("- App launcher steps:", geminiResponse.filter(s => s.action === 'app_launcher').length);
        console.log("- Capture record ID steps:", geminiResponse.filter(s => s.action === 'captureRecordId').length);
        console.log("- Related list steps:", geminiResponse.filter(s => s.action === 'navigateToRelatedList').length);
        console.log("- User save steps:", geminiResponse.filter(s => s.action === 'waitForUserSave').length);

        return geminiResponse;

    } catch (ex) {
        console.error("Error in generateActionPlan:", ex);
        throw new Error(`Exception in generating action plan: ${ex?.message}`);
    }
}

// Add event listener for Enter key in input field
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        document.getElementById("processBtn").click();
    }
});

// Add some helpful placeholder text
document.addEventListener("DOMContentLoaded", function() {
    const inputField = document.getElementById("userInput");
    if (inputField) {
        inputField.placeholder = "Example: Step1.Create Account Step2.Create Contact on that Account";
    }
    
    // Add some helpful examples
    // const examplesDiv = document.createElement("div");
    // examplesDiv.innerHTML = `
    //     <div style="margin-top: 10px; font-size: 12px; color: #666;">
    //         <strong>Examples:</strong><br>
    //         • Step1.Create Account Step2.Create Contact on that Account<br>
    //         • Step1.Create Account Step2.Create Opportunity on that Account<br>
    //         • Create Account with Contact and Opportunity
    //     </div>
    // `;
    
    const container = document.querySelector(".container") || document.body;
    container.appendChild(examplesDiv);
});

// Add status monitoring for long-running processes
let statusCheckInterval;

function startStatusMonitoring() {
    statusCheckInterval = setInterval(() => {
        chrome.runtime.sendMessage({ type: "getStatus" }, (response) => {
            if (response && response.message) {
                document.getElementById("output").innerText = response.message;
            }
        });
    }, 1000);
}

function stopStatusMonitoring() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    document.getElementById("output").innerText = `Unexpected error: ${event.reason}`;
});

// Add version info for debugging
console.log("Salesforce Multi-Object Automation Extension - Popup Script Loaded");
console.log("Version: 2.0 - Enhanced with relationship handling");
console.log("Supports: Account→Contact, Account→Opportunity, Contact→Opportunity, and more");
