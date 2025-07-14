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
        document.getElementById("output").innerText = `Agent Generating Actions`;

        const geminiResponse = await generateActionPlan(instruction, isSalesforceOrg, domain, tab.id); 
        if (!geminiResponse || geminiResponse.length == 0) {
            document.getElementById("output").innerText = `Gemini did not return a valid action plan.`;
            return;
        }

        document.getElementById("output").innerText = `Process started! Executing Step-by-step`;

        setTimeout(() => {
            window.close();
        }, 1000);

        await executeOnCurrentTab(tab.id, geminiResponse);

    } catch (ex) {
        document.getElementById("output").innerText = `Error: ${ex?.message}`;
    }
});

async function executeOnCurrentTab(tabId, actionPlan) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, {
            action: 'executeAutomation',
            actionPlan: actionPlan
        }, (response) => {
            if (chrome.runtime.lastError) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error('Failed to inject content script'));
                        return;
                    }

                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {
                            action: 'executeAutomation',
                            actionPlan: actionPlan
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else if (response && response.success) {
                                resolve(response);
                            } else {
                                reject(new Error(response ? response.error : 'Unknown error'));
                            }
                        });
                    }, 1000);
                });
            } else if (response && response.success) {
                resolve(response);
            } else {
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

async function generateActionPlan(instruction, isSalesforceOrg, currentDomain, currentTabId) {
    try {
        const geminiResponse = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'callGeminiAPI',
                data: { instruction, isSalesforceOrg, currentDomain, currentTabId, samePageExecution: true }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response ? response.error : 'Unknown error'));
                }
            });
        });

        const isLoggedIn = await checkSalesforceLogin(currentTabId);

        if (!isLoggedIn) {
            throw new Error('Please log into Salesforce first, then try again.');
        }

        return geminiResponse;

    } catch (ex) {
        throw new Error(`Exception in generating action plan: ${ex?.message}`);
    }
}
