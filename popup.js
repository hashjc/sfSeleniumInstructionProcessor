// HYBRID POPUP SCRIPT - Enhanced with Object Validation Error Handling
console.log("🚀 HYBRID POPUP: Advanced automation + autofill interface with object validation starting...");

let automationInProgress = false;
let currentInputMethod = 'text';
let uploadedInstructions = null;
let uploadedFileName = '';

document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 HYBRID POPUP: DOM loaded, initializing hybrid interface...");
    
    setupHybridEventListeners();
    setupFileUploadListeners();
    testHybridBackgroundConnection();
    setupHybridQuickActions();
    updateInterfaceForCurrentPage();
    setupObjectValidationUI(); // NEW: Setup validation UI components
});

// NEW: Setup object validation UI components
function setupObjectValidationUI() {
    console.log("🔍 VALIDATION UI: Setting up object validation components...");
    
    // Create validation error container if it doesn't exist
    if (!document.getElementById('validationErrorContainer')) {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'validationErrorContainer';
        errorContainer.style.cssText = `
            display: none;
            background: linear-gradient(135deg, #f8d7da, #f5c6cb);
            border: 2px solid #f5c6cb;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            color: #721c24;
            font-size: 13px;
            line-height: 1.5;
            position: relative;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
        `;
        
        // Insert before the process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.parentNode.insertBefore(errorContainer, processBtn);
        }
    }
}

// NEW: Show object validation error
function showObjectValidationError(missingObjects, foundObjects = []) {
    console.log("❌ VALIDATION ERROR: Showing object validation error...");
    
    const errorContainer = document.getElementById('validationErrorContainer');
    if (!errorContainer) {
        console.error("❌ VALIDATION ERROR: Error container not found");
        return;
    }
    
    const missingList = missingObjects.map(obj => `• ${obj}`).join('\n');
    const foundList = foundObjects.length > 0 ? foundObjects.map(obj => `• ${obj}`).join('\n') : '';
    
    errorContainer.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="font-size: 24px; margin-right: 12px;">🚫</div>
            <div>
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Object Validation Failed</div>
                <div style="font-size: 12px; opacity: 0.8;">The following objects were not found in your Salesforce org</div>
            </div>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #dc3545;">❌ Missing Objects:</div>
            <div style="white-space: pre-line; font-family: monospace; font-size: 12px; color: #721c24;">${missingList}</div>
        </div>
        
        ${foundObjects.length > 0 ? `
        <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #28a745;">✅ Found Objects:</div>
            <div style="white-space: pre-line; font-family: monospace; font-size: 12px; color: #155724;">${foundList}</div>
        </div>
        ` : ''}
        
        <div style="background: rgba(255, 255, 255, 0.5); border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #856404;">💡 Suggestions:</div>
            <div style="font-size: 12px; line-height: 1.4;">
                • Check if these objects exist in your Salesforce org<br>
                • Use standard object names: Account, Contact, Opportunity, Lead, Case<br>
                • For custom objects, ensure they're accessible to your user<br>
                • Try using correct spelling and capitalization
            </div>
        </div>
        
        <div style="text-align: center;">
            <button onclick="hideObjectValidationError()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
                ✕ Close Error
            </button>
        </div>
    `;
    
    // Show the error container with animation
    errorContainer.style.display = 'block';
    errorContainer.style.opacity = '0';
    errorContainer.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        errorContainer.style.transition = 'all 0.4s ease';
        errorContainer.style.opacity = '1';
        errorContainer.style.transform = 'translateY(0)';
    }, 100);
    
    // Scroll to error for visibility
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add to window for the onclick handler
    window.hideObjectValidationError = hideObjectValidationError;
}

// NEW: Hide object validation error
function hideObjectValidationError() {
    console.log("🔍 VALIDATION: Hiding object validation error...");
    
    const errorContainer = document.getElementById('validationErrorContainer');
    if (errorContainer) {
        errorContainer.style.opacity = '0';
        errorContainer.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 400);
    }
}

function setupHybridEventListeners() {
    console.log("⚡ HYBRID SETUP: Adding hybrid event listeners...");
    
    const processBtn = document.getElementById("processBtn");
    if (processBtn) {
        processBtn.addEventListener("click", handleHybridProcessClick);
        console.log("⚡ HYBRID SETUP: Process button listener added");
    } else {
        console.error("⚡ HYBRID SETUP: ❌ Process button not found");
    }

    const inputMethodTabs = document.querySelectorAll('.input-method-tab');
    inputMethodTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            switchInputMethod(method);
        });
    });

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

function setupFileUploadListeners() {
    console.log("📁 FILE SETUP: Setting up file upload listeners...");
    
    const fileInput = document.getElementById('fileInput');
    const fileUploadContainer = document.getElementById('fileUploadContainer');
    const clearFileBtn = document.getElementById('clearFileBtn');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    if (clearFileBtn) {
        clearFileBtn.addEventListener('click', clearUploadedFile);
    }
    
    if (fileUploadContainer) {
        fileUploadContainer.addEventListener('dragover', handleDragOver);
        fileUploadContainer.addEventListener('dragleave', handleDragLeave);
        fileUploadContainer.addEventListener('drop', handleFileDrop);
    }
    
    console.log("📁 FILE SETUP: File upload listeners configured");
}

function switchInputMethod(method) {
    console.log("🔄 INPUT SWITCH: Switching to", method, "method");
    
    currentInputMethod = method;
    
    const inputMethodTabs = document.querySelectorAll('.input-method-tab');
    inputMethodTabs.forEach(tab => {
        if (tab.getAttribute('data-method') === method) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    const textContainer = document.getElementById('textInputContainer');
    const fileContainer = document.getElementById('fileUploadContainer');
    
    if (method === 'text') {
        textContainer.classList.remove('hidden');
        fileContainer.classList.remove('active');
        // Hide validation error when switching input methods
        hideObjectValidationError();
        updateProcessButtonText();
    } else {
        textContainer.classList.add('hidden');
        fileContainer.classList.add('active');
        // Hide validation error when switching input methods
        hideObjectValidationError();
        updateProcessButtonText();
    }
}

function updateProcessButtonText() {
    const processBtn = document.getElementById('processBtn');
    if (processBtn) {
        if (currentInputMethod === 'file') {
            if (uploadedInstructions) {
                processBtn.textContent = `🚀 Execute Instructions from ${uploadedFileName}`;
            } else {
                processBtn.textContent = '📁 Please Upload Instructions File First';
            }
        } else {
            processBtn.textContent = '🚀 Execute Automation or Autofill';
        }
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (isValidFileType(file)) {
            processUploadedFile(file);
        } else {
            showFileError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        }
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        if (isValidFileType(file)) {
            processUploadedFile(file);
        } else {
            showFileError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
            clearUploadedFile();
        }
    }
}

function isValidFileType(file) {
    const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => fileName.endsWith(ext));
}

async function processUploadedFile(file) {
    console.log("📁 PROCESSING FILE:", file.name);
    
    try {
        showFileProcessing();
        
        let instructions = [];
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            instructions = await parseCSVFile(file);
        } else {
            instructions = await parseExcelFile(file);
        }
        
        if (instructions && instructions.length > 0) {
            uploadedInstructions = instructions;
            uploadedFileName = file.name;
            showFileSuccess(file, instructions);
            // Hide any existing validation errors when new file is loaded
            hideObjectValidationError();
        } else {
            showFileError('No valid instructions found in file');
            clearUploadedFile();
        }
        
    } catch (error) {
        console.error("📁 FILE ERROR:", error);
        showFileError(`Error processing file: ${error.message}`);
        clearUploadedFile();
    }
}

async function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n').filter(line => line.trim());
                const instructions = [];
                
                const hasHeader = lines[0] && (
                    lines[0].toLowerCase().includes('instruction') ||
                    lines[0].toLowerCase().includes('command') ||
                    lines[0].toLowerCase().includes('task') ||
                    lines[0].toLowerCase().includes('action')
                );
                
                const startIndex = hasHeader ? 1 : 0;
                
                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        const instruction = line.replace(/^["']|["']$/g, '').trim();
                        if (instruction && instruction.length > 5) {
                            instructions.push(instruction);
                        }
                    }
                }
                
                console.log("📁 CSV PARSED:", instructions.length, "instructions found");
                resolve(instructions);
                
            } catch (error) {
                reject(new Error('Failed to parse CSV file'));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
                const base64 = btoa(binaryString);
                
                chrome.runtime.sendMessage({
                    action: 'parseExcelFile',
                    fileData: base64,
                    fileName: file.name
                }, (response) => {
                    if (response && response.success) {
                        resolve(response.instructions);
                    } else {
                        reject(new Error(response?.error || 'Failed to parse Excel file'));
                    }
                });
                
            } catch (error) {
                reject(new Error('Failed to process Excel file'));
            }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function showFileProcessing() {
    const fileInfo = document.getElementById('fileInfo');
    const filePreview = document.getElementById('filePreview');
    
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border: 2px solid #28a745; border-top: 2px solid transparent; border-radius: 50%; margin-right: 8px; animation: spin 1s linear infinite;"></div>
                <span>Processing file...</span>
            </div>
        `;
        fileInfo.classList.add('show');
    }
    
    if (filePreview) {
        filePreview.classList.remove('show');
    }
}

function showFileSuccess(file, instructions) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileDetails = document.getElementById('fileDetails');
    const filePreview = document.getElementById('filePreview');
    const previewContent = document.getElementById('previewContent');
    
    if (fileInfo && fileName && fileDetails) {
        fileName.textContent = file.name;
        fileDetails.textContent = `${instructions.length} instructions found • ${(file.size / 1024).toFixed(1)} KB`;
        fileInfo.classList.add('show');
    }
    
    if (filePreview && previewContent) {
        const preview = instructions.slice(0, 5).map((inst, index) => 
            `${index + 1}. ${inst.length > 80 ? inst.substring(0, 80) + '...' : inst}`
        ).join('\n');
        
        const moreText = instructions.length > 5 ? `\n... and ${instructions.length - 5} more instructions` : '';
        previewContent.textContent = preview + moreText;
        filePreview.classList.add('show');
    }
    
    updateProcessButtonText();
    console.log("📁 FILE SUCCESS:", instructions.length, "instructions loaded");
}

function showFileError(message) {
    const fileInfo = document.getElementById('fileInfo');
    
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div style="color: #dc3545;">
                <div style="font-weight: 600; margin-bottom: 5px;">❌ Error:</div>
                <div style="font-size: 11px;">${message}</div>
            </div>
        `;
        fileInfo.classList.add('show');
    }
    
    setTimeout(() => {
        if (fileInfo) {
            fileInfo.classList.remove('show');
        }
    }, 4000);
}

function clearUploadedFile() {
    uploadedInstructions = null;
    uploadedFileName = '';
    
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const filePreview = document.getElementById('filePreview');
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (fileInfo) {
        fileInfo.classList.remove('show');
    }
    
    if (filePreview) {
        filePreview.classList.remove('show');
    }
    
    // Hide validation error when file is cleared
    hideObjectValidationError();
    updateProcessButtonText();
    console.log("📁 FILE CLEARED");
}

function getCurrentInstruction() {
    if (currentInputMethod === 'file' && uploadedInstructions && uploadedInstructions.length > 0) {
        if (uploadedInstructions.length === 1) {
            return uploadedInstructions[0];
        } else {
            return `Execute the following instructions sequentially: ${uploadedInstructions.join('. Then: ')}.`;
        }
    } else {
        return document.getElementById("userInput").value.trim();
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
        }
    ];
    
    const quickActionsContainer = document.querySelector('.quick-actions');
    if (quickActionsContainer) {
        quickActionsContainer.innerHTML = '';
        
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
                    switchInputMethod('text');
                    document.getElementById('userInput').value = action.instruction;
                    
                    this.style.background = '#007bff';
                    this.innerHTML = `
                        <div style="font-size: 20px; margin-bottom: 6px;">⚡</div>
                        <div style="font-weight: 600; color: white;">Processing...</div>
                    `;
                    
                    setTimeout(() => {
                        handleHybridProcessClick();
                    }, 500);
                }
            });
            
            quickActionsContainer.appendChild(actionCard);
        });
        
        console.log("⚡ HYBRID SETUP: Quick actions configured");
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

// ENHANCED: Handle hybrid process click with object validation
async function handleHybridProcessClick() {
    console.log("🚀 HYBRID PROCESS: Button clicked");
    
    const instruction = getCurrentInstruction();
    console.log("🚀 HYBRID PROCESS: Instruction:", instruction);

    if (!instruction) {
        if (currentInputMethod === 'file') {
            alert("Please upload a file with instructions first");
        } else {
            alert("Please enter an instruction for Gemini AI automation or autofill");
        }
        return;
    }

    if (automationInProgress) {
        alert("Hybrid automation already in progress");
        return;
    }

    // Hide any existing validation errors
    hideObjectValidationError();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;
    const isSalesforce = url.includes('salesforce.com') || 
                        url.includes('force.com') || 
                        url.includes('.lightning.force.com') ||
                        url.includes('/lightning/setup/') ||
                        url.includes('--sandbox.') ||
                        url.includes('--dev.') ||
                        url.includes('--scratch.');

    if (!isSalesforce) {
        alert("Please navigate to a Salesforce org first");
        return;
    }

    const isSetupPage = url.includes('/lightning/setup/');
    if (isSetupPage) {
        console.log("🔧 SETUP PAGE DETECTED: Adapting automation for Setup environment");
        updateHybridStatus("🔧 Setup page detected - adapting automation strategy...", "processing");
    }

    try {
        automationInProgress = true;
        disableHybridControls();
        showHybridStatusPanel();
        
        if (currentInputMethod === 'file') {
            updateHybridStatus(`🧠 Gemini AI: Processing instructions from ${uploadedFileName}...`, "processing");
        } else {
            updateHybridStatus("🧠 Gemini AI: Analyzing instruction and page context...", "processing");
        }
        
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
                timestamp: Date.now(),
                source: currentInputMethod === 'file' ? 'file' : 'text',
                fileName: currentInputMethod === 'file' ? uploadedFileName : null,
                isSetupPage: isSetupPage
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
        
        // NEW: Check if this is an object validation error
        if (error.message && error.message.includes('Object validation failed')) {
            console.log("🔍 VALIDATION: Detected object validation error");
            
            // Extract missing objects from error message
            const missingObjectsMatch = error.message.match(/The following objects were not found in your Salesforce org: ([^.]+)/);
            const missingObjects = missingObjectsMatch ? missingObjectsMatch[1].split(', ').map(obj => obj.trim()) : [];
            
            // Show validation error UI instead of generic error
            showObjectValidationError(missingObjects);
            updateHybridStatus("❌ Object validation failed - check objects exist in your org", "error");
            
        } else {
            // Handle other types of errors normally
            updateHybridStatus(`❌ Error: ${error.message}`, "error");
            showHybridNotification(`Error: ${error.message}`, "error");
        }
        
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
    
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
        fileInput.disabled = true;
    }
    
    const quickCards = document.querySelectorAll('.hybrid-quick-action-card');
    quickCards.forEach(card => {
        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";
    });
    
    const inputMethodTabs = document.querySelectorAll('.input-method-tab');
    inputMethodTabs.forEach(tab => {
        tab.style.opacity = "0.5";
        tab.style.pointerEvents = "none";
    });
    
    console.log("🔒 HYBRID CONTROLS: Disabled");
}

function enableHybridControls() {
    const processBtn = document.getElementById("processBtn");
    if (processBtn) {
        processBtn.disabled = false;
        updateProcessButtonText();
        processBtn.style.opacity = "1";
    }
    
    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.disabled = false;
        userInput.style.opacity = "1";
    }
    
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
        fileInput.disabled = false;
    }
    
    const quickCards = document.querySelectorAll('.hybrid-quick-action-card');
    quickCards.forEach(card => {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
    });
    
    const inputMethodTabs = document.querySelectorAll('.input-method-tab');
    inputMethodTabs.forEach(tab => {
        tab.style.opacity = "1";
        tab.style.pointerEvents = "auto";
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
            
            // NEW: Check if this is an object validation error
            if (message.error && message.error.includes('Object validation failed')) {
                console.log("🔍 VALIDATION: Detected object validation error in message");
                
                // Extract missing objects from error message
                const missingObjectsMatch = message.error.match(/The following objects were not found in your Salesforce org: ([^.]+)/);
                const missingObjects = missingObjectsMatch ? missingObjectsMatch[1].split(', ').map(obj => obj.trim()) : [];
                
                // Show validation error UI
                showObjectValidationError(missingObjects);
                updateHybridStatus("❌ Object validation failed - check objects exist in your org", "error");
            } else {
                // Handle other types of errors normally
                updateHybridStatus(`❌ Error: ${message.error}`, "error");
                showHybridNotification(`Automation failed: ${message.error}`, "error");
            }
            
            resetHybridState();
            break;
            
        case 'statusUpdate':
            if (message.message && automationInProgress) {
                updateHybridStatus(message.message, "processing");
                
                if (message.message.includes('Analyzing')) {
                    updateHybridProgress(40);
                } else if (message.message.includes('Generating')) {
                    updateHybridProgress(70);
                } else if (message.message.includes('Executing') || message.message.includes('Filling')) {
                    updateHybridProgress(90);
                } else if (message.message.includes('Validating objects')) {
                    updateHybridProgress(25); // NEW: Progress for object validation
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

console.log("🚀 HYBRID POPUP: ✅ Enhanced hybrid interface with object validation loaded successfully");
