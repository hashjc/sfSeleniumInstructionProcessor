// Enhanced popup.js with REAL-TIME progress tracking and PERSISTENT MODAL

// Global variables for progress tracking
let currentSteps = [];
let completedSteps = 0;
let totalSteps = 0;
let progressListenerActive = false;
let automationInProgress = false; // NEW: Track if automation is actively running

document.getElementById("processBtn").addEventListener("click", async () => {
    const instruction = document.getElementById("userInput").value;

    if (!instruction) return alert("Please enter an instruction.");

    // Prevent multiple simultaneous executions
    if (automationInProgress) {
        alert("Automation is already running. Please wait for it to complete.");
        return;
    }

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = tab.url;
    const isSalesforceOrg = url.includes('salesforce.com') || 
                            url.includes('force.com') || 
                            url.includes('.lightning.force.com') ||
                            url.includes('my.salesforce.com');

    if (!isSalesforceOrg) {
        alert("Please navigate to a Salesforce org first.");
        return;
    }

    try {
        // Mark automation as started
        automationInProgress = true;
        
        // Switch to progress modal
        showProgressModal();
        
        // Initialize progress tracking
        initializeProgressTracking(instruction);

        const pageContext = await getPageContext(tab.id);
        
        if (!pageContext.isLoggedIn) {
            showError("Please log into Salesforce first.");
            return;
        }

        updateProgressSubtitle("Analyzing natural language instruction...");
        
        // Enhanced analysis display
        const isSequential = detectSequentialInstruction(instruction);
        
        if (isSequential) {
            updateProgressSubtitle("Sequential automation detected! Processing multiple steps...");
        } else {
            updateProgressSubtitle(`Context: ${pageContext.currentObject || 'Home'} page - Generating automation...`);
        }

        const result = await generateAndExecuteSteps(instruction, pageContext, tab.id);
        
        if (result.success) {
            // Update steps based on result
            if (result.steps && result.steps.length > 0) {
                updateStepsFromResult(result.steps);
            }
            
            // Start REAL automation execution with progress tracking
            executeStepsWithProgress(result);
            
        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }

    } catch (ex) {
        showError(`Error: ${ex?.message}`);
        console.error("Enhanced popup error:", ex);
        automationInProgress = false; // Reset on error
    }
});

/**
 * Show the progress modal and hide instruction modal
 */
function showProgressModal() {
    const instructionModal = document.getElementById("instructionModal");
    const progressModal = document.getElementById("progressModal");
    
    instructionModal.classList.add("hidden");
    progressModal.classList.add("show");
    
    // CRITICAL: Disable any buttons that might interfere with progress
    disableUIInteractions();
}

/**
 * Disable UI interactions during automation to prevent accidental closure
 */
function disableUIInteractions() {
    console.log('🔒 ENHANCED: Disabling UI interactions during automation');
    
    // Prevent clicks outside modal from affecting anything
    document.addEventListener('click', preventClickDuringAutomation, true);
    document.addEventListener('keydown', preventKeysDuringAutomation, true);
    
    // Mark modal as protected
    const progressModal = document.getElementById("progressModal");
    if (progressModal) {
        progressModal.style.pointerEvents = 'auto'; // Ensure modal itself is interactive
        progressModal.dataset.automationActive = 'true';
    }
}

/**
 * Prevent clicks during automation except within the progress modal
 */
function preventClickDuringAutomation(event) {
    if (!automationInProgress) return;
    
    const progressModal = document.getElementById("progressModal");
    const completionMessage = document.getElementById("completionMessage");
    
    // Allow clicks within completion message
    if (completionMessage && completionMessage.classList.contains('show') && 
        completionMessage.contains(event.target)) {
        return;
    }
    
    // Allow clicks within progress modal but prevent others
    if (!progressModal || !progressModal.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Show warning
        showAutomationWarning();
        return false;
    }
}

/**
 * Prevent keyboard shortcuts during automation
 */
function preventKeysDuringAutomation(event) {
    if (!automationInProgress) return;
    
    // Allow Escape only when automation is complete
    if (event.key === 'Escape' && (completedSteps < totalSteps)) {
        event.preventDefault();
        event.stopPropagation();
        showAutomationWarning();
        return false;
    }
}

/**
 * Show warning when user tries to interact during automation
 */
function showAutomationWarning() {
    const warningElement = document.getElementById("automationWarning");
    if (warningElement) {
        warningElement.style.display = "block";
        warningElement.style.animation = "pulse 0.5s ease-in-out";
        
        setTimeout(() => {
            if (warningElement.style.animation) {
                warningElement.style.animation = "";
            }
        }, 500);
    }
}

/**
 * Initialize progress tracking with sample steps
 */
function initializeProgressTracking(instruction) {
    currentSteps = [];
    completedSteps = 0;
    
    // Generate sample steps based on instruction
    const steps = generateSampleSteps(instruction);
    totalSteps = steps.length;
    
    // Clear and populate steps container
    const stepsContainer = document.getElementById("stepsContainer");
    stepsContainer.innerHTML = "";
    
    steps.forEach((step, index) => {
        const stepElement = createStepElement(step, index);
        stepsContainer.appendChild(stepElement);
        currentSteps.push({
            element: stepElement,
            text: step,
            status: 'pending'
        });
    });
    
    updateOverallProgress();
}

/**
 * Generate sample steps based on instruction
 */
function generateSampleSteps(instruction) {
    const lowerInstruction = instruction.toLowerCase();
    
    // Check for sequential patterns
    if (detectSequentialInstruction(instruction)) {
        if (lowerInstruction.includes('account') && lowerInstruction.includes('contact')) {
            return [
                "🧠 Analyzing natural language instruction",
                "🔍 Detecting Salesforce page context",
                "📊 Creating new Account record",
                "👤 Creating Contact for the Account",
                "🔗 Linking Contact to Account",
                "💾 Auto-saving changes",
                "✅ Validating record creation"
            ];
        }
    }
    
    // Single action steps
    if (lowerInstruction.includes('account')) {
        return [
            "🧠 Processing natural language",
            "🔍 Analyzing page context",
            "📊 Creating Account record",
            "📝 Filling required fields",
            "💾 Saving record",
            "✅ Validation complete"
        ];
    } else if (lowerInstruction.includes('contact')) {
        return [
            "🧠 Understanding instruction",
            "🔍 Locating Contact form",
            "👤 Creating Contact record",
            "📝 Populating contact fields",
            "💾 Saving contact",
            "✅ Contact created successfully"
        ];
    } else if (lowerInstruction.includes('opportunity')) {
        return [
            "🧠 Analyzing instruction",
            "🔍 Finding Opportunity page",
            "💼 Creating Opportunity",
            "💰 Setting opportunity amount",
            "📅 Setting close date",
            "💾 Saving opportunity",
            "✅ Opportunity created"
        ];
    }
    
    // Default generic steps
    return [
        "🧠 Processing natural language instruction",
        "🔍 Analyzing Salesforce context",
        "⚙️ Generating automation code",
        "🚀 Executing automation",
        "💾 Saving changes",
        "✅ Automation complete"
    ];
}

/**
 * Create a step element
 */
function createStepElement(stepText, index) {
    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.innerHTML = `
        <div class="step-icon">
            <div class="step-pending">${index + 1}</div>
        </div>
        <div class="step-text">${stepText}</div>
    `;
    return stepDiv;
}

/**
 * Update steps from automation result
 */
function updateStepsFromResult(steps) {
    // If the backend provides actual steps, update our display
    if (steps && steps.length > 0) {
        // Clear current steps and create new ones
        currentSteps = [];
        completedSteps = 0;
        totalSteps = steps.length;
        
        const stepsContainer = document.getElementById("stepsContainer");
        stepsContainer.innerHTML = "";
        
        steps.forEach((step, index) => {
            const stepElement = createStepElement(step.description || step.name || `Step ${index + 1}`, index);
            stepsContainer.appendChild(stepElement);
            currentSteps.push({
                element: stepElement,
                text: step.description || step.name || `Step ${index + 1}`,
                status: 'pending'
            });
        });
        
        updateOverallProgress();
    }
}

/**
 * Execute steps with REAL progress tracking
 */
async function executeStepsWithProgress(result) {
    updateProgressSubtitle("Executing automation steps...");
    
    // Show automation warning
    const warningElement = document.getElementById("automationWarning");
    if (warningElement) {
        warningElement.style.display = "block";
    }
    
    // Set up real-time progress listener
    setupProgressListener();
    
    // Start the actual automation execution
    // The progress will be updated by real events from content script
    console.log('🚀 ENHANCED: Starting real automation execution...');
    
    // Show initial status
    updateProgressSubtitle("Automation started - waiting for step updates...");
}

/**
 * Get execution time for different step types
 */
function getStepExecutionTime(stepText) {
    const text = stepText.toLowerCase();
    
    if (text.includes('analyzing') || text.includes('processing')) {
        return 1500; // 1.5 seconds for analysis
    } else if (text.includes('creating') || text.includes('saving')) {
        return 2500; // 2.5 seconds for creation/saving
    } else if (text.includes('filling') || text.includes('populating')) {
        return 2000; // 2 seconds for form filling
    } else {
        return 1000; // Default 1 second
    }
}

/**
 * Update overall progress bar
 */
function updateOverallProgress() {
    const progressFill = document.getElementById("overallProgressFill");
    const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
}

/**
 * Update progress subtitle
 */
function updateProgressSubtitle(text) {
    const subtitle = document.getElementById("progressSubtitle");
    subtitle.textContent = text;
}

/**
 * Show completion message and hide steps
 */
function showCompletionMessage() {
    updateProgressSubtitle("All automation steps completed successfully!");
    updateOverallProgress(); // Ensure 100%
    
    // Hide automation warning
    const warningElement = document.getElementById("automationWarning");
    if (warningElement) {
        warningElement.style.display = "none";
    }
    
    const stepsContainer = document.getElementById("stepsContainer");
    const completionMessage = document.getElementById("completionMessage");
    
    // Hide steps container and show completion message
    stepsContainer.style.display = "none";
    completionMessage.classList.add("show");
    
    // Start countdown timer
    let countdown = 10;
    const countdownElement = document.getElementById("countdownTimer");
    
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.close();
        }
    }, 1000);
    
    // Store interval ID so it can be cleared if user closes manually
    window.completionCountdownInterval = countdownInterval;
}

/**
 * Show error message
 */
function showError(message) {
    updateProgressSubtitle(`❌ ${message}`);
    
    // Don't close window immediately on error - let user see the error
    console.error('ENHANCED: Error occurred:', message);
}

/**
 * Sleep function for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Set up real-time progress listener
 */
function setupProgressListener() {
    if (progressListenerActive) {
        console.log('📡 ENHANCED: Progress listener already active');
        return;
    }
    
    console.log('📡 ENHANCED: Setting up real-time progress listener...');
    progressListenerActive = true;
    
    // Listen for progress updates from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'STEP_PROGRESS') {
            handleRealStepProgress(message.data);
        } else if (message.type === 'STEP_ERROR') {
            handleStepError(message.data);
        } else if (message.type === 'AUTOMATION_COMPLETE') {
            handleAutomationComplete();
        }
    });
}

/**
 * Handle real step progress updates
 */
function handleRealStepProgress(data) {
    const { stepIndex, stepDescription, status } = data;
    
    console.log(`📊 ENHANCED: Real progress update - Step ${stepIndex + 1}: ${status}`);
    
    if (stepIndex < currentSteps.length) {
        const step = currentSteps[stepIndex];
        
        if (status === 'started') {
            // Mark step as executing
            step.status = 'executing';
            step.element.classList.remove('completed', 'error');
            step.element.classList.add('executing');
            step.element.querySelector('.step-icon').innerHTML = '<div class="step-spinner"></div>';
            
            updateProgressSubtitle(`Executing: ${stepDescription}`);
            
        } else if (status === 'completed') {
            // Mark step as completed
            step.status = 'completed';
            step.element.classList.remove('executing', 'error');
            step.element.classList.add('completed');
            step.element.querySelector('.step-icon').innerHTML = '<div class="step-check">✓</div>';
            
            completedSteps++;
            updateOverallProgress();
            updateProgressSubtitle(`Step ${stepIndex + 1} of ${totalSteps} completed`);
        }
    }
}

/**
 * Handle step errors
 */
function handleStepError(data) {
    const { stepIndex, error } = data;
    
    console.error(`❌ ENHANCED: Step ${stepIndex + 1} failed:`, error);
    
    if (stepIndex < currentSteps.length) {
        const step = currentSteps[stepIndex];
        step.status = 'error';
        step.element.classList.remove('executing', 'completed');
        step.element.classList.add('error');
        step.element.querySelector('.step-icon').innerHTML = '<div class="step-error">!</div>';
        
        updateProgressSubtitle(`❌ Error in step ${stepIndex + 1}: ${error}`);
    }
}

/**
 * Handle automation completion
 */
function handleAutomationComplete() {
    console.log('🎉 ENHANCED: Automation completed!');
    
    // Mark automation as finished
    automationInProgress = false;
    
    // Re-enable UI interactions
    enableUIInteractions();
    
    // Ensure all steps are marked as completed
    completedSteps = totalSteps;
    updateOverallProgress();
    
    // Clean up listener
    progressListenerActive = false;
    
    setTimeout(() => {
        showCompletionMessage();
    }, 1000);
}

/**
 * Re-enable UI interactions after automation completes
 */
function enableUIInteractions() {
    console.log('🔓 ENHANCED: Re-enabling UI interactions');
    
    // Remove event listeners that were preventing interactions
    document.removeEventListener('click', preventClickDuringAutomation, true);
    document.removeEventListener('keydown', preventKeysDuringAutomation, true);
    
    // Mark modal as no longer protected
    const progressModal = document.getElementById("progressModal");
    if (progressModal) {
        progressModal.dataset.automationActive = 'false';
    }
}

/**
 * Reset progress tracking for new automation
 */
function resetProgressTracking() {
    // Only allow reset if automation is not in progress
    if (automationInProgress) {
        alert("Cannot start new automation while current one is running. Please wait for completion.");
        return;
    }
    
    currentSteps = [];
    completedSteps = 0;
    totalSteps = 0;
    progressListenerActive = false;
    automationInProgress = false;
    
    // Clear any running countdown
    if (window.completionCountdownInterval) {
        clearInterval(window.completionCountdownInterval);
        window.completionCountdownInterval = null;
    }
    
    // Re-enable UI interactions
    enableUIInteractions();
    
    // Hide progress modal and show instruction modal
    const instructionModal = document.getElementById("instructionModal");
    const progressModal = document.getElementById("progressModal");
    const completionMessage = document.getElementById("completionMessage");
    const stepsContainer = document.getElementById("stepsContainer");
    const warningElement = document.getElementById("automationWarning");
    
    instructionModal.classList.remove("hidden");
    progressModal.classList.remove("show");
    completionMessage.classList.remove("show");
    stepsContainer.style.display = "block";
    if (warningElement) warningElement.style.display = "none";
    
    // Clear the input field
    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.value = "";
        userInput.focus();
    }
    
    // Reset progress bar
    const progressFill = document.getElementById("overallProgressFill");
    if (progressFill) {
        progressFill.style.width = "0%";
    }
}

// Clean up when window closes
window.addEventListener('beforeunload', () => {
    progressListenerActive = false;
    automationInProgress = false;
    if (window.completionCountdownInterval) {
        clearInterval(window.completionCountdownInterval);
    }
    enableUIInteractions(); // Clean up event listeners
});

// CRITICAL: Prevent accidental window closure during automation
window.addEventListener('beforeunload', (e) => {
    if (automationInProgress && currentSteps.length > 0 && completedSteps < totalSteps) {
        e.preventDefault();
        e.returnValue = 'Automation is still running. Are you sure you want to close?';
        return 'Automation is still running. Are you sure you want to close?';
    }
});

// Add escape key handler for manual close (only when automation is complete)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !automationInProgress) {
        window.close();
    }
});

// Prevent any form submissions or button clicks that might navigate away
document.addEventListener('submit', (e) => {
    if (automationInProgress) {
        e.preventDefault();
        showAutomationWarning();
        return false;
    }
});

// Prevent context menu during automation
document.addEventListener('contextmenu', (e) => {
    if (automationInProgress) {
        e.preventDefault();
        return false;
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

// Handle Enter key press
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("processBtn").click();
    }
});

// Enhanced event listeners for quick action buttons
document.addEventListener("DOMContentLoaded", function() {
    // Enhanced event listeners for quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Prevent action if automation is in progress
            if (automationInProgress) {
                e.preventDefault();
                e.stopPropagation();
                showAutomationWarning();
                return false;
            }
            
            const action = this.getAttribute('data-action');
            document.getElementById('userInput').value = action;
            document.getElementById('processBtn').click();
        });
    });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError(`Unexpected error: ${event.reason}`);
});

console.log("✅ Enhanced popup loaded with progress modal and step tracking");
