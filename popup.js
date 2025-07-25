// Enhanced popup.js with natural language processing and auto-save features

document.getElementById("processBtn").addEventListener("click", async () => {
    const instruction = document.getElementById("userInput").value;

    if (!instruction) return alert("Please enter an instruction.");

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = tab.url;
    const isSalesforceOrg = url.includes('salesforce.com') || 
                            url.includes('force.com') || 
                            url.includes('.lightning.force.com') ||
                            url.includes('my.salesforce.com');

    if (!isSalesforceOrg) {
        document.getElementById("output").innerText = 
            `Please navigate to a Salesforce org first.`;
        return;
    }

    try {
        showOutput(`🧠 Analyzing natural language: "${instruction}"`);

        const pageContext = await getPageContext(tab.id);
        
        if (!pageContext.isLoggedIn) {
            showOutput(`Please log into Salesforce first.`);
            return;
        }

        // Enhanced analysis display
        const isSequential = detectSequentialInstruction(instruction);
        const hasAutoSave = true; // Always enabled now
        
        if (isSequential) {
            showOutput(`🔄 Sequential automation detected!\n🧠 Enhanced natural language processing\n⚡ Auto-save after 10 seconds\n🚀 Processing multiple steps...`);
        } else {
            showOutput(`🧠 Natural language analysis complete\n🔍 Context: ${pageContext.currentObject || 'Home'} page\n⚡ Auto-save enabled\n🚀 Generating enhanced automation...`);
        }

        const result = await generateAndExecuteSteps(instruction, pageContext, tab.id);
        
        if (result.success) {
            let successMessage = '';
            
            if (result.template === 'sequential-enhanced') {
                successMessage = `✅ Enhanced Sequential Automation Complete!\n📋 ${result.stepCount} automation steps\n🔗 ${result.sequentialSteps.length} sequential steps\n🧠 Natural language processing\n⚡ Auto-save enabled\n\n🎯 Automation running...`;
            } else if (result.template === 'gemini-enhanced-nlp') {
                successMessage = `✅ AI-Enhanced Natural Language Processing!\n📋 ${result.stepCount} intelligent steps\n🧠 Advanced instruction analysis\n⚡ Auto-save after 10 seconds\n\n🎯 Automation running...`;
            } else {
                successMessage = `✅ Enhanced Template: ${result.template}\n📋 ${result.stepCount} steps\n⚡ Auto-save enabled\n\n🎯 Automation running...`;
            }
            
            showOutput(successMessage);
            startProgressTracking();
            
            setTimeout(() => {
                const currentOutput = document.getElementById("output").innerText;
                if (!currentOutput.includes("Error")) {
                    document.getElementById("output").innerText = currentOutput + 
                        `\n\n💡 Features active:\n✓ Natural language understanding\n✓ Auto-save after 10 seconds\n✓ Enhanced error handling\n⏳ Watch for toast notifications`;
                }
            }, 2000);

            setTimeout(() => {
                window.close();
            }, 8000);

        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }

    } catch (ex) {
        showOutput(`❌ Error: ${ex?.message}`);
        console.error("Enhanced popup error:", ex);
    }
});

/**
 * Enhanced sequential instruction detection
 */
function detectSequentialInstruction(instruction) {
    const lowerInstruction = instruction.toLowerCase();
    
    const stepPatterns = [
        /step\s*\d+/g,
        /\d+\.\s*\w+/g,
        /first.*then.*finally/i,
        /step\s*one.*step\s*two/i,
        /(create|make|add).*then.*(create|make|add)/i,
        /(create|make|add).*and.*(create|make|add)/i
    ];
    
    return stepPatterns.some(pattern => pattern.test(lowerInstruction));
}

async function getPageContext(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, {
            action: 'getPageContext'
        }, (response) => {
            if (chrome.runtime.lastError) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }, () => {
                    if (chrome.runtime.lastError) {
                        resolve(getDefaultContext());
                        return;
                    }

                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, {
                            action: 'getPageContext'
                        }, (response) => {
                            resolve(response || getDefaultContext());
                        });
                    }, 1000);
                });
            } else {
                resolve(response || getDefaultContext());
            }
        });
    });
}

function getDefaultContext() {
    return {
        url: 'Unknown',
        title: 'Salesforce',
        isLoggedIn: true,
        currentObject: null,
        availableObjects: [],
        currentFormFields: [],
        recordContext: {}
    };
}

async function generateAndExecuteSteps(instruction, pageContext, tabId) {
    try {
        console.log("Enhanced step generation for:", instruction);
        
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'generateAutomationSteps',
                data: { 
                    instruction, 
                    pageContext,
                    tabId
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.success) {
                    console.log("Enhanced step generation completed:", response.data);
                    resolve(response.data);
                } else {
                    console.error("Step generation failed:", response);
                    reject(new Error(response ? response.error : 'Unknown error'));
                }
            });
        });

        return response;

    } catch (ex) {
        console.error("Error in enhanced generateAndExecuteSteps:", ex);
        throw new Error(`Enhanced step generation failed: ${ex?.message}`);
    }
}

function showOutput(message) {
    const outputEl = document.getElementById("output");
    outputEl.innerText = message;
    outputEl.style.display = "block";
}

function startProgressTracking() {
    let dots = '';
    let counter = 0;
    
    const progressInterval = setInterval(() => {
        counter++;
        dots = '.'.repeat((counter % 4) + 1);
        
        const outputEl = document.getElementById("output");
        if (outputEl && outputEl.innerText.includes("running")) {
            const lines = outputEl.innerText.split('\n');
            const runningLine = lines.find(line => line.includes("running"));
            if (runningLine) {
                const baseText = runningLine.split('🎯')[0];
                lines[lines.findIndex(line => line.includes("running"))] = 
                    `${baseText}🎯 Enhanced automation running${dots}`;
                outputEl.innerText = lines.join('\n');
            }
        }
        
        if (counter > 35) {
            clearInterval(progressInterval);
        }
    }, 800);
}

document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("processBtn").click();
    }
});

// Enhanced popup with natural language examples and auto-save features
document.addEventListener("DOMContentLoaded", function() {
    const inputField = document.getElementById("userInput");
    if (inputField) {
        inputField.placeholder = "Enter natural language instructions...\n\nExamples:\n• Create an account for Acme Corp\n• Add a contact to this account\n• Make a new opportunity for $50,000\n• Step1: Create account, Step2: Add related contact";
    }
    
    const container = document.querySelector(".container") || document.body;
    
    const quickActionsDiv = document.createElement("div");
    quickActionsDiv.innerHTML = `
        <div style="margin: 15px 0; text-align: center;">
            <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: bold;">
                ⚡ Enhanced Quick Actions:
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; margin-bottom: 8px;">
                <button class="quick-btn" data-action="Create an account">📊 Create Account</button>
                <button class="quick-btn" data-action="Add a contact">👤 Add Contact</button>
                <button class="quick-btn" data-action="Make a new opportunity">💼 New Opportunity</button>
            </div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap; justify-content: center;">
                <button class="quick-btn sequential" data-action="Step1: Create account, Step2: Add related contact">🔗 Account + Contact</button>
                <button class="quick-btn sequential" data-action="Create account then make opportunity for 75000">⚡ Natural Sequence</button>
            </div>
        </div>
        
        <div style="margin: 10px 0; padding: 12px; background: linear-gradient(135deg, #e8f5ff, #f0f8ff); border-radius: 8px; border: 1px solid #b3d9ff;">
            <div style="font-size: 11px; color: #1a5490; line-height: 1.4;">
                <div style="font-weight: bold; margin-bottom: 6px; color: #1a73e8;">
                    🧠 NEW: Advanced Natural Language Processing
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="color: #34a853; font-weight: bold; margin-right: 6px;">✓</span>
                    <span>Understands intent behind instructions</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="color: #34a853; font-weight: bold; margin-right: 6px;">✓</span>
                    <span>Auto-save after 10 seconds if manual save not detected</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="color: #34a853; font-weight: bold; margin-right: 6px;">✓</span>
                    <span>Enhanced error handling and recovery</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <span style="color: #34a853; font-weight: bold; margin-right: 6px;">✓</span>
                    <span>Smart context awareness for related records</span>
                </div>
            </div>
        </div>

        <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #4285f4;">
            <div style="font-size: 11px; color: #333; line-height: 1.3;">
                <div style="font-weight: bold; margin-bottom: 4px; color: #1a73e8;">
                    💬 Natural Language Examples:
                </div>
                <div style="margin-bottom: 2px;">• "Create an account for Microsoft"</div>
                <div style="margin-bottom: 2px;">• "Add a contact to this account"</div>
                <div style="margin-bottom: 2px;">• "Make a new opportunity for $100,000"</div>
                <div style="margin-bottom: 2px;">• "Create case for technical support"</div>
                <div>• "Navigate to leads and create new lead"</div>
            </div>
        </div>
        
        <div style="margin: 10px 0; padding: 8px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
            <div style="font-size: 10px; color: #856404; text-align: center; line-height: 1.3;">
                <strong>⚡ Auto-Save:</strong> Waits 10 seconds for manual save, then automatically saves if needed
            </div>
        </div>
        
        <div style="margin: 10px 0; padding: 8px; background: #e8f4fd; border-radius: 6px; border: 1px solid #b3daff;">
            <div style="font-size: 10px; color: #1565c0; text-align: center; line-height: 1.3;">
                <strong>🧠 Smart Analysis:</strong> Understands context and intent behind natural language instructions
            </div>
        </div>
        
        <div style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">
            <div>🤖 <strong>Powered by Enhanced AI</strong></div>
            <div>Natural language processing with auto-save functionality</div>
        </div>
    `;
    
    const processBtn = document.getElementById("processBtn");
    processBtn.parentNode.insertBefore(quickActionsDiv, processBtn);
    
    // Enhanced event listeners for quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            document.getElementById('userInput').value = action;
            
            if (this.classList.contains('sequential')) {
                showQuickToast('🔄 Sequential natural language processing!', 2000);
            } else {
                showQuickToast('🧠 Natural language analysis activated!', 2000);
            }
            
            document.getElementById('processBtn').click();
        });
    });
});

function showQuickToast(message, duration) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: linear-gradient(135deg, #667eea, #764ba2); color: white; 
        padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
            if (style.parentNode) style.parentNode.removeChild(style);
        }, 300);
    }, duration);
}

// Enhanced styling for natural language processing theme
document.addEventListener("DOMContentLoaded", function() {
    const style = document.createElement('style');
    style.textContent = `
        .quick-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; border-radius: 15px;
            padding: 6px 10px; font-size: 10px; cursor: pointer;
            transition: all 0.3s ease; font-weight: 500;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        }
        
        .quick-btn.sequential {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            font-weight: 600; border: 2px solid rgba(255, 255, 255, 0.3);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .quick-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .quick-btn.sequential:hover {
            box-shadow: 0 4px 12px rgba(17, 153, 142, 0.4);
            animation: none;
        }
        
        #userInput {
            transition: all 0.3s ease; border: 2px solid #e0e0e0;
            min-height: 65px; border-radius: 8px;
            font-family: system-ui, sans-serif;
        }
        
        #userInput:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            transform: scale(1.02);
        }
        
        #output {
            font-size: 11px; line-height: 1.5; max-height: 160px;
            overflow-y: auto; border-radius: 8px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #dee2e6;
        }
        
        #processBtn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
            border-radius: 8px; font-size: 13px;
        }
        
        #processBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .container {
            max-width: 390px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
    `;
    document.head.appendChild(style);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    const outputEl = document.getElementById("output");
    if (outputEl) {
        outputEl.innerText = `❌ Unexpected error: ${event.reason}`;
        outputEl.style.display = "block";
    }
});

console.log("✅ Enhanced popup loaded with natural language processing and auto-save features");
