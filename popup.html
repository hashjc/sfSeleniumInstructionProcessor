// HYBRID POPUP SCRIPT - Automation + Intelligent Autofill Interface
console.log("🚀 HYBRID POPUP: Advanced automation + autofill interface starting...");

let automationInProgress = false;

document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 HYBRID POPUP: DOM loaded, initializing hybrid interface...");
    
    setupHybridEventListeners();
    testHybridBackgroundConnection();
    setupHybridQuickActions();
    updateInterfaceForCurrentPage();
});

function setupHybridEventListeners() {
    console.log("⚡ HYBRID SETUP: Adding hybrid event listeners...");
    
    const processBtn = document.getElementById("processBtn");
    if (processBtn) {
        processBtn.addEventListener("click", handleHybridProcessClick);
        console.log("⚡ HYBRID SETUP: Process button listener added");
    } else {
        console.error("⚡ HYBRID SETUP: ❌ Process button not found");
    }

    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter" && event.ctrlKey) {
                event.preventDefault();
                if (!automationInProgress) {
                    handleHybridProcessClick();
                }
            }
        });
        
        // Enhanced placeholder for hybrid functionality
        userInput.placeholder = `🚀 Describe what you want to create or autofill:

AUTOMATION EXAMPLES:
• "Create a new Account for technology company"
• "Create Account and related Contact"
• "Navigate to Contact and create new record"

AUTOFILL EXAMPLES:
• "Fill this form with realistic data"
• "Autofill all fields for healthcare company"
• "Complete this form with manufacturing data"

Gemini will either execute automation OR intelligently autofill current form!`;
        
        console.log("⚡ HYBRID SETUP: Input listener added");
    }
}

function setupHybridQuickActions() {
    const quickActions = [
        {
            emoji: "🏢➕👤",
            title: "Account + Contact",
            description: "Create Account then related Contact",
            instruction: "Create a new Account for a technology company and then create a related Contact"
        },
        {
            emoji: "🏢➕💼",
            title: "Account + Opportunity", 
            description: "Create Account then related Opportunity",
            instruction: "Create a new Account for a business company and then create a related Opportunity"
        },
        {
            emoji: "👤➕💼",
            title: "Contact + Opportunity",
            description: "Create Contact then related Opportunity", 
            instruction: "Create a new Contact for a professional person and then create a related Opportunity"
        },
        {
            emoji: "✨", 
            title: "Smart Autofill Form",
            description: "Fill current form intelligently",
            instruction: "Analyze this form and fill all fields with intelligent, realistic business data appropriate for the form type"
        },
        {
            emoji: "🏢",
            title: "Single Account", 
            description: "Create Account only",
            instruction: "Create a technology company Account with complete business information"
        },
        {
            emoji: "👤",
            title: "Single Contact",
            description: "Create Contact only", 
            instruction: "Create a professional Contact with complete personal and business details"
        },
        {
            emoji: "💼",
            title: "Single Opportunity",
            description: "Create Opportunity only",
            instruction: "Create a sales Opportunity with complete deal information"
        },
        {
            emoji: "🎯",
            title: "Lead Generation",
            description: "Create Lead record",
            instruction: "Create a new Lead for potential customer with complete qualification details"
        },
        {
            emoji: "📋➕👤",
            title: "Lead + Task",
            description: "Create Lead then related Task",
            instruction: "Create a new Lead for business prospect and then create a related follow-up Task"
        },
        {
            emoji: "🆘➕📞",
            title: "Account + Case", 
            description: "Create Account then related Case",
            instruction: "Create a customer Account and then create a related support Case"
        },
        {
            emoji: "🏥",
            title: "Healthcare Account + Contact",
            description: "Healthcare industry workflow",
            instruction: "Create a healthcare organization Account with medical services focus and then create a related healthcare Contact"
        },
        {
            emoji: "🏭",
            title: "Manufacturing Account + Opportunity",
            description: "Manufacturing industry workflow", 
            instruction: "Create a manufacturing company Account with industrial focus and then create a related manufacturing Opportunity"
        }
    ];
    
    const quickActionsContainer = document.querySelector('.quick-actions, #quickActions');
    if (quickActionsContainer) {
        quickActionsContainer.innerHTML = '';
        quickActionsContainer.style.display = 'grid';
        quickActionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 columns for more actions
        quickActionsContainer.style.gap = '8px';
        quickActionsContainer.style.marginBottom = '20px';
        quickActionsContainer.style.maxHeight = '300px';
        quickActionsContainer.style.overflowY = 'auto';
        
        quickActions.forEach((action, index) => {
            const actionCard = document.createElement('div');
            actionCard.className = 'hybrid-quick-action-card';
            actionCard.style.cssText = `
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border: 2px solid #dee2e6;
                border-radius: 8px;
                padding: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                position: relative;
                overflow: hidden;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            `;
            
            // Special styling for parent-child workflows
            if (action.instruction.includes('related') || action.instruction.includes('then')) {
                actionCard.style.border = '2px solid #28a745';
                actionCard.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
            }
            
            actionCard.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 4px;">${action.emoji}</div>
                <div style="font-weight: 600; margin-bottom: 2px; color: #495057; font-size: 11px; line-height: 1.2;">${action.title}</div>
                <div style="font-size: 9px; color: #6c757d; line-height: 1.2;">${action.description}</div>
            `;
            
            actionCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                if (action.instruction.includes('related') || action.instruction.includes('then')) {
                    this.style.borderColor = '#28a745';
                    this.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                } else {
                    this.style.borderColor = '#667eea';
                    this.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                }
                this.style.color = 'white';
                this.querySelectorAll('div').forEach(div => div.style.color = 'white');
            });
            
            actionCard.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
                if (action.instruction.includes('related') || action.instruction.includes('then')) {
                    this.style.borderColor = '#28a745';
                    this.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                } else {
                    this.style.borderColor = '#dee2e6';
                    this.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
                }
                this.style.color = '';
                this.querySelectorAll('div')[1].style.color = '#495057';
                this.querySelectorAll('div')[2].style.color = '#6c757d';
            });
            
            actionCard.addEventListener('click', function() {
                if (!automationInProgress) {
                    document.getElementById('userInput').value = action.instruction;
                    
                    // Enhanced visual feedback for parent-child workflows
                    if (action.instruction.includes('related') || action.instruction.includes('then')) {
                        this.style.background = '#28a745';
                        this.innerHTML = `
                            <div style="font-size: 20px; margin-bottom: 6px;">🔗</div>
                            <div style="font-weight: 600; color: white;">Parent-Child Workflow</div>
                            <div style="font-size: 10px; color: white;">Processing...</div>
                        `;
                    } else {
                        this.style.background = '#007bff';
                        this.innerHTML = `
                            <div style="font-size: 20px; margin-bottom: 6px;">⚡</div>
                            <div style="font-weight: 600; color: white;">Processing...</div>
                        `;
                    }
                    
                    setTimeout(() => {
                        handleHybridProcessClick();
                    }, 500);
                }
            });
            
            quickActionsContainer.appendChild(actionCard);
        });
        
        console.log("⚡ HYBRID SETUP: Enhanced quick actions with parent-child workflows configured");
    }
}

async function testHybridBackgroundConnection() {
    console.log("🔗 HYBRID TEST: Testing background connection...");
    
    try {
        const response = await sendHybridMessage({ type: "getStatus" });
        console.log("🔗 HYBRID TEST: ✅ Background responded:", response);
        updateHybridStatus("✅ Hybrid Gemini AI ready - Automation + Autofill available", "success");
    } catch (error) {
        console.error("🔗 HYBRID TEST: ❌ Background connection failed:", error);
        updateHybridStatus("❌ Background script error - Reload extension", "error");
    }
}

async function updateInterfaceForCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        
        const statusElement = document.getElementById('pageStatus');
        if (statusElement) {
            if (url.includes('salesforce.com') || url.includes('force.com') || url.includes('.lightning.force.com')) {
                if (url.includes('/new') || url.includes('/edit')) {
                    statusElement.innerHTML = '🎯 <strong>Form Detected!</strong> Ready for intelligent autofill or automation';
                    statusElement.style.color = '#28a745';
                    statusElement.style.background = '#e6ffe6';
                } else if (url.includes('/list')) {
                    statusElement.innerHTML = '📋 <strong>List View</strong> - Ready to create new records';
                    statusElement.style.color = '#007bff';
                    statusElement.style.background = '#e6f3ff';
                } else {
                    statusElement.innerHTML = '🏠 <strong>Salesforce Home</strong> - Use automation to navigate and create';
                    statusElement.style.color = '#6f42c1';
                    statusElement.style.background = '#f3e5f5';
                }
            } else {
                statusElement.innerHTML = '⚠️ Please navigate to a Salesforce org first';
                statusElement.style.color = '#ffc107';
                statusElement.style.background = '#fff9e6';
            }
            statusElement.style.padding = '10px 12px';
            statusElement.style.borderRadius = '8px';
            statusElement.style.marginBottom = '15px';
            statusElement.style.fontSize = '12px';
            statusElement.style.fontWeight = '500';
            statusElement.style.border = '2px solid';
            statusElement.style.borderColor = statusElement.style.color;
        }
    } catch (error) {
        console.log("Could not update interface for current page:", error);
    }
}

async function handleHybridProcessClick() {
    console.log("🚀 HYBRID PROCESS: Button clicked");
    
    const instruction = document.getElementById("userInput").value.trim();
    console.log("🚀 HYBRID PROCESS: Instruction:", instruction);

    if (!instruction) {
        alert("Please enter an instruction for Gemini AI automation or autofill");
        return;
    }

    if (automationInProgress) {
        alert("Hybrid automation already in progress");
        return;
    }

    // Validate Salesforce environment
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const isSalesforce = url.includes('salesforce.com') || 
                        url.includes('force.com') || 
                        url.includes('.lightning.force.com');

    if (!isSalesforce) {
        alert("Please navigate to a Salesforce org first");
        return;
    }

    try {
        automationInProgress = true;
        disableHybridControls();
        showHybridStatusPanel();
        updateHybridStatus("🧠 Gemini AI: Analyzing instruction and page context...", "processing");
        updateHybridProgress(10);

        console.log("🚀 HYBRID PROCESS: Getting page context...");
        updateHybridStatus("🔍 Analyzing current Salesforce page...", "processing");
        updateHybridProgress(30);
        
        const pageContext = await getHybridPageContext(tab.id);
        console.log("🚀 HYBRID PROCESS: Page context:", pageContext);

        updateHybridStatus("🤖 Gemini AI: Determining automation strategy...", "processing");
        updateHybridProgress(50);

        const result = await sendHybridMessage({
            action: 'executeDynamicAIAutomation',
            data: { 
                instruction: instruction,
                pageContext: pageContext,
                tabId: tab.id,
                timestamp: Date.now()
            }
        });

        console.log("🚀 HYBRID PROCESS: Result:", result);

        if (result && result.success) {
            if (result.data.type === 'autofill_only') {
                updateHybridStatus("✨ Intelligent autofill completed successfully!", "success");
                updateHybridProgress(100);
                updateHybridStepCounter(result.data.fieldsFilled, result.data.fieldsAnalyzed);
                
                setTimeout(() => {
                    resetHybridState();
                }, 3000);
                
            } else {
                updateHybridStatus("🚀 Executing automation workflow...", "processing");
                updateHybridProgress(80);
                
                setTimeout(() => {
                    updateHybridStatus(`🎯 Running ${result.data.instructionsCount} automation steps...`, "processing");
                    updateHybridProgress(95);
                }, 2000);
            }
            
        } else {
            throw new Error(result?.error || 'Hybrid automation generation failed');
        }

    } catch (error) {
        console.error("🚀 HYBRID PROCESS: ❌ Error:", error);
        updateHybridStatus(`❌ Error: ${error.message}`, "error");
        showHybridNotification(`Error: ${error.message}`, "error");
        resetHybridState();
    }
}

async function getHybridPageContext(tabId) {
    console.log("🔍 HYBRID CONTEXT: Getting page context for tab:", tabId);
    
    try {
        const result = await new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    return {
                        url: window.location.href,
                        title: document.title,
                        isLoggedIn: !document.querySelector('.loginContainer, .login'),
                        hasForm: !!document.querySelector('.recordEditContainer, .slds-form, lightning-record-edit-form, form'),
                        isNewPage: window.location.href.includes('/new'),
                        isEditPage: window.location.href.includes('/edit'),
                        isListPage: window.location.href.includes('/list'),
                        isHomePage: window.location.href.includes('/home'),
                        formFieldCount: document.querySelectorAll('input:not([type="hidden"]), textarea, select').length,
                        timestamp: new Date().toISOString()
                    };
                }
            }, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result[0].result);
                }
            });
        });
        
        console.log("🔍 HYBRID CONTEXT: ✅ Context retrieved");
        return result;
        
    } catch (error) {
        console.error("🔍 HYBRID CONTEXT: ❌ Failed:", error);
        return {
            url: 'Unknown',
            title: 'Salesforce',
            isLoggedIn: true,
            hasForm: false,
            timestamp: new Date().toISOString()
        };
    }
}

async function sendHybridMessage(message, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        } catch (error) {
            console.error(`📤 HYBRID MESSAGE: Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await sleep(1000);
        }
    }
}

function disableHybridControls() {
    const processBtn = document.getElementById("processBtn");
    if (processBtn) {
        processBtn.disabled = true;
        processBtn.textContent = "🧠 Processing...";
        processBtn.style.opacity = "0.7";
    }
    
    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.disabled = true;
        userInput.style.opacity = "0.7";
    }
    
    const quickCards = document.querySelectorAll('.hybrid-quick-action-card');
    quickCards.forEach(card => {
        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";
    });
    
    console.log("🔒 HYBRID CONTROLS: Disabled");
}

function enableHybridControls() {
    const processBtn = document.getElementById("processBtn");
    if (processBtn) {
        processBtn.disabled = false;
        processBtn.textContent = "🚀 Execute Automation or Autofill";
        processBtn.style.opacity = "1";
    }
    
    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.disabled = false;
        userInput.style.opacity = "1";
    }
    
    const quickCards = document.querySelectorAll('.hybrid-quick-action-card');
    quickCards.forEach(card => {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
    });
    
    console.log("🔓 HYBRID CONTROLS: Enabled");
}

function showHybridStatusPanel() {
    const statusPanel = document.getElementById('advancedStatusPanel');
    if (statusPanel) {
        statusPanel.style.display = 'block';
    }
}

function hideHybridStatusPanel() {
    const statusPanel = document.getElementById('advancedStatusPanel');
    if (statusPanel) {
        statusPanel.style.display = 'none';
    }
}

function updateHybridStatus(message, type = 'info') {
    console.log("📊 HYBRID STATUS:", message);
    
    const statusMessage = document.getElementById('statusMessage');
    const statusIcon = document.getElementById('statusIcon');
    
    if (statusMessage) {
        statusMessage.textContent = message;
        
        switch (type) {
            case 'success':
                statusMessage.style.color = '#28a745';
                if (statusIcon) statusIcon.textContent = '✅';
                break;
            case 'error':
                statusMessage.style.color = '#dc3545';
                if (statusIcon) statusIcon.textContent = '❌';
                break;
            case 'processing':
                statusMessage.style.color = '#007bff';
                if (statusIcon) statusIcon.textContent = '🧠';
                break;
            default:
                statusMessage.style.color = '#6c757d';
                if (statusIcon) statusIcon.textContent = '🚀';
        }
    }
}

function updateHybridProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = Math.min(percentage, 100) + '%';
    }
}

function updateHybridStepCounter(step, total) {
    const stepCounter = document.getElementById('stepCounter');
    if (stepCounter) {
        if (total > 0) {
            stepCounter.textContent = `Completed ${step} of ${total} fields`;
        } else {
            stepCounter.textContent = `Step ${step} completed`;
        }
    }
}

function showHybridNotification(message, type = 'info') {
    if (type === 'error') {
        alert('Error: ' + message);
    } else {
        console.log('HYBRID NOTIFICATION:', message);
    }
}

function resetHybridState() {
    console.log("🔄 HYBRID RESET: Resetting state");
    
    automationInProgress = false;
    enableHybridControls();
    updateHybridProgress(0);
    updateHybridStatus("🚀 Ready for automation or intelligent autofill", "info");
    
    setTimeout(() => {
        hideHybridStatusPanel();
    }, 3000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 HYBRID MESSAGE: Received:", message);
    
    switch (message.type) {
        case 'AUTOMATION_COMPLETE':
            console.log("🎉 HYBRID COMPLETE: Automation finished");
            const completionInfo = message.fieldsCompleted ? 
                ` (${message.fieldsCompleted}/${message.totalFields} fields)` : '';
            updateHybridStatus(`🎉 Hybrid automation completed successfully!${completionInfo}`, "success");
            updateHybridProgress(100);
            resetHybridState();
            showHybridNotification("Hybrid automation completed successfully!", "success");
            break;
            
        case 'AUTOMATION_ERROR':
            console.error("💥 HYBRID ERROR: Automation failed:", message.error);
            updateHybridStatus(`❌ Error: ${message.error}`, "error");
            showHybridNotification(`Automation failed: ${message.error}`, "error");
            resetHybridState();
            break;
            
        case 'statusUpdate':
            if (message.message && automationInProgress) {
                updateHybridStatus(message.message, "processing");
                
                // Update progress based on status message keywords
                if (message.message.includes('Analyzing')) {
                    updateHybridProgress(40);
                } else if (message.message.includes('Generating')) {
                    updateHybridProgress(70);
                } else if (message.message.includes('Executing') || message.message.includes('Filling')) {
                    updateHybridProgress(90);
                }
            }
            break;
    }
});

// Global error handling
window.addEventListener('error', function(event) {
    console.error('🚨 HYBRID GLOBAL ERROR:', event.error);
    if (automationInProgress) {
        updateHybridStatus('❌ Unexpected error occurred', "error");
        resetHybridState();
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 HYBRID UNHANDLED REJECTION:', event.reason);
    if (automationInProgress) {
        updateHybridStatus('❌ Promise rejection error', "error");
        resetHybridState();
    }
});

console.log("🚀 HYBRID POPUP: ✅ Advanced hybrid interface loaded successfully");
