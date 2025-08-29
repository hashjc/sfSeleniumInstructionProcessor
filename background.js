// HYBRID GEMINI-POWERED BACKGROUND SCRIPT - Fixed Version with Dynamic Related List Detection
console.log('🧠 HYBRID BACKGROUND: Starting automation with intelligent autofill...');

let latestStatus = 'Hybrid Gemini automation ready';
const activeAutomations = new Set();
const GEMINI_CONFIG = {
    API_KEY: "AIzaSyClNkID8Lft11IcOd2605K1vo_Ror0gdtQ",
    MODEL: "gemini-1.5-flash",
    ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};



// FIXED: Add proper pluralization function
function getCorrectPlural(objectName) {
    const pluralMappings = {
        'Account': 'Accounts',
        'Contact': 'Contacts', 
        'Opportunity': 'Opportunities',
        'Lead': 'Leads',
        'Case': 'Cases',
        'Task': 'Tasks',
        'Event': 'Events',
        'Quote': 'Quotes',
        'Contract': 'Contracts',
        'Order': 'Orders',
        'Product': 'Products',
        'Asset': 'Assets',
        'Solution': 'Solutions',
        'Campaign': 'Campaigns',
        'User': 'Users',
        'Role': 'Roles'
    };
    
    return pluralMappings[objectName] || objectName + 's';
}

// NEW: Extract object names from instruction for validation
function extractObjectNamesFromInstruction(instruction) {
    console.log('📝 EXTRACT OBJECTS: Analyzing instruction:', instruction);
    
    const lowerInstruction = instruction.toLowerCase();
    
    // Object mapping with variations and aliases - UNCOMMENTED!
    const objectMappings = {
        'Account': ['account', 'company', 'organization', 'business'],
        'Contact': ['contact', 'contact info', 'contact information', 'person', 'individual'],
        'Opportunity': ['opportunity', 'deal', 'sale'],
        'Lead': ['lead', 'prospect'],
        'Case': ['case', 'ticket', 'issue'],
        'Task': ['task', 'activity'],
        'Event': ['event', 'meeting', 'appointment'],
        'Quote': ['quote', 'quotation'],
        'Contract': ['contract', 'agreement'],
        'Order': ['order', 'purchase'],
        'Product': ['product', 'item'],
        'Asset': ['asset', 'equipment'],
        'Solution': ['solution'],
        'Campaign': ['campaign', 'marketing'],
        'User': ['user'],
        'Role': ['role', 'permission']
    };
    
    const foundObjects = [];
    
    // Check for known objects
    for (const [standardObject, variations] of Object.entries(objectMappings)) {
        for (const variation of variations) {
            if (lowerInstruction.includes(variation)) {
                if (!foundObjects.includes(standardObject)) {
                    foundObjects.push(standardObject);
                }
                break;
            }
        }
    }
    
    // If no known objects found, try to extract potential custom object names
    if (foundObjects.length === 0) {
        // Look for patterns like "Create a [ObjectName]" or "new [ObjectName]"
        const customObjectPatterns = [
            /create\s+(?:a\s+|an\s+|new\s+)?([a-zA-Z][a-zA-Z0-9_]*)/i,
            /new\s+([a-zA-Z][a-zA-Z0-9_]*)/i,
            /add\s+(?:a\s+|an\s+|new\s+)?([a-zA-Z][a-zA-Z0-9_]*)/i,
            /(?:navigate\s+to|go\s+to)\s+([a-zA-Z][a-zA-Z0-9_]*)/i
        ];
        
        for (const pattern of customObjectPatterns) {
            const match = instruction.match(pattern);
            if (match && match[1]) {
                const potentialObject = match[1];
                // Capitalize first letter
                const capitalizedObject = potentialObject.charAt(0).toUpperCase() + potentialObject.slice(1);
                
                // Skip common words that are not objects
                const skipWords = ['the', 'a', 'an', 'this', 'that', 'form', 'page', 'record', 'data', 'field'];
                if (!skipWords.includes(potentialObject.toLowerCase()) && potentialObject.length > 2) {
                    foundObjects.push(capitalizedObject);
                }
            }
        }
    }
    
    console.log('📝 EXTRACT OBJECTS: Found objects:', foundObjects);
    return foundObjects;
}

// NEW: Validate objects exist in Salesforce App Launcher
async function validateObjectsExist(tabId, objectNames) {
    if (!objectNames || objectNames.length === 0) {
        console.log('🔍 VALIDATION: No objects to validate');
        return { valid: true, missingObjects: [] };
    }
    
    console.log('🔍 VALIDATION: Validating objects:', objectNames);
    
    try {
        const result = await new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: checkObjectsInAppLauncher,
                args: [objectNames]
            }, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!result || !result[0]) {
                    reject(new Error('No validation result received'));
                } else {
                    resolve(result[0].result);
                }
            });
        });
        
        console.log('🔍 VALIDATION: Result:', result);
        return result;
        
    } catch (error) {
        console.error('🔍 VALIDATION: Error:', error);
        // If validation fails, assume objects exist to avoid blocking legitimate automation
        return { valid: true, missingObjects: [], error: error.message };
    }
}

// NEW: Injected function to check objects in App Launcher with improved robustness
async function checkObjectsInAppLauncher(objectNames) {
    console.log('🔍 APP LAUNCHER CHECK: Checking objects:', objectNames);
    
    const validationResult = {
        valid: true,
        missingObjects: [],
        foundObjects: [],
        searchAttempted: false,
        error: null
    };
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function getCorrectPlural(objectName) {
        const pluralMappings = {
            'Account': 'Accounts',
            'Contact': 'Contacts', 
            'Opportunity': 'Opportunities',
            'Lead': 'Leads',
            'Case': 'Cases',
            'Task': 'Tasks',
            'Event': 'Events',
            'Quote': 'Quotes',
            'Contract': 'Contracts',
            'Order': 'Orders',
            'Product': 'Products',
            'Asset': 'Assets',
            'Solution': 'Solutions',
            'Campaign': 'Campaigns',
            'User': 'Users',
            'Role': 'Roles'
        };
        
        return pluralMappings[objectName] || objectName + 's';
    }
    
    try {
        const isSetupPage = window.location.href.includes('/lightning/setup/');
        
        if (isSetupPage) {
            console.log('🔧 VALIDATION: On setup page - cannot validate objects');
            validationResult.valid = false;
            validationResult.missingObjects = [...objectNames];
            validationResult.error = 'Cannot validate objects on Setup pages. Please navigate to the main Salesforce interface first.';
            return validationResult;
        }
        
        // ENHANCED: First check if objects are standard Salesforce objects
        const standardObjects = ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Task', 'Event', 'User', 'Product', 'Quote', 'Contract', 'Order', 'Asset', 'Solution', 'Campaign'];
        
        for (const objectName of objectNames) {
            const isStandardObject = standardObjects.some(std => std.toLowerCase() === objectName.toLowerCase());
            
            if (isStandardObject) {
                console.log(`🔍 VALIDATION: ✅ ${objectName} is a standard Salesforce object - automatically valid`);
                validationResult.foundObjects.push(objectName);
            } else {
                console.log(`🔍 VALIDATION: ${objectName} is not standard - will search in App Launcher`);
                // Only search App Launcher for non-standard objects
                const found = await searchForObjectInAppLauncher(objectName);
                if (found) {
                    validationResult.foundObjects.push(objectName);
                } else {
                    validationResult.missingObjects.push(objectName);
                    validationResult.valid = false;
                }
            }
        }
        
        return validationResult;
        
    } catch (error) {
        console.error('🔍 VALIDATION: Error during validation:', error);
        
        // ENHANCED: For standard objects, assume they exist even if validation fails
        const standardObjects = ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Task', 'Event', 'User', 'Product', 'Quote', 'Contract', 'Order', 'Asset', 'Solution', 'Campaign'];
        
        for (const objectName of objectNames) {
            const isStandardObject = standardObjects.some(std => std.toLowerCase() === objectName.toLowerCase());
            
            if (isStandardObject) {
                console.log(`🔍 VALIDATION FALLBACK: ✅ ${objectName} is standard - assuming it exists`);
                validationResult.foundObjects.push(objectName);
            } else {
                console.log(`🔍 VALIDATION FALLBACK: ❌ ${objectName} is not standard - marking as missing`);
                validationResult.missingObjects.push(objectName);
                validationResult.valid = false;
            }
        }
        
        validationResult.error = error.message;
        return validationResult;
    }
    
    // Helper function to search for specific object in App Launcher
    async function searchForObjectInAppLauncher(objectName) {
        console.log(`🔍 SEARCH OBJECT: Searching for custom object ${objectName}...`);
        
        try {
            const originalScrollTop = window.scrollY;
            let appLauncherOpen = !!document.querySelector('.slds-modal, .oneAppLauncher, [data-aura-class*="appLauncher"]');
            
            if (!appLauncherOpen) {
                const appLauncherSelectors = [
                    '.slds-icon-waffle',
                    'button[title*="App Launcher"]',
                    'button[aria-label*="App Launcher"]',
                    '.appLauncher',
                    '[data-aura-class*="oneAppLauncher"]',
                    '.oneAppLauncherTrigger',
                    'button[data-aura-class*="AppLauncher"]'
                ];
                
                let launcherClicked = false;
                
                for (const selector of appLauncherSelectors) {
                    const launchers = document.querySelectorAll(selector);
                    for (const launcher of launchers) {
                        if (launcher && launcher.offsetParent !== null) {
                            console.log('🔍 SEARCH: Found App Launcher, opening...');
                            launcher.click();
                            await sleep(4000);
                            launcherClicked = true;
                            appLauncherOpen = true;
                            break;
                        }
                    }
                    if (launcherClicked) break;
                }
                
                if (!launcherClicked) {
                    console.log('🔍 SEARCH: App Launcher not found - cannot validate custom objects');
                    return false;
                }
            }
            
            // Get search input
            const searchSelectors = [
                'input[placeholder*="Search apps"]',
                'input[placeholder*="Search"]',
                '.slds-input[type="search"]',
                '.appLauncher input',
                '[data-aura-class*="search"] input',
                '.slds-app-launcher__search input',
                '.oneAppLauncherSearch input',
                'input[type="search"]'
            ];
            
            let searchInput = null;
            for (const selector of searchSelectors) {
                const inputs = document.querySelectorAll(selector);
                for (const input of inputs) {
                    if (input && input.offsetParent !== null && !input.disabled) {
                        searchInput = input;
                        break;
                    }
                }
                if (searchInput) break;
            }
            
            if (!searchInput) {
                console.log(`🔍 SEARCH: No search input found for ${objectName}`);
                return false;
            }
            
            // Search for the object
            const searchVariations = [
                getCorrectPlural(objectName),
                objectName,
                objectName + 's',
                objectName + '__c'
            ];
            
            for (const searchTerm of searchVariations) {
                console.log(`🔍 SEARCH: Trying search term: ${searchTerm}`);
                
                searchInput.focus();
                searchInput.value = '';
                await sleep(300);
                
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                await sleep(2500);
                
                const resultSelectors = [
                    '.slds-app-launcher__tile',
                    '.slds-app-launcher__tile-body',
                    '.appTile',
                    'one-app-launcher-app-tile',
                    '[data-aura-class*="appTile"]'
                ];
                
                for (const selector of resultSelectors) {
                    const tiles = document.querySelectorAll(selector);
                    
                    for (const tile of tiles) {
                        if (!tile.offsetParent) continue;
                        
                        const tileText = (tile.textContent || '').trim().toLowerCase();
                        const tileTitle = (tile.title || '').trim().toLowerCase();
                        const searchLower = searchTerm.toLowerCase();
                        
                        if (tileText.includes(searchLower) || tileTitle.includes(searchLower)) {
                            console.log(`🔍 SEARCH: ✅ Found ${objectName} with search term ${searchTerm}`);
                            
                            // Close App Launcher
                            const closeButton = document.querySelector('.slds-modal__close, [aria-label="Close"], .modal-close, .slds-button_icon-inverse');
                            if (closeButton && closeButton.offsetParent !== null) {
                                closeButton.click();
                                await sleep(1000);
                            }
                            window.scrollTo(0, originalScrollTop);
                            return true;
                        }
                    }
                }
            }
            
            // Close App Launcher
            const closeButton = document.querySelector('.slds-modal__close, [aria-label="Close"], .modal-close, .slds-button_icon-inverse');
            if (closeButton && closeButton.offsetParent !== null) {
                closeButton.click();
                await sleep(1000);
            }
            window.scrollTo(0, originalScrollTop);
            
            console.log(`🔍 SEARCH: ❌ Object ${objectName} not found in App Launcher`);
            return false;
            
        } catch (error) {
            console.error(`🔍 SEARCH: Error searching for ${objectName}:`, error);
            return false;
        }
    }
}

class AutomationLogger {
    constructor() {
        this.logs = [];
        this.currentSession = null;
        this.maxLogSize = 10000;
        this.startTime = new Date().toISOString();
        this.logFormat = 'text'; // Default to text format, can be 'text' or 'csv'
        
        this.setupConsoleInterception();
        this.startSession();
    }
    
    // NEW: Set preferred log format
    setLogFormat(format) {
        this.logFormat = format; // 'text' or 'csv'
        console.log('📊 LOGGER: Format set to:', format);
    }
    
    setupConsoleInterception() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;
        
        console.log = (...args) => {
            this.captureLog('LOG', args);
            originalLog.apply(console, args);
        };
        
        console.error = (...args) => {
            this.captureLog('ERROR', args);
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.captureLog('WARN', args);
            originalWarn.apply(console, args);
        };
        
        console.info = (...args) => {
            this.captureLog('INFO', args);
            originalInfo.apply(console, args);
        };
    }
    
    captureLog(level, args) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            sessionId: this.currentSession?.id
        };
        
        this.logs.push(logEntry);
        
        if (this.logs.length > this.maxLogSize) {
            this.logs = this.logs.slice(-this.maxLogSize);
        }
        
        if (level === 'ERROR') {
            this.logCustomEvent('CRITICAL_ERROR', { error: logEntry.message });
        }
    }
    
    startSession() {
        this.currentSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startTime: new Date().toISOString(),
            instruction: null,
            pageContext: null,
            automationSteps: [],
            apiResponses: [],
            errors: [],
            formAnalysis: [],
            generatedData: [],
            status: 'STARTED'
        };
        
        this.logCustomEvent('SESSION_STARTED', {
            sessionId: this.currentSession.id,
            timestamp: this.currentSession.startTime
        });
    }
    
    logCustomEvent(eventType, data) {
        const timestamp = new Date().toISOString();
        const customLog = {
            timestamp,
            level: 'CUSTOM_EVENT',
            eventType,
            data: JSON.stringify(data, null, 2),
            sessionId: this.currentSession?.id
        };
        
        this.logs.push(customLog);
        
        if (this.currentSession) {
            if (!this.currentSession.customEvents) {
                this.currentSession.customEvents = [];
            }
            this.currentSession.customEvents.push({ timestamp, eventType, data });
        }
    }

    // NEW: Log object validation results
    logObjectValidation(objects, validationResult) {
        if (this.currentSession) {
            if (!this.currentSession.objectValidation) {
                this.currentSession.objectValidation = [];
            }
            this.currentSession.objectValidation.push({
                objects,
                validationResult,
                timestamp: new Date().toISOString()
            });
        }
        
        this.logCustomEvent('OBJECT_VALIDATION', { objects, validationResult });
    }
    
    logAutomationStep(stepNumber, action, description, result) {
        const stepData = {
            stepNumber,
            action,
            description,
            result,
            timestamp: new Date().toISOString()
        };
        
        if (this.currentSession) {
            this.currentSession.automationSteps.push(stepData);
        }
        
        this.logCustomEvent('AUTOMATION_STEP', stepData);
    }
    
    logAPIResponse(endpoint, request, response, duration) {
        const apiData = {
            endpoint,
            requestData: JSON.stringify(request, null, 2),
            responseData: JSON.stringify(response, null, 2),
            duration,
            timestamp: new Date().toISOString()
        };
        
        if (this.currentSession) {
            this.currentSession.apiResponses.push(apiData);
        }
        
        this.logCustomEvent('API_RESPONSE', apiData);
    }
    
    logFormAnalysis(analysis) {
        if (this.currentSession) {
            this.currentSession.formAnalysis.push({
                ...analysis,
                timestamp: new Date().toISOString()
            });
        }
        
        this.logCustomEvent('FORM_ANALYSIS', analysis);
    }
    
    logGeneratedData(instruction, data) {
        const dataEntry = {
            instruction,
            generatedData: data,
            timestamp: new Date().toISOString()
        };
        
        if (this.currentSession) {
            this.currentSession.generatedData.push(dataEntry);
        }
        
        this.logCustomEvent('GENERATED_DATA', dataEntry);
    }
    
    setSessionInstruction(instruction) {
        if (this.currentSession) {
            this.currentSession.instruction = instruction;
        }
        this.logCustomEvent('SESSION_INSTRUCTION', { instruction });
    }
    
    setPageContext(context) {
        if (this.currentSession) {
            this.currentSession.pageContext = context;
        }
        this.logCustomEvent('PAGE_CONTEXT', context);
    }
    
    completeSession(status, result) {
        if (this.currentSession) {
            this.currentSession.status = status;
            this.currentSession.endTime = new Date().toISOString();
            this.currentSession.result = result;
            this.currentSession.duration = new Date() - new Date(this.currentSession.startTime);
        }
        
        this.logCustomEvent('SESSION_COMPLETED', {
            status,
            result,
            sessionId: this.currentSession?.id,
            duration: this.currentSession?.duration
        });
        
        // Auto-save logs on session completion
        this.saveLogsToFile();
    }

    // NEW: Format logs using Gemini AI for human readability
    async formatLogsWithGemini(logData) {
        try {
            console.log('🤖 GEMINI FORMATTER: Converting logs to human-readable format...');
            
            const prompt = this.createFormattingPrompt(logData);
            
            const response = await fetch(`${GEMINI_CONFIG.ENDPOINT}?key=${GEMINI_CONFIG.API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 1,
                        topP: 0.8,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const formattedContent = data.candidates[0].content.parts[0].text.trim();
            
            console.log('🤖 GEMINI FORMATTER: ✅ Successfully formatted logs');
            return formattedContent;
            
        } catch (error) {
            console.error('🤖 GEMINI FORMATTER: ❌ Error formatting logs:', error);
            // Fallback to manual formatting
            return this.createFallbackFormattedLogs(logData);
        }
    }
    
    // NEW: Create Gemini prompt for log formatting
    createFormattingPrompt(logData) {
        const format = this.logFormat.toUpperCase();
        const session = logData.currentSession;
        
        if (format === 'CSV') {
            return `Convert this automation log data into a well-structured CSV format that can be opened in Excel or Google Sheets.

LOG DATA:
${JSON.stringify(logData, null, 2)}

Requirements for CSV format:
1. Create multiple sections: Session Summary, Automation Steps, API Calls, Form Analysis, Generated Data, Console Logs
2. Use clear column headers
3. Make data easy to analyze in spreadsheet applications
4. Include timestamps in readable format
5. Separate different data types into logical sections
6. Use proper CSV escaping for special characters

Return ONLY the CSV content without any additional formatting or explanation.`;
        } else {
            return `Convert this automation log data into a comprehensive, human-readable report.

LOG DATA:
${JSON.stringify(logData, null, 2)}

Create a detailed report with:

1. EXECUTIVE SUMMARY
   - Session overview and results
   - Key metrics and performance data
   - Success/failure status

2. SESSION DETAILS
   - Session ID and timestamps
   - Original instruction: "${session?.instruction || 'N/A'}"
   - Execution duration
   - Page context and automation strategy

3. OBJECT VALIDATION RESULTS
   - Objects validated and their status
   - Missing objects (if any)
   - Validation errors or skips

4. AUTOMATION WORKFLOW
   - Step-by-step breakdown of automation actions
   - Timestamps for each step
   - Success/failure status for each action

5. API INTERACTIONS
   - Gemini API calls made during automation
   - Request/response summaries
   - Performance metrics (duration, etc.)

6. FORM ANALYSIS & DATA GENERATION
   - Fields analyzed and filled
   - Generated data samples
   - Autofill success rates

7. CONSOLE ACTIVITY LOG
   - All console outputs during execution
   - Error messages and warnings
   - Debug information

8. PERFORMANCE METRICS
   - Total execution time
   - Steps completed vs failed
   - API call count and response times
   - Memory usage and log statistics

Make it readable for both technical users and business stakeholders. Use clear headings, bullet points, and proper formatting. Include relevant timestamps and make the data actionable for debugging and analysis.

Return ONLY the formatted report without any additional commentary.`;
        }
    }
    
    // NEW: Fallback formatting if Gemini fails
    createFallbackFormattedLogs(logData) {
        const session = logData.currentSession;
        const summary = logData.summary;
        
        if (this.logFormat === 'csv') {
            return this.createFallbackCSV(logData);
        }
        
        // Text format fallback
        let report = `SALESFORCE AUTOMATION LOG REPORT
========================================
Generated: ${new Date().toLocaleString()}
Session ID: ${session?.id || 'N/A'}
Status: ${session?.status || 'Unknown'}

EXECUTIVE SUMMARY
-----------------
• Instruction: ${session?.instruction || 'N/A'}
• Duration: ${session?.duration ? Math.round(session.duration / 1000) + ' seconds' : 'N/A'}
• Steps Completed: ${session?.automationSteps?.length || 0}
• API Calls: ${session?.apiResponses?.length || 0}
• Total Log Entries: ${summary?.totalEntries || 0}
• Errors: ${summary?.errorCount || 0}
• Warnings: ${summary?.warningCount || 0}

OBJECT VALIDATION RESULTS
--------------------------
`;
        
        if (session?.objectValidation) {
            session.objectValidation.forEach((validation, index) => {
                report += `${index + 1}. [${validation.timestamp}] Objects: ${validation.objects.join(', ')}\n   Result: ${validation.validationResult.valid ? 'Valid' : 'Failed'}\n   Missing: ${validation.validationResult.missingObjects.join(', ') || 'None'}\n\n`;
            });
        } else {
            report += 'No object validation performed.\n\n';
        }

        report += `AUTOMATION STEPS
----------------
`;
        
        if (session?.automationSteps) {
            session.automationSteps.forEach((step, index) => {
                report += `${index + 1}. [${step.timestamp}] ${step.action}\n   Description: ${step.description}\n   Result: ${step.result || 'Success'}\n\n`;
            });
        } else {
            report += 'No automation steps recorded.\n\n';
        }
        
        report += `RECENT CONSOLE ACTIVITY
-----------------------
`;
        
        logData.allLogs.slice(-20).forEach(log => {
            report += `[${log.timestamp}] ${log.level}: ${log.message}\n`;
        });
        
        return report;
    }
    
    // NEW: Create CSV fallback format
    createFallbackCSV(logData) {
        let csv = 'Timestamp,Level,Event Type,Message,Session ID\n';
        
        logData.allLogs.forEach(log => {
            const timestamp = log.timestamp;
            const level = log.level;
            const eventType = log.eventType || 'CONSOLE';
            const message = (log.message || '').replace(/"/g, '""'); // Escape quotes
            const sessionId = log.sessionId || '';
            
            csv += `"${timestamp}","${level}","${eventType}","${message}","${sessionId}"\n`;
        });
        
        return csv;
    }
    
    // MODIFIED: Save logs with Gemini formatting
    async saveLogsToFile() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = this.logFormat === 'csv' ? 'csv' : 'txt';
            const filename = `automation-logs-${timestamp}.${extension}`;
            
            const logData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    sessionCount: 1,
                    totalLogs: this.logs.length,
                    extensionVersion: chrome.runtime.getManifest().version,
                    startTime: this.startTime,
                    format: this.logFormat
                },
                currentSession: this.currentSession,
                allLogs: this.logs,
                summary: this.generateLogSummary()
            };
            
            console.log('📊 LOGGER: Formatting logs with Gemini AI...');
            const formattedContent = await this.formatLogsWithGemini(logData);
            
            const mimeType = this.logFormat === 'csv' ? 
                'text/csv;charset=utf-8,' : 
                'text/plain;charset=utf-8,';
            
            // Use Chrome Downloads API to save formatted file
            chrome.downloads.download({
                url: 'data:' + mimeType + encodeURIComponent(formattedContent),
                filename: filename,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ LOGGER: Failed to save logs:', chrome.runtime.lastError);
                } else {
                    console.log('✅ LOGGER: Human-readable logs saved successfully. Download ID:', downloadId);
                    console.log('📄 LOGGER: Format:', this.logFormat.toUpperCase(), 'File:', filename);
                    this.logCustomEvent('LOGS_SAVED', { 
                        filename, 
                        downloadId, 
                        format: this.logFormat,
                        size: formattedContent.length 
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ LOGGER: Failed to save formatted logs:', error);
            // Fallback: save as plain JSON if formatting fails completely
            await this.saveLogsAsJSON();
        }
    }
    
    // NEW: Fallback method to save as JSON if all else fails
    async saveLogsAsJSON() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `automation-logs-${timestamp}.json`;
            
            const logData = {
                metadata: {
                    exportTime: new Date().toISOString(),
                    sessionCount: 1,
                    totalLogs: this.logs.length,
                    extensionVersion: chrome.runtime.getManifest().version,
                    startTime: this.startTime,
                    format: 'json_fallback'
                },
                currentSession: this.currentSession,
                allLogs: this.logs,
                summary: this.generateLogSummary()
            };
            
            const blob = JSON.stringify(logData, null, 2);
            
            chrome.downloads.download({
                url: 'data:application/json;charset=utf-8,' + encodeURIComponent(blob),
                filename: filename,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ LOGGER: Failed to save JSON fallback:', chrome.runtime.lastError);
                } else {
                    console.log('✅ LOGGER: JSON fallback logs saved. Download ID:', downloadId);
                }
            });
            
        } catch (error) {
            console.error('❌ LOGGER: Complete failure to save logs:', error);
        }
    }
    
    generateLogSummary() {
        const summary = {
            totalEntries: this.logs.length,
            errorCount: this.logs.filter(log => log.level === 'ERROR').length,
            warningCount: this.logs.filter(log => log.level === 'WARN').length,
            customEventCount: this.logs.filter(log => log.level === 'CUSTOM_EVENT').length,
            timeRange: {
                start: this.logs[0]?.timestamp,
                end: this.logs[this.logs.length - 1]?.timestamp
            },
            sessionSummary: this.currentSession ? {
                id: this.currentSession.id,
                instruction: this.currentSession.instruction,
                status: this.currentSession.status,
                stepsCompleted: this.currentSession.automationSteps?.length || 0,
                apiCalls: this.currentSession.apiResponses?.length || 0,
                errors: this.currentSession.errors?.length || 0
            } : null
        };
        
        return summary;
    }
    
    // Manual export function with format option
    exportCurrentLogs(format = null) {
        if (format) {
            this.setLogFormat(format);
        }
        this.saveLogsToFile();
    }
    
    clearOldLogs() {
        const sessionLogs = this.logs.filter(log => log.sessionId === this.currentSession?.id);
        this.logs = sessionLogs;
        this.logCustomEvent('LOGS_CLEARED', { remainingLogs: this.logs.length });
    }
}

// Initialize logger
const logger = new AutomationLogger();

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🧠 HYBRID BACKGROUND: *** MESSAGE RECEIVED ***');
    console.log('🧠 HYBRID BACKGROUND: Request:', request);

    if (request.type === "exportLogs") {
        const format = request.format || 'text'; // Default to text, can be 'text' or 'csv'
        logger.exportCurrentLogs(format);
        sendResponse({ success: true, message: `Logs export initiated in ${format.toUpperCase()} format` });
        return true;
    }
    
    if (request.type === "setLogFormat") {
        logger.setLogFormat(request.format);
        sendResponse({ success: true, message: `Log format set to ${request.format.toUpperCase()}` });
        return true;
    }

    if (request.type === "getLogSummary") {
        const summary = logger.generateLogSummary();
        sendResponse({ success: true, data: summary });
        return true;
    }

     if (request.type === "clearLogs") {
        logger.clearOldLogs();
        sendResponse({ success: true, message: 'Old logs cleared successfully' });
        return true;
    }
    
  
    if (request.type === "getStatus") {
        console.log('🧠 HYBRID BACKGROUND: Status request received');
        sendResponse({ message: latestStatus });
        return true;
    }

    if (request.action === 'parseExcelFile') {
        console.log('📁 FILE PARSER: Excel file parsing requested');
        parseExcelFileInBackground(request.fileData, request.fileName)
            .then((instructions) => {
                console.log('📁 FILE PARSER: ✅ Excel parsing completed');
                sendResponse({ success: true, instructions: instructions });
            })
            .catch((error) => {
                console.error('📁 FILE PARSER: ❌ Excel parsing failed:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    
    if (request.action === 'executeDynamicAIAutomation') {
        console.log('🧠 HYBRID BACKGROUND: 🤖 Hybrid automation request received');
        console.log('🧠 HYBRID BACKGROUND: Instruction:', request.data?.instruction);
        console.log('🧠 HYBRID BACKGROUND: Tab ID:', request.data?.tabId);
        
        handleHybridGeminiAutomation(request.data)
            .then((result) => {
                console.log('🧠 HYBRID BACKGROUND: ✅ Hybrid automation completed');
                sendResponse({ success: true, data: result });
            })
            .catch((error) => {
                console.error('🧠 HYBRID BACKGROUND: ❌ Hybrid automation failed:', error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true;
    }
    
    if (request.type === 'AUTOMATION_COMPLETE') {
        console.log('🧠 HYBRID BACKGROUND: 🎉 Automation completed');
        latestStatus = 'Hybrid automation completed successfully!';
        return false;
    }
    
    if (request.type === 'AUTOMATION_ERROR') {
        console.error('🧠 HYBRID BACKGROUND: ❌ Automation error:', request.error);
        latestStatus = `Hybrid automation failed: ${request.error}`;
        return false;
    }
    
    if (request.type === "getAutomationSteps") {
        const instructions = ["Open record", "Fill Name", "Fill Email", "Fill Phone", "Save"];
        const totalSteps = instructions.length;

        sendResponse({
            instructions: instructions,
            originalInstruction: "Fill Salesforce Form",
            totalSteps: totalSteps
        });
        return true;
    }
    
    return false;
});

async function parseExcelFileInBackground(base64Data, fileName) {
    console.log('📁 EXCEL PARSER: Starting Excel file parsing...');
    
    try {
        // Convert base64 back to array buffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Since we don't have direct XLSX library access in background script either,
        // we'll use a different approach - manual parsing for simple Excel files
        // or parse as CSV if the file is simple enough
        
        // For this implementation, we'll use a simplified approach:
        // 1. Try to parse as text first (some Excel files can be read as text)
        // 2. Look for instruction patterns
        // 3. Extract instructions from the content
        
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        let textContent = '';
        
        try {
            textContent = textDecoder.decode(bytes);
        } catch (e) {
            // If UTF-8 fails, try with latin-1
            const latin1Decoder = new TextDecoder('latin-1');
            textContent = latin1Decoder.decode(bytes);
        }
        
        console.log('📁 EXCEL PARSER: File content length:', textContent.length);
        
        // Extract potential instructions using various patterns
        const instructions = extractInstructionsFromContent(textContent, fileName);
        
        if (instructions.length === 0) {
            throw new Error('No valid instructions found in Excel file. Please ensure your Excel file contains clear instruction text in cells.');
        }
        
        console.log('📁 EXCEL PARSER: ✅ Found', instructions.length, 'instructions');
        return instructions;
        
    } catch (error) {
        console.error('📁 EXCEL PARSER: ❌ Error:', error);
        throw new Error(`Failed to parse Excel file: ${error.message}. Please try converting to CSV format or check file format.`);
    }
}

// ADD THIS NEW FUNCTION FOR INSTRUCTION EXTRACTION
function extractInstructionsFromContent(content, fileName) {
    console.log('📁 INSTRUCTION EXTRACTOR: Analyzing content...');
    
    const instructions = [];
    
    // Clean up the content and split into potential instruction lines
    const lines = content
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .split(/[\n\r]+/) // Split by line breaks
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    console.log('📁 INSTRUCTION EXTRACTOR: Found', lines.length, 'non-empty lines');
    
    // Patterns that indicate instructions
    const instructionPatterns = [
        /create\s+\w+/i,
        /add\s+\w+/i,
        /fill\s+\w+/i,
        /autofill/i,
        /automation/i,
        /navigate\s+to/i,
        /new\s+(account|contact|opportunity|lead|case)/i,
        /related\s+\w+/i
    ];
    
    // Common instruction keywords
    const instructionKeywords = [
        'create', 'add', 'fill', 'autofill', 'navigate', 'automation', 
        'account', 'contact', 'opportunity', 'lead', 'case', 'task', 'event',
        'related', 'then', 'next', 'after'
    ];
    
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Check if line matches instruction patterns
        const matchesPattern = instructionPatterns.some(pattern => pattern.test(line));
        
        // Check if line contains instruction keywords
        const hasKeywords = instructionKeywords.some(keyword => 
            lowerLine.includes(keyword.toLowerCase())
        );
        
        // Check if line is long enough to be a meaningful instruction
        const isLongEnough = line.length >= 10 && line.length <= 500;
        
        // Check if line looks like an instruction (not just keywords)
        const looksLikeInstruction = /^[A-Z].*[a-zA-Z].*$/i.test(line) && 
            !line.match(/^[A-Z]+$/); // Not all caps (likely headers)
        
        if ((matchesPattern || hasKeywords) && isLongEnough && looksLikeInstruction) {
            // Clean up the instruction
            const cleanInstruction = line
                .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
            
            if (cleanInstruction.length >= 10 && !instructions.includes(cleanInstruction)) {
                instructions.push(cleanInstruction);
                console.log('📁 INSTRUCTION EXTRACTOR: Found instruction:', cleanInstruction.substring(0, 50) + '...');
            }
        }
    }
    
    // If no specific instructions found, look for any meaningful text lines
    if (instructions.length === 0) {
        console.log('📁 INSTRUCTION EXTRACTOR: No specific patterns found, looking for meaningful text...');
        
        for (const line of lines) {
            if (line.length >= 15 && 
                line.length <= 300 && 
                /[a-zA-Z].*[a-zA-Z]/.test(line) && 
                !line.match(/^[^a-zA-Z]*$/) &&
                line.split(/\s+/).length >= 3) {
                
                const cleanLine = line.replace(/^\W+|\W+$/g, '').trim();
                if (!instructions.includes(cleanLine)) {
                    instructions.push(cleanLine);
                    if (instructions.length >= 10) break; // Limit to prevent too many instructions
                }
            }
        }
    }
    
    // If still no instructions, create a generic one
    if (instructions.length === 0) {
        console.log('📁 INSTRUCTION EXTRACTOR: No instructions found, creating generic instruction');
        instructions.push(`Process the uploaded file ${fileName} - create appropriate Salesforce records with intelligent autofill`);
    }
    
    console.log('📁 INSTRUCTION EXTRACTOR: Final instruction count:', instructions.length);
    return instructions.slice(0, 20); // Limit to 20 instructions max
}

// Hybrid Gemini automation handler
async function handleHybridGeminiAutomation(requestData) {
    const { instruction, pageContext, tabId } = requestData;
    
    logger.setSessionInstruction(instruction);
    logger.setPageContext(pageContext);
    
    if (activeAutomations.has(tabId)) {
        const error = new Error('Automation already in progress on this tab');
        logger.logCustomEvent('AUTOMATION_ERROR', { error: error.message, tabId });
        throw error;
    }
    
    try {
        activeAutomations.add(tabId);
        
        console.log('🧠 HYBRID BACKGROUND: 🤖 Starting hybrid Gemini automation...');
        logger.logCustomEvent('AUTOMATION_STARTED', { instruction, tabId, timestamp: new Date().toISOString() });
        
        updateStatus('🧠 Gemini AI: Analyzing instruction and page...');
        
        // Step 1: Extract object names from instruction
        updateStatus('🔍 Extracting object names from instruction...');
        const objectNames = extractObjectNamesFromInstruction(instruction);
        
        // Step 2: SMART VALIDATION APPROACH
        let validationResult = null;
        let shouldBlockExecution = false;
        
       if (objectNames.length > 0) {
    console.log('🔍 VALIDATION: Objects detected:', objectNames);
    logger.logCustomEvent('OBJECTS_EXTRACTED', { objects: objectNames, instruction });
    
    updateStatus('🔍 Validating objects in your Salesforce org...');
    
    try {
        validationResult = await validateObjectsExist(tabId, objectNames);
        logger.logObjectValidation(objectNames, validationResult);
        
        // STRICT VALIDATION: Block execution if ANY objects are missing
        if (!validationResult.valid && validationResult.missingObjects.length > 0) {
            const missingObjectsText = validationResult.missingObjects.join(', ');
            const errorMessage = `Object validation failed: The following objects were not found in your Salesforce org: ${missingObjectsText}. Please verify these objects exist and are accessible.`;
            
            console.error('🔍 VALIDATION: ❌ BLOCKING EXECUTION:', errorMessage);
            logger.logCustomEvent('VALIDATION_BLOCKED', { 
                missingObjects: validationResult.missingObjects,
                foundObjects: validationResult.foundObjects,
                instruction 
            });
            
            updateStatus('❌ Object validation failed');
            throw new Error(errorMessage);
        } else if (validationResult.valid || validationResult.foundObjects.length > 0) {
            console.log('🔍 VALIDATION: ✅ Objects validated successfully');
            logger.logCustomEvent('VALIDATION_SUCCESS', { 
                foundObjects: validationResult.foundObjects,
                instruction 
            });
            updateStatus('✅ Objects validated - proceeding with automation...');
        } else {
            // Handle edge case where validation had issues but no specific missing objects
            console.warn('🔍 VALIDATION: Warning - validation had issues but continuing...');
            logger.logCustomEvent('VALIDATION_WARNING', { 
                validationResult,
                instruction 
            });
            updateStatus('⚠️ Object validation had issues but proceeding...');
        }
        
    } catch (validationError) {
        console.error('🔍 VALIDATION: Critical validation error:', validationError.message);
        logger.logCustomEvent('VALIDATION_CRITICAL_ERROR', { 
            error: validationError.message,
            objects: objectNames,
            instruction 
        });
        updateStatus('❌ Object validation failed');
        
        // Re-throw the error to stop execution
        throw validationError;
    }
} else {
    console.log('🔍 VALIDATION: No specific objects detected - proceeding with general automation');
    logger.logCustomEvent('NO_OBJECTS_TO_VALIDATE', { instruction });
}
        
        // Continue with existing automation logic...
        const detailedContext = await getHybridPageContext(tabId);
        console.log('🧠 HYBRID BACKGROUND: Page context:', detailedContext);
        logger.logCustomEvent('PAGE_CONTEXT_RETRIEVED', detailedContext);
        
        const automationStrategy = determineAutomationStrategy(instruction, detailedContext);
        console.log('🧠 HYBRID BACKGROUND: Strategy:', automationStrategy);
        logger.logCustomEvent('AUTOMATION_STRATEGY', automationStrategy);
        
        let result;
        
        if (automationStrategy.type === 'intelligent_autofill_only') {
            updateStatus('🔍 Gemini AI: Analyzing current form fields...');
            const formAnalysis = await analyzeCurrentFormFields(tabId);
            logger.logFormAnalysis(formAnalysis);
            
            updateStatus('🤖 Gemini AI: Generating intelligent data...');
            const generatedData = await generateIntelligentFormData(instruction, formAnalysis);
            logger.logGeneratedData(instruction, generatedData);
            
            updateStatus('✨ Executing intelligent autofill...');
            await executeIntelligentAutofill(tabId, generatedData, formAnalysis);
            
            result = {
                success: true,
                message: 'Intelligent autofill completed',
                type: 'autofill_only',
                fieldsAnalyzed: formAnalysis.fields.length,
                fieldsFilled: Object.keys(generatedData).length,
                validationResult: validationResult
            };
            
        } else {
            updateStatus('🤖 Gemini AI: Generating automation workflow...');
            const automationInstructions = await generateHybridGeminiAutomation(instruction, detailedContext);
            console.log('🧠 HYBRID BACKGROUND: Generated instructions:', automationInstructions.length);
            logger.logCustomEvent('AUTOMATION_INSTRUCTIONS', { instructions: automationInstructions });
            
            updateStatus('🚀 Executing automation with intelligent autofill...');
            await executeHybridAutomation(tabId, automationInstructions, instruction);
            
            result = {
                success: true,
                message: 'Hybrid automation completed successfully',
                type: 'full_automation',
                instructionsCount: automationInstructions.length,
                instruction: instruction,
                validationResult: validationResult
            };
        }
        
        logger.completeSession('SUCCESS', result);
        return result;
        
    } catch (error) {
        console.error('🧠 HYBRID BACKGROUND: ❌ Error:', error);
        updateStatus(`❌ Error: ${error.message}`);
        logger.completeSession('ERROR', { error: error.message });
        throw error;
    } finally {
        activeAutomations.delete(tabId);
    }
}

function shouldBlockForMissingObjects(missingObjects, instruction) {
    console.log('🧠 SMART BLOCKING: Evaluating whether to block for missing objects:', missingObjects);
    
    // Known standard Salesforce objects - never block for these
    const standardObjects = [
        'Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Task', 'Event', 
        'User', 'Product', 'Quote', 'Contract', 'Order', 'Asset', 'Solution', 'Campaign'
    ];
    
    // Check if all missing objects are standard objects
    const allMissingAreStandard = missingObjects.every(obj => 
        standardObjects.some(standard => 
            obj.toLowerCase() === standard.toLowerCase()
        )
    );
    
    if (allMissingAreStandard) {
        console.log('🧠 SMART BLOCKING: All missing objects are standard - not blocking');
        return false; // Don't block for standard objects - validation might have issues
    }
    
    // Check if objects look like clearly invalid custom objects
    const hasObviouslyInvalidObjects = missingObjects.some(obj => {
        const objLower = obj.toLowerCase();
        
        // Block for obviously invalid object names
        const invalidPatterns = [
            /^test$/i,           // Just "test"
            /^demo$/i,           // Just "demo" 
            /^sample$/i,         // Just "sample"
            /^example$/i,        // Just "example"
            /^\d+$/,             // Just numbers
            /^[a-z]{1,2}$/i,     // Very short names (1-2 chars)
            /^temp$/i,           // "temp"
            /^foo$/i,            // "foo"
            /^bar$/i             // "bar"
        ];
        
        return invalidPatterns.some(pattern => pattern.test(objLower));
    });
    
    if (hasObviouslyInvalidObjects) {
        console.log('🧠 SMART BLOCKING: Found obviously invalid object names - blocking');
        return true; // Block for clearly invalid object names
    }
    
    // For custom objects that might be valid, check instruction context
    const instructionLower = instruction.toLowerCase();
    
    // Don't block if instruction seems to be asking for general automation
    if (instructionLower.includes('fill') || 
        instructionLower.includes('autofill') || 
        instructionLower.includes('form')) {
        console.log('🧠 SMART BLOCKING: Instruction is form-focused - not blocking');
        return false;
    }
    
    // Don't block if there are less than 3 missing objects (might be legitimate custom objects)
     if (missingObjects.length > 0) {
        console.log('🧠 STRICT BLOCKING: Found missing objects, will block execution');
        return true; // Block execution for any missing objects
    }

    
    
    console.log('🧠 SMART BLOCKING: Default - not blocking, letting Gemini handle it');
    return false; // Default: let Gemini try to handle it
}

function parseInstructionObjects(instruction) {
    console.log('📝 PARSING: Analyzing instruction:', instruction);
    
    const lowerInstruction = instruction.toLowerCase();
    
    // Object mapping - handles variations and aliases
    const objectMappings = {
        'account': ['account', 'company', 'organization', 'business'],
        'contact': ['contact', 'contact info', 'contact information', 'person', 'individual'],
        'opportunity': ['opportunity', 'deal', 'sale'],
        'lead': ['lead', 'prospect'],
        'case': ['case', 'ticket', 'issue'],
        'task': ['task', 'activity'],
        'event': ['event', 'meeting', 'appointment']
    };
    
    // Sequence indicators
    const sequenceWords = ['then', 'and', 'also', 'next', 'after', 'create a related', 'related'];
    
    const foundObjects = [];
    let hasSequence = sequenceWords.some(word => lowerInstruction.includes(word));
    
    // Find all mentioned objects in order of appearance
    for (const [standardObject, variations] of Object.entries(objectMappings)) {
        for (const variation of variations) {
            const index = lowerInstruction.indexOf(variation);
            if (index !== -1) {
                foundObjects.push({
                    object: standardObject,
                    variation: variation,
                    position: index,
                    isRelated: lowerInstruction.includes('related ' + variation) || 
                             lowerInstruction.includes('a related ' + variation)
                });
                break; // Found this object, move to next
            }
        }
    }
    
    // Sort by position in instruction
    foundObjects.sort((a, b) => a.position - b.position);
    
    console.log('📝 PARSING: Found objects:', foundObjects);
    console.log('📝 PARSING: Has sequence indicators:', hasSequence);
    
    return {
        objects: foundObjects,
        hasSequence: hasSequence,
        isParentChild: foundObjects.length >= 2 && hasSequence
    };
}

// Determine automation strategy with enhanced parent-child detection
function determineAutomationStrategy(instruction, pageContext) {
    const parsed = parseInstructionObjects(instruction);
    
    console.log('🎯 STRATEGY: Parsed instruction:', parsed);
    
    if (pageContext.hasForm && pageContext.formFields.length > 0) {
        if (instruction.toLowerCase().includes('fill') || 
            instruction.toLowerCase().includes('autofill')) {
            return {
                type: 'intelligent_autofill_only',
                reason: 'Form detected with fill instruction'
            };
        }
    }
    
    if (parsed.isParentChild && parsed.objects.length >= 2) {
        const parent = parsed.objects[0];
        const children = parsed.objects.slice(1);
        
        return {
            type: 'parent_child_automation',
            parent: parent.object,
            children: children.map(obj => obj.object),
            sequence: parsed.objects.map(obj => obj.object),
            reason: `Parent-child workflow: ${parent.object} -> ${children.map(c => c.object).join(', ')}`
        };
    }
    
    if (parsed.objects.length === 1) {
        return {
            type: 'single_object_automation',
            object: parsed.objects[0].object,
            reason: 'Single object creation'
        };
    }
    
    if (parsed.objects.length > 1) {
        return {
            type: 'parent_child_automation',
            parent: parsed.objects[0].object,
            children: parsed.objects.slice(1).map(obj => obj.object),
            sequence: parsed.objects.map(obj => obj.object),
            reason: 'Multiple objects detected - treating as sequence'
        };
    }
    
    return {
        type: 'full_automation_with_autofill',
        reason: 'Default strategy'
    };
}

// FIXED: Enhanced Gemini prompt creation for parent-child workflows with proper plurals
function createParentChildAutomationPrompt(instruction, pageContext, strategy) {
    const parentCapitalized = strategy.parent.charAt(0).toUpperCase() + strategy.parent.slice(1);
    const childObjects = strategy.children || strategy.sequence.slice(1);
    const childCapitalized = childObjects[0].charAt(0).toUpperCase() + childObjects[0].slice(1);
    
    const parentPlural = getCorrectPlural(parentCapitalized);
    const childPlural = getCorrectPlural(childCapitalized);
    
    console.log('🤖 PROMPT: Creating workflow for:', parentCapitalized, '->', childCapitalized);
    console.log('🤖 PROMPT: Using correct plurals:', parentPlural, 'and', childPlural);
    
    return `
You are a Salesforce automation expert creating PRECISE sequential workflows. 

INSTRUCTION TO AUTOMATE: "${instruction}"

CRITICAL OBJECT SEQUENCE REQUIREMENTS:
1. First Object: ${parentCapitalized} (create this first)
2. Second Object: ${childCapitalized} (create this as related to the first)

MANDATORY SEQUENCE:
1. Create ${parentCapitalized} record using App Launcher
2. Stay on ${parentCapitalized} detail page after saving
3. Navigate to "Related" tab 
4. Scan all available related lists dynamically
5. Find the ${childPlural} related list section
6. Click "New" button ONLY in the ${childPlural} related list
7. Fill ${childCapitalized} form

EXACT OBJECT NAMES TO USE:
- Parent Object: "${parentCapitalized}" (search for "${parentPlural}")
- Child Object: "${childCapitalized}" (look for "${childPlural}" related list)

CRITICAL: The system will scan all available related lists dynamically and find "${childPlural}" section automatically.

JSON WORKFLOW:
[
  {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
  {"action": "search_in_app_launcher", "searchTerm": "${parentPlural}", "description": "Search for ${parentPlural}"},
  {"action": "click_search_result", "objectName": "${parentPlural}", "description": "Click ${parentPlural} from results"},
  {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for ${parentPlural} list"},
  {"action": "click_new_button", "description": "Click New ${parentCapitalized} button"},
  {"action": "wait_for_form", "timeout": 5000, "description": "Wait for ${parentCapitalized} form"},
  {"action": "intelligent_autofill", "instruction": "Create ${parentCapitalized}", "description": "Fill ${parentCapitalized} form"},
  {"action": "save_record", "description": "Save ${parentCapitalized}"},
  {"action": "wait_for_save_complete", "timeout": 5000, "description": "Wait for save and navigate to detail page"},
  {"action": "navigate_to_related_tab", "relatedObject": "Related", "description": "Navigate to Related tab"},
  {"action": "wait_for_related_tab_load", "timeout": 3000, "description": "Wait for Related tab"},
  {"action": "scan_available_related_lists", "description": "Scan all available related lists dynamically"},
  {"action": "find_related_list_section", "objectName": "${childCapitalized}", "targetSection": "${childPlural}", "description": "Find ${childPlural} related list section"},
  {"action": "click_new_related_button", "objectName": "${childCapitalized}", "targetSection": "${childPlural}", "description": "Click New ${childCapitalized} from ${childPlural} section"},
  {"action": "wait_for_form", "timeout": 5000, "description": "Wait for ${childCapitalized} form"},
  {"action": "intelligent_autofill", "instruction": "Create ${childCapitalized}", "description": "Fill ${childCapitalized} form"},
  {"action": "save_record", "description": "Save ${childCapitalized}"}
]

Return ONLY the JSON array above.
`;
}

function createSingleObjectAutomationPrompt(instruction, pageContext, strategy) {
    const objectCapitalized = strategy.object.charAt(0).toUpperCase() + strategy.object.slice(1);
    const objectPlural = getCorrectPlural(objectCapitalized);
    
    return `
You are a Salesforce automation expert. Create automation for: "${instruction}"

DETECTED OBJECT: ${objectCapitalized}

CURRENT CONTEXT:
- Page Type: ${pageContext.pageType}
- Current Object: ${pageContext.currentObject || 'none'}
- Has Form: ${pageContext.hasForm}

SINGLE OBJECT WORKFLOW:
[
  {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
  {"action": "search_in_app_launcher", "searchTerm": "${objectPlural}", "description": "Search for ${objectPlural}"},
  {"action": "click_search_result", "objectName": "${objectPlural}", "description": "Click ${objectPlural} from results"},
  {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for list page"},
  {"action": "click_new_button", "description": "Click New ${objectCapitalized} button"},
  {"action": "wait_for_form", "timeout": 5000, "description": "Wait for ${objectCapitalized} form"},
  {"action": "intelligent_autofill", "instruction": "${instruction}", "description": "Fill ${objectCapitalized} form intelligently"},
  {"action": "save_record", "description": "Save ${objectCapitalized}"}
]

Generate the workflow for "${instruction}". Use EXACT capitalization - "${objectPlural}" not "${strategy.object}s". Return ONLY the JSON array:
`;
}


function createDefaultAutomationPrompt(instruction, pageContext) {
    return `
You are a Salesforce automation expert. Create automation for: "${instruction}"

CURRENT CONTEXT:
- Page Type: ${pageContext.pageType}
- Current Object: ${pageContext.currentObject || 'none'}
- Has Form: ${pageContext.hasForm}

Analyze the instruction and create appropriate automation workflow.
Always start with App Launcher navigation.
Use intelligent_autofill for form filling.
Add scan_available_related_lists action before finding specific related lists.
Return ONLY the JSON array:
`;
}

// Create hybrid Gemini prompt
function createHybridGeminiPrompt(instruction, pageContext) {
    const strategy = determineAutomationStrategy(instruction, pageContext);
    
    if (strategy.type === 'parent_child_automation') {
        return createParentChildAutomationPrompt(instruction, pageContext, strategy);
    } else if (strategy.type === 'single_object_automation') {
        return createSingleObjectAutomationPrompt(instruction, pageContext, strategy);
    } else {
        return createDefaultAutomationPrompt(instruction, pageContext);
    }
}

// Get hybrid page context
async function getHybridPageContext(tabId) {
    console.log('🧠 HYBRID BACKGROUND: Getting hybrid page context...');
    
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: analyzeHybridSalesforcePage
        }, (result) => {
            if (chrome.runtime.lastError) {
                console.error('🧠 HYBRID BACKGROUND: ❌ Page analysis failed:', chrome.runtime.lastError);
                resolve(getDefaultHybridContext());
            } else if (!result || !result[0] || !result[0].result) {
                console.log('🧠 HYBRID BACKGROUND: No analysis result, using default');
                resolve(getDefaultHybridContext());
            } else {
                console.log('🧠 HYBRID BACKGROUND: ✅ Page analysis successful');
                resolve(result[0].result);
            }
        });
    });
}

// Hybrid Salesforce page analysis (injected function)
function analyzeHybridSalesforcePage() {
    console.log('🔍 HYBRID ANALYSIS: Analyzing Salesforce page...');
    
    try {
        const context = {
            url: window.location.href,
            title: document.title,
            pageType: 'unknown',
            currentObject: '',
            hasForm: false,
            formFields: [],
            buttons: [],
            appLauncherAvailable: false,
            isSetupPage: false,
            setupContext: '',
            timestamp: new Date().toISOString()
        };
        
        // Enhanced page type detection
        if (context.url.includes('/lightning/setup/')) {
            context.pageType = 'setup';
            context.isSetupPage = true;
            
            if (context.url.includes('/SetupOneHome/home')) {
                context.setupContext = 'home';
            } else if (context.url.includes('/ObjectManager/')) {
                context.setupContext = 'object_manager';
                const objectMatch = context.url.match(/\/ObjectManager\/([^\/]+)/);
                if (objectMatch) context.currentObject = objectMatch[1];
            } else if (context.url.includes('/Users/')) {
                context.setupContext = 'users';
            } else if (context.url.includes('/PermSets/')) {
                context.setupContext = 'permission_sets';
            } else if (context.url.includes('/Profiles/')) {
                context.setupContext = 'profiles';
            } else if (context.url.includes('/CustomObjects/')) {
                context.setupContext = 'custom_objects';
            } else if (context.url.includes('/Flow/')) {
                context.setupContext = 'flows';
            } else if (context.url.includes('/ApexClasses/')) {
                context.setupContext = 'apex_classes';
            } else {
                context.setupContext = 'general';
            }
            
            console.log('🔧 SETUP PAGE DETECTED:', context.setupContext);
        } else if (context.url.includes('/lightning/o/') && context.url.includes('/list')) {
            context.pageType = 'list';
            const match = context.url.match(/\/lightning\/o\/([^\/]+)\/list/);
            if (match) context.currentObject = match[1];
        } else if (context.url.includes('/lightning/o/') && context.url.includes('/new')) {
            context.pageType = 'new';
            context.hasForm = true;
            const match = context.url.match(/\/lightning\/o\/([^\/]+)\/new/);
            if (match) context.currentObject = match[1];
        } else if (context.url.includes('/lightning/r/') && context.url.includes('/edit')) {
            context.pageType = 'edit';
            context.hasForm = true;
            const match = context.url.match(/\/lightning\/r\/([^\/]+)/);
            if (match) context.currentObject = match[1];
        } else if (context.url.includes('/lightning/r/')) {
            context.pageType = 'detail';
            const match = context.url.match(/\/lightning\/r\/([^\/]+)/);
            if (match) context.currentObject = match[1];
        } else if (context.url.includes('/lightning/page/home')) {
            context.pageType = 'home';
        }
        
        const formElements = document.querySelectorAll('.recordEditContainer, .slds-form, lightning-record-edit-form, form');
        context.hasForm = formElements.length > 0;
        
        if (context.hasForm) {
            const allInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
            allInputs.forEach((input, index) => {
                if (input.offsetParent !== null && index < 20) {
                    const label = input.closest('.slds-form-element')?.querySelector('label')?.textContent?.trim() ||
                                 input.getAttribute('aria-label') ||
                                 input.placeholder ||
                                 input.name || '';
                    
                    if (label) {
                        context.formFields.push({
                            label: label,
                            type: input.type || input.tagName.toLowerCase(),
                            required: input.required || !!input.closest('.slds-form-element')?.querySelector('.slds-required')
                        });
                    }
                }
            });
        }
        
        context.appLauncherAvailable = !!document.querySelector('.slds-icon-waffle, button[title*="App Launcher"]');
        
        if (context.isSetupPage && !context.appLauncherAvailable) {
            const setupNav = document.querySelector('.setupGlobalNav, .setup-nav, .slds-setup-header');
            if (setupNav) {
                console.log('🔧 SETUP: Found setup navigation, App Launcher alternative available');
                context.appLauncherAvailable = true;
            }
        }
        
        const buttons = document.querySelectorAll('button, a[role="button"], .slds-button');
        buttons.forEach((btn, index) => {
            const text = btn.textContent?.trim() || '';
            if (text && btn.offsetParent !== null && index < 10) {
                context.buttons.push({
                    text: text,
                    title: btn.title || '',
                    isVisible: true
                });
            }
        });
        
        console.log('🔍 HYBRID ANALYSIS: ✅ Analysis complete:', context);
        return context;
        
    } catch (error) {
        console.error('🔍 HYBRID ANALYSIS: ❌ Error:', error);
        return {
            url: window.location.href,
            title: document.title,
            pageType: 'unknown',
            currentObject: '',
            hasForm: false,
            formFields: [],
            buttons: [],
            appLauncherAvailable: false,
            isSetupPage: false,
            setupContext: '',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Generate hybrid Gemini automation
async function generateHybridGeminiAutomation(instruction, pageContext) {
    console.log('🧠 HYBRID GEMINI: Generating automation...');
    
    const hybridPrompt = createHybridGeminiPrompt(instruction, pageContext);
    console.log('hybridPrompt JSON : ' + JSON.stringify(hybridPrompt));
    
    const startTime = Date.now();
    
    try {
        const requestData = {
            contents: [{ role: "user", parts: [{ text: hybridPrompt }] }],
            generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 4096,
            }
        };
        
        logger.logCustomEvent('GEMINI_API_REQUEST', { 
            endpoint: GEMINI_CONFIG.ENDPOINT,
            requestSize: JSON.stringify(requestData).length,
            instruction 
        });
        
        const response = await fetch(`${GEMINI_CONFIG.ENDPOINT}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const duration = Date.now() - startTime;
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🧠 HYBRID GEMINI: API Error:', errorText);
            logger.logAPIResponse(GEMINI_CONFIG.ENDPOINT, requestData, { error: errorText, status: response.status }, duration);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text.trim();
        
        console.log('🧠 HYBRID GEMINI: Response received, length:', responseText.length);
        console.log('response------->>>', JSON.stringify(responseText));
        
        logger.logAPIResponse(GEMINI_CONFIG.ENDPOINT, requestData, data, duration);
        
        const instructions = parseHybridGeminiResponse(responseText, instruction);
        logger.logCustomEvent('GEMINI_INSTRUCTIONS_PARSED', { 
            instructionCount: instructions.length, 
            originalResponseLength: responseText.length 
        });
        
        return instructions;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('🧠 HYBRID GEMINI: ❌ Request failed:', error);
        logger.logAPIResponse(GEMINI_CONFIG.ENDPOINT, { error: 'Request failed' }, { error: error.message }, duration);
        return createHybridFallbackInstructions(instruction);
    }
}

// Parse hybrid Gemini response
function parseHybridGeminiResponse(responseText, instruction) {
    console.log('🧠 HYBRID PARSING: Attempting to parse response...');
    
    try {
        let jsonText = responseText;
        
        const startIndex = jsonText.indexOf('[');
        const lastIndex = jsonText.lastIndexOf(']');
        
        if (startIndex === -1 || lastIndex === -1) {
            console.log('🧠 HYBRID PARSING: No JSON array found');
            return createHybridFallbackInstructions(instruction);
        }
        
        jsonText = jsonText.substring(startIndex, lastIndex + 1);
        
        jsonText = jsonText
            .replace(/```json|```/g, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
            .replace(/:\s*'([^']*)'/g, ': "$1"');
        
        const instructions = JSON.parse(jsonText);
        
        if (!Array.isArray(instructions) || instructions.length === 0) {
            console.log('🧠 HYBRID PARSING: Invalid format');
            return createHybridFallbackInstructions(instruction);
        }
        
        console.log('🧠 HYBRID PARSING: ✅ Parsed', instructions.length, 'instructions');
        return instructions;
        
    } catch (parseError) {
        console.error('🧠 HYBRID PARSING: ❌ Parse failed:', parseError);
        return createHybridFallbackInstructions(instruction);
    }
}

// FIXED: Enhanced fallback instructions with proper pluralization
function createHybridFallbackInstructions(instruction) {
    console.log('🆘 HYBRID FALLBACK: Creating enhanced fallback for:', instruction);
    
    const lowerInstruction = instruction.toLowerCase();
    
    const relationships = {
        'account': {
            children: ['contact', 'opportunity', 'case'],
            searchTerm: getCorrectPlural('Account'),
            capitalized: 'Account'
        },
        'contact': {
            children: ['opportunity', 'case', 'task'],
            searchTerm: getCorrectPlural('Contact'),
            capitalized: 'Contact'
        },
        'opportunity': {
            children: ['quote', 'contract'],
            searchTerm: getCorrectPlural('Opportunity'),
            capitalized: 'Opportunity'
        },
        'lead': {
            children: ['task', 'event'],
            searchTerm: getCorrectPlural('Lead'),
            capitalized: 'Lead'
        }
    };
    
    const hasRelatedKeywords = ['related', 'child', 'associated', 'linked', 'then', 'and'].some(keyword => 
        lowerInstruction.includes(keyword)
    );
    
    // Account + Contact workflow
    if ((lowerInstruction.includes('account') && lowerInstruction.includes('contact')) || 
        (lowerInstruction.includes('account') && hasRelatedKeywords)) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Accounts", "description": "Search for Accounts"},
            {"action": "click_search_result", "objectName": "Accounts", "description": "Click Accounts from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Accounts list"},
            {"action": "click_new_button", "description": "Click New Account button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Account form"},
            {"action": "intelligent_autofill", "instruction": "Create business Account", "description": "Fill Account form intelligently"},
            {"action": "save_record", "description": "Save Account"},
            {"action": "wait_for_save_complete", "timeout": 5000, "description": "Wait for Account to save and navigate to detail page"},
            {"action": "navigate_to_related_tab", "relatedObject": "Related", "description": "Navigate to Related tab on Account detail page"},
            {"action": "wait_for_related_tab_load", "timeout": 3000, "description": "Wait for Related tab to load"},
            {"action": "scan_available_related_lists", "description": "Scan all available related lists dynamically"},
            {"action": "find_related_list_section", "objectName": "Contact", "targetSection": "Contacts", "description": "Find Contacts related list section"},
            {"action": "click_new_related_button", "objectName": "Contact", "targetSection": "Contacts", "description": "Click New Contact from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Contact form"},
            {"action": "intelligent_autofill", "instruction": "Create professional Contact", "description": "Fill Contact form intelligently"},
            {"action": "save_record", "description": "Save Contact"}
        ];
    }
    
    if (lowerInstruction.includes('account') && lowerInstruction.includes('opportunity')) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Accounts", "description": "Search for Accounts"},
            {"action": "click_search_result", "objectName": "Accounts", "description": "Click Accounts from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Accounts list"},
            {"action": "click_new_button", "description": "Click New Account button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Account form"},
            {"action": "intelligent_autofill", "instruction": "Create business Account", "description": "Fill Account form intelligently"},
            {"action": "save_record", "description": "Save Account"},
            {"action": "wait_for_save_complete", "timeout": 5000, "description": "Wait for Account to save and navigate to detail page"},
            {"action": "navigate_to_related_tab", "relatedObject": "Related", "description": "Navigate to Related tab on Account detail page"},
            {"action": "wait_for_related_tab_load", "timeout": 3000, "description": "Wait for Related tab to load"},
            {"action": "scan_available_related_lists", "description": "Scan all available related lists dynamically"},
            {"action": "find_related_list_section", "objectName": "Opportunity", "targetSection": "Opportunities", "description": "Find Opportunities related list section"},
            {"action": "click_new_related_button", "objectName": "Opportunity", "targetSection": "Opportunities", "description": "Click New Opportunity from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Opportunity form"},
            {"action": "intelligent_autofill", "instruction": "Create sales Opportunity", "description": "Fill Opportunity form intelligently"},
            {"action": "save_record", "description": "Save Opportunity"}
        ];
    }
    
    if (lowerInstruction.includes('contact') && lowerInstruction.includes('opportunity')) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Contacts", "description": "Search for Contacts"},
            {"action": "click_search_result", "objectName": "Contacts", "description": "Click Contacts from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Contacts list"},
            {"action": "click_new_button", "description": "Click New Contact button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Contact form"},
            {"action": "intelligent_autofill", "instruction": "Create professional Contact", "description": "Fill Contact form intelligently"},
            {"action": "save_record", "description": "Save Contact"},
            {"action": "wait_for_save_complete", "timeout": 5000, "description": "Wait for Contact to save and navigate to detail page"},
            {"action": "navigate_to_related_tab", "relatedObject": "Related", "description": "Navigate to Related tab on Contact detail page"},
            {"action": "wait_for_related_tab_load", "timeout": 3000, "description": "Wait for Related tab to load"},
            {"action": "scan_available_related_lists", "description": "Scan all available related lists dynamically"},
            {"action": "find_related_list_section", "objectName": "Opportunity", "targetSection": "Opportunities", "description": "Find Opportunities related list section"},
            {"action": "click_new_related_button", "objectName": "Opportunity", "targetSection": "Opportunities", "description": "Click New Opportunity from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Opportunity form"},
            {"action": "intelligent_autofill", "instruction": "Create sales Opportunity", "description": "Fill Opportunity form intelligently"},
            {"action": "save_record", "description": "Save Opportunity"}
        ];
    }
    
    // Single object workflows
    if (lowerInstruction.includes('account') && !hasRelatedKeywords) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Accounts", "description": "Search for Accounts"},
            {"action": "click_search_result", "objectName": "Accounts", "description": "Click Accounts from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Accounts list"},
            {"action": "click_new_button", "description": "Click New Account button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Account form"},
            {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill Account form intelligently"},
            {"action": "save_record", "description": "Save Account"}
        ];
    }
    
    if (lowerInstruction.includes('contact') && !hasRelatedKeywords) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Contacts", "description": "Search for Contacts"},
            {"action": "click_search_result", "objectName": "Contacts", "description": "Click Contacts from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Contacts list"},
            {"action": "click_new_button", "description": "Click New Contact button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Contact form"},
            {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill Contact form intelligently"},
            {"action": "save_record", "description": "Save Contact"}
        ];
    }
    
    if (lowerInstruction.includes('opportunity')) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Opportunities", "description": "Search for Opportunities"},
            {"action": "click_search_result", "objectName": "Opportunities", "description": "Click Opportunities from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Opportunities list"},
            {"action": "click_new_button", "description": "Click New Opportunity button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Opportunity form"},
            {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill Opportunity form intelligently"},
            {"action": "save_record", "description": "Save Opportunity"}
        ];
    }
    
    if (lowerInstruction.includes('lead')) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Leads", "description": "Search for Leads"},
            {"action": "click_search_result", "objectName": "Leads", "description": "Click Leads from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Leads list"},
            {"action": "click_new_button", "description": "Click New Lead button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Lead form"},
            {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill Lead form intelligently"},
            {"action": "save_record", "description": "Save Lead"}
        ];
    }
    
    if (lowerInstruction.includes('case')) {
        return [
            {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
            {"action": "search_in_app_launcher", "searchTerm": "Cases", "description": "Search for Cases"},
            {"action": "click_search_result", "objectName": "Cases", "description": "Click Cases from results"},
            {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Cases list"},
            {"action": "click_new_button", "description": "Click New Case button"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Case form"},
            {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill Case form intelligently"},
            {"action": "save_record", "description": "Save Case"}
        ];
    }
    
    return [
        {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
        {"action": "search_in_app_launcher", "searchTerm": "Accounts", "description": "Search for Accounts"},
        {"action": "click_search_result", "objectName": "Accounts", "description": "Click Accounts from results"},
        {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for Accounts list"},
        {"action": "click_new_button", "description": "Click New Account button"},
        {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Account form"},
        {"action": "intelligent_autofill", "instruction": instruction, "description": "Fill form intelligently"},
        {"action": "save_record", "description": "Save record"}
    ];
}

// Execute hybrid automation
async function executeHybridAutomation(tabId, instructions, originalInstruction) {
    console.log('🚀 HYBRID AUTOMATION: Executing hybrid automation...');
    console.log('🎯 ***********instructions*******:', instructions);
    console.log('🎯 ***********originalInstruction*******:', originalInstruction);
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: performHybridSalesforceAutomation,
            args: [tabId, instructions, originalInstruction, Date.now()]
        }, (result) => {
            if (chrome.runtime.lastError) {
                console.error('🚀 HYBRID AUTOMATION: ❌ Injection failed:', chrome.runtime.lastError);
                reject(new Error(`Hybrid automation injection failed: ${chrome.runtime.lastError.message}`));
            } else {
                console.log('🚀 HYBRID AUTOMATION: ✅ Hybrid automation script injected');
                resolve(result);
            }
        });
    });
}


// FIXED: Add the new scan_available_related_lists action and enhanced find_related_list_section
async function performHybridSalesforceAutomation(tabId, instructions, originalInstruction, executionId) {
    console.log('🎯 HYBRID AUTOMATION: Starting hybrid automation');
    console.log('🎯 HYBRID AUTOMATION: Instructions:', instructions);
    console.log('🎯 HYBRID originalInstruction: Instructions:', originalInstruction);
    console.log("🚀 Automation injected on page:", instructions);

    const isSetupPage = window.location.href.includes('/lightning/setup/');

if (isSetupPage) {
    console.log('🔧 SETUP PAGE: Detected setup page, will navigate to main Salesforce first');
}


    // FIXED: Include getCorrectPlural function within injected script
    function getCorrectPlural(objectName) {
        const pluralMappings = {
            'Account': 'Accounts',
            'Contact': 'Contacts', 
            'Opportunity': 'Opportunities', // FIXED: Correct plural
            'Lead': 'Leads',
            'Case': 'Cases',
            'Task': 'Tasks',
            'Event': 'Events',
            'Quote': 'Quotes',
            'Contract': 'Contracts',
            'Order': 'Orders',
            'Product': 'Products',
            'Asset': 'Assets',
            'Solution': 'Solutions',
            'Campaign': 'Campaigns',
            'User': 'Users',
            'Role': 'Roles'
        };
        
        return pluralMappings[objectName] || objectName + 's';
    }

    // Remove any old UI
    document.getElementById("hybrid-automation-indicator")?.remove();
    document.getElementById("hybrid-automation-arrow")?.remove();
    
    // Arrow toggle
    const arrowBtn = document.createElement('div');
    arrowBtn.id = 'hybrid-automation-arrow';
    arrowBtn.innerHTML = '▶';
    arrowBtn.style.cssText = `
        position: fixed; top: 50%; right: 0;
        background: #4CAF50; color: white;
        padding: 8px 12px; border-radius: 8px 0 0 8px;
        font-size: 14px; font-weight: bold;
        cursor: pointer; z-index: 999999;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(arrowBtn);

    // Progress panel
    const indicator = document.createElement('div');
    indicator.id = 'hybrid-automation-indicator';
    indicator.style.cssText = `
        position: fixed; top: 20px; right: 0; z-index: 999998;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; padding: 25px; border-radius: 15px 0 0 15px;
        font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;
        min-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    document.body.appendChild(indicator);

    let panelVisible = false;
    arrowBtn.addEventListener('click', () => {
        panelVisible = !panelVisible;
        indicator.style.transform = panelVisible ? 'translateX(0)' : 'translateX(100%)';
        arrowBtn.innerHTML = panelVisible ? '◀' : '▶';
    });

    function updateIndicator(message, step) {
        const progress = Math.min((step / instructions.length) * 100, 100);
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <strong>🚀 Hybrid Automation</strong>
            </div>
            <div style="font-size: 13px; margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                "${originalInstruction}"
            </div>
            <div>Step ${step} of ${instructions.length}</div>
            <div style="background: rgba(255,255,255,0.3); height: 10px; border-radius: 5px; margin-bottom: 15px;">
                <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; border-radius: 5px; width: ${progress}%; transition: width 0.4s ease;"></div>
            </div>
            <div>${message}</div>
        `;
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes hybridSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hybrid-highlight { outline: 3px solid #4CAF50 !important; outline-offset: 3px !important; }
    `;
    document.head.appendChild(style);
    
    let step = 0;
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

async function navigateFromSetupToMainSalesforce() {
    console.log('🔧 SETUP NAVIGATION: Navigating from Setup to main Salesforce...');
    
    try {
        // Strategy 1: Look for Salesforce logo or home link
        const homeSelectors = [
            'a[title*="Salesforce"]',
            'a[href*="/lightning/page/home"]',
            'a[href*="/lightning/"]',
            '.slds-global-header__logo a',
            '.setupGlobalNav a[title*="Home"]',
            'a[aria-label*="Salesforce"]'
        ];
        
        for (const selector of homeSelectors) {
            const homeLink = document.querySelector(selector);
            if (homeLink && homeLink.offsetParent !== null) {
                console.log('🔧 SETUP NAVIGATION: Found home link:', selector);
                homeLink.click();
                await sleep(3000); // Wait for navigation
                return true;
            }
        }
        
        // Strategy 2: Direct URL manipulation
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.split('/lightning/setup/')[0];
        const mainUrl = baseUrl + '/lightning/page/home';
        
        console.log('🔧 SETUP NAVIGATION: Navigating directly to:', mainUrl);
        window.location.href = mainUrl;
        await sleep(5000); // Wait for navigation
        return true;
        
    } catch (error) {
        console.error('🔧 SETUP NAVIGATION: Error:', error);
        return false;
    }
}

    // FIXED: Add new function to scan available related lists
    async function scanAvailableRelatedLists() {
        console.log('🔍 SCAN RELATED LISTS: Scanning all available related lists...');
        
        await sleep(2000); // Wait for page to load
        
        // Find all related list headers
        const sectionSelectors = [
            '.slds-card__header h3',
            '.slds-card__header-title', 
            '.slds-card__header span',
            '.listRelatedObject h3',
            '[data-target-selection-name]',
            '.slds-card__header .slds-card__header-title'
        ];
        
        const allSections = new Set();
        
        for (const selector of sectionSelectors) {
            const sections = document.querySelectorAll(selector);
            sections.forEach(section => {
                const text = section.textContent?.trim().replace(/\(\d+\)$/, '').trim();
                if (text && text.length > 0 && text.length < 100) { // Filter out very long texts
                    allSections.add(text);
                }
            });
        }
        
        const availableRelatedLists = Array.from(allSections);
        console.log('🔍 SCAN RELATED LISTS: Found available related lists:', availableRelatedLists);
        
        // Store this information globally for later use
        window.availableRelatedLists = availableRelatedLists;
        
        return availableRelatedLists;
    }

    // ENHANCED: Dynamic related list section finding
    async function findRelatedListSection(objectName, targetSection) {
        console.log('🔍 ENHANCED DYNAMIC RELATED SECTION: Looking for', objectName, 'in available lists');
        
        await sleep(2000);
        
        // Use the scanned lists if available
        const availableLists = window.availableRelatedLists || [];
        console.log('🔍 ENHANCED DYNAMIC: Available related lists:', availableLists);
        
        // Create multiple variations to search for
        const searchVariations = [
            targetSection, // Exact target (e.g., "Opportunities")
            objectName + 's', // Simple plural (e.g., "Opportunitys" - though incorrect)
            objectName, // Singular (e.g., "Opportunity")
            objectName + ' Records', // With Records suffix
            objectName + 'ies', // For words ending in 'y' -> 'ies'
        ];
        
        // Add the correct plurals from our mapping
        const correctPlural = getCorrectPlural(objectName);
        if (!searchVariations.includes(correctPlural)) {
            searchVariations.unshift(correctPlural); // Add at beginning with highest priority
        }
        
        console.log('🔍 ENHANCED DYNAMIC: Search variations:', searchVariations);
        
        // First, try to find exact matches in available lists
        for (const variation of searchVariations) {
            const exactMatch = availableLists.find(list => 
                list.toLowerCase() === variation.toLowerCase()
            );
            if (exactMatch) {
                console.log('🔍 ENHANCED DYNAMIC: ✅ Found exact match in available lists:', exactMatch);
                return await findSectionByText(exactMatch);
            }
        }
        
        // If no exact match, try partial matches
        for (const variation of searchVariations) {
            const partialMatch = availableLists.find(list => 
                list.toLowerCase().includes(variation.toLowerCase()) ||
                variation.toLowerCase().includes(list.toLowerCase())
            );
            if (partialMatch) {
                console.log('🔍 ENHANCED DYNAMIC: ✅ Found partial match in available lists:', partialMatch);
                return await findSectionByText(partialMatch);
            }
        }
        
        // Fallback: direct DOM search
        console.log('🔍 ENHANCED DYNAMIC: No match in scanned lists, trying direct DOM search...');
        return await findSectionByText(targetSection);
    }
    
    async function findSectionByText(sectionText) {
        const sectionSelectors = [
            '.slds-card__header h3',
            '.slds-card__header-title', 
            '.slds-card__header span',
            '.listRelatedObject h3',
            '[data-target-selection-name]'
        ];
        
        for (const selector of sectionSelectors) {
            const sections = document.querySelectorAll(selector);
            for (const section of sections) {
                const text = section.textContent?.trim().replace(/\(\d+\)$/, '').trim();
                if (text && text.toLowerCase() === sectionText.toLowerCase()) {
                    console.log('🔍 ENHANCED DYNAMIC: ✅ Found section by text:', text);
                    
                    const card = section.closest('.slds-card, .listRelatedObject');
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await sleep(1000);
                        return true;
                    }
                }
            }
        }
        
        console.log('🔍 ENHANCED DYNAMIC: ❌ Section not found:', sectionText);
        return false;
    }

    // ENHANCED: Dynamic related button clicking
    async function clickNewRelatedButton(objectName, targetSection) {
        console.log('🆕 ENHANCED DYNAMIC NEW RELATED: Looking for New', objectName, 'button dynamically');
        
        await sleep(2000);
        
        // Use available lists to find the correct section name
        const availableLists = window.availableRelatedLists || [];
        
        // Find the best matching section name
        let bestMatch = targetSection;
        const correctPlural = getCorrectPlural(objectName);
        
        const searchVariations = [correctPlural, targetSection, objectName + 's', objectName];
        
        for (const variation of searchVariations) {
            const match = availableLists.find(list => 
                list.toLowerCase() === variation.toLowerCase()
            );
            if (match) {
                bestMatch = match;
                console.log('🆕 ENHANCED DYNAMIC: Found best matching section:', bestMatch);
                break;
            }
        }
        
        // Find the related list card
        const relatedCards = document.querySelectorAll('.slds-card, .listRelatedObject');
        
        for (const card of relatedCards) {
            const headerElement = card.querySelector('.slds-card__header h3, .slds-card__header-title, .listRelatedObject h3');
            const headerText = headerElement?.textContent?.trim().replace(/\(\d+\)$/, '').trim();
            
            console.log('🆕 ENHANCED DYNAMIC: Checking card header:', headerText);
            
            // Check if this matches our best match
            if (headerText && headerText.toLowerCase() === bestMatch.toLowerCase()) {
                console.log('🆕 ENHANCED DYNAMIC: ✅ Found target card:', headerText);
                
                // Look for New button within this specific card
                const newButtons = card.querySelectorAll('button, a[role="button"]');
                
                for (const button of newButtons) {
                    const buttonText = button.textContent?.trim()?.toLowerCase();
                    const buttonTitle = button.title?.toLowerCase();
                    
                    if ((buttonText?.includes('new') || buttonTitle?.includes('new')) && 
                        button.offsetParent !== null && !button.disabled) {
                        
                        // Verify it's not a "New View" or other non-record button
                        if (!buttonText?.includes('view') && !buttonText?.includes('report')) {
                            console.log('🆕 ENHANCED DYNAMIC: ✅ Clicking New button in section:', headerText);
                            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            await sleep(500);
                            button.click();
                            await sleep(2000);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log('🆕 ENHANCED DYNAMIC: ❌ Could not find New button for', objectName);
        throw new Error(`New ${objectName} button not found in any related section`);
    }

   async function clickAppLauncher() {
    console.log('🧭 APP LAUNCHER: Looking for App Launcher...');
    
    // FIXED: If on setup page, navigate to main Salesforce first
    if (isSetupPage) {
        console.log('🔧 SETUP: On setup page, navigating to main Salesforce first...');
        const navSuccess = await navigateFromSetupToMainSalesforce();
        if (!navSuccess) {
            throw new Error('Could not navigate from Setup to main Salesforce');
        }
        // Wait for the page to fully load
        await sleep(3000);
    }
    
    const selectors = [
        '.slds-icon-waffle',
        'button[title*="App Launcher"]',
        'button[aria-label*="App Launcher"]',
        '.appLauncher',
        '[data-aura-class*="oneAppLauncher"]',
        '.oneAppLauncherTrigger',
        'button[data-aura-class*="AppLauncher"]'
    ];
    
    console.log('🧭 APP LAUNCHER: Searching with selectors...');
    
    // Wait a bit more for main Salesforce to load if we came from Setup
    if (isSetupPage) {
        await sleep(2000);
    }
    
    for (const selector of selectors) {
        const launchers = document.querySelectorAll(selector);
        console.log(`🧭 APP LAUNCHER: Found ${launchers.length} elements with selector: ${selector}`);
        
        for (const launcher of launchers) {
            if (launcher && launcher.offsetParent !== null) {
                console.log('🧭 APP LAUNCHER: Found visible launcher element');
                console.log('🧭 APP LAUNCHER: Element details:', {
                    tagName: launcher.tagName,
                    className: launcher.className,
                    title: launcher.title,
                    ariaLabel: launcher.getAttribute('aria-label')
                });
                
                launcher.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(500);
                launcher.click();
                console.log('🧭 APP LAUNCHER: ✅ Clicked App Launcher');
                await sleep(2500);
                
                // Verify that app launcher opened
                const appLauncherModal = document.querySelector('.slds-modal, .appLauncher, .oneAppLauncher, [data-aura-class*="appLauncher"]');
                if (appLauncherModal) {
                    console.log('🧭 APP LAUNCHER: ✅ App Launcher modal confirmed open');
                } else {
                    console.log('🧭 APP LAUNCHER: ⚠️ App Launcher modal not detected, but continuing...');
                }
                
                return true;
            }
        }
    }
    
    console.error('🧭 APP LAUNCHER: ❌ No app launcher found');
    
    // Ultimate fallback: look for any waffle-like icons
    const allButtons = document.querySelectorAll('button, [role="button"]');
    console.log('🧭 APP LAUNCHER: Fallback - checking', allButtons.length, 'buttons');
    
    for (const button of allButtons) {
        const text = button.textContent?.toLowerCase() || '';
        const title = button.title?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        
        if ((text.includes('app') && (text.includes('launcher') || text.includes('menu'))) ||
            (title.includes('app') && (title.includes('launcher') || title.includes('menu'))) ||
            (ariaLabel.includes('app') && (ariaLabel.includes('launcher') || ariaLabel.includes('menu'))) ||
            button.querySelector('.slds-icon-waffle')) {
            
            console.log('🧭 APP LAUNCHER: Found potential launcher button');
            button.click();
            await sleep(2500);
            return true;
        }
    }
    
    throw new Error('App Launcher not found - no waffle icon or app launcher button detected');
}

    async function searchInAppLauncher(searchTerm) {
        console.log('🔍 SEARCH: Searching for:', searchTerm);
        
        await sleep(1500); // Increased wait time
        
        const searchSelectors = [
            'input[placeholder*="Search apps"]',
            'input[placeholder*="Search"]',
            '.slds-input[type="search"]',
            '.appLauncher input',
            '[data-aura-class*="search"] input',
            '.slds-app-launcher__search input',
            '.oneAppLauncherSearch input'
        ];
        
        console.log('🔍 SEARCH: Looking for search input...');
        
        for (const selector of searchSelectors) {
            const searchInputs = document.querySelectorAll(selector);
            console.log(`🔍 SEARCH: Found ${searchInputs.length} inputs with selector: ${selector}`);
            
            for (const searchInput of searchInputs) {
                if (searchInput && searchInput.offsetParent !== null) {
                    console.log('🔍 SEARCH: Found visible search input');
                    
                    // Clear and focus
                    searchInput.focus();
                    searchInput.value = '';
                    await sleep(200);
                    
                    // Type the search term
                    searchInput.value = searchTerm;
                    console.log('🔍 SEARCH: Entered search term:', searchTerm);
                    
                    // Trigger multiple events to ensure it works
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                    searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
                    
                    console.log('🔍 SEARCH: ✅ Search term entered and events triggered');
                    await sleep(2000); // Wait for search results
                    
                    // Log what search results we can see
                    const resultElements = document.querySelectorAll('.slds-app-launcher__tile, .appTile, .oneAppLauncherItem');
                    console.log('🔍 SEARCH: Found', resultElements.length, 'search result elements');
                    
                    resultElements.forEach((element, index) => {
                        console.log(`🔍 SEARCH: Result ${index + 1}:`, element.textContent?.trim());
                    });
                    
                    return true;
                }
            }
        }
        
        console.error('🔍 SEARCH: ❌ No search input found');
        throw new Error('App Launcher search input not found');
    }

    async function clickSearchResult(objectName) {
       await sleep(2000); // Increased wait time for search results
    
    // ENHANCED: First, try to find actual app launcher tiles
    const appTileSelectors = [
        '.slds-app-launcher__tile',
        '.slds-app-launcher__tile-body', 
        '.appTile',
        'one-app-launcher-app-tile',
        '[data-aura-class*="appTile"]'
    ];
    
    console.log('🎯 CLICK RESULT: Searching for app launcher tiles...');
    
    for (const selector of appTileSelectors) {
        const tiles = document.querySelectorAll(selector);
        console.log(`🎯 TILES: Found ${tiles.length} tiles with selector: ${selector}`);
        
        for (const tile of tiles) {
            if (!tile.offsetParent) continue;
            
            const text = tile.textContent?.trim() || '';
            const title = tile.title?.trim() || '';
            
            console.log(`🎯 TILE: Examining "${text}" (title: "${title}")`);
            
            // Look for exact match first
            if (text.toLowerCase() === objectName.toLowerCase() ||
                title.toLowerCase() === objectName.toLowerCase()) {
                
                console.log('🎯 TILE: ✅ Found exact match:', text || title);
                tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(500);
                
                const clickable = tile.querySelector('a') || tile;
                clickable.click();
                await sleep(3000);
                return true;
            }
            
            // Look for partial match
            if (text.toLowerCase().includes(objectName.toLowerCase()) ||
                title.toLowerCase().includes(objectName.toLowerCase())) {
                
                console.log('🎯 TILE: ✅ Found partial match:', text || title);
                tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await sleep(500);
                
                const clickable = tile.querySelector('a') || tile;
                clickable.click();
                await sleep(3000);
                return true;
            }
        }
    }
    
    // FALLBACK 1: Try direct navigation to the object list page
    console.log('🎯 FALLBACK: No app tiles found, trying direct navigation...');
    
    try {
        const baseUrl = window.location.origin;
        const objectUrl = `${baseUrl}/lightning/o/${objectName}/list`;
        
        console.log('🎯 DIRECT NAV: Navigating to:', objectUrl);
        window.location.href = objectUrl;
        await sleep(4000); // Wait for navigation
        
        // Check if we successfully navigated to the list page
        if (window.location.href.includes(`/lightning/o/${objectName}/list`) || 
            window.location.href.includes('/list')) {
            console.log('🎯 DIRECT NAV: ✅ Successfully navigated to object list');
            return true;
        }
    } catch (error) {
        console.log('🎯 DIRECT NAV: Failed:', error);
    }
    
    // FALLBACK 2: Try using the main navigation
    console.log('🎯 FALLBACK: Trying main navigation search...');
    
    // Close app launcher first
    const closeButton = document.querySelector('.slds-modal__close, [aria-label="Close"], .modal-close, .slds-button_icon-inverse');
    if (closeButton) {
        closeButton.click();
        await sleep(1000);
    }
    
    // Try global search
    const globalSearchSelectors = [
        'input[placeholder*="Search"]',
        '.slds-global-search input',
        '.globalSearchInput input',
        '[data-aura-class*="search"] input'
    ];
    
    for (const selector of globalSearchSelectors) {
        const searchInput = document.querySelector(selector);
        if (searchInput && searchInput.offsetParent) {
            console.log('🎯 GLOBAL SEARCH: Found global search input');
            
            searchInput.focus();
            searchInput.value = objectName;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            
            await sleep(2000);
            
            // Look for search results
            const searchResults = document.querySelectorAll('.slds-dropdown__item, .search-result, .slds-listbox__option');
            for (const result of searchResults) {
                const resultText = result.textContent?.trim() || '';
                if (resultText.toLowerCase().includes(objectName.toLowerCase())) {
                    console.log('🎯 GLOBAL SEARCH: ✅ Found result:', resultText);
                    result.click();
                    await sleep(3000);
                    return true;
                }
            }
        }
    }
    
    // FALLBACK 3: Navigate using breadcrumb or main tabs
    console.log('🎯 FALLBACK: Trying breadcrumb/tab navigation...');
    
    const navSelectors = [
        `a[title="${objectName}"]`,
        `a[title*="${objectName}"]`,
        `.slds-context-bar a[title*="${objectName}"]`,
        `.slds-tabs_default a[title*="${objectName}"]`
    ];
    
    for (const selector of navSelectors) {
        const navLink = document.querySelector(selector);
        if (navLink && navLink.offsetParent) {
            console.log('🎯 NAV: Found navigation link:', navLink.textContent);
            navLink.click();
            await sleep(3000);
            return true;
        }
    }
    
    // ULTIMATE FALLBACK: Try to create URL manually based on common patterns
    console.log('🎯 ULTIMATE FALLBACK: Attempting manual URL construction...');
    
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/lightning/');
    
    if (urlParts.length >= 2) {
        const baseUrl = urlParts[0] + '/lightning/';
        const targetUrl = baseUrl + `o/${objectName}/list`;
        
        console.log('🎯 MANUAL URL: Trying:', targetUrl);
        window.location.href = targetUrl;
        await sleep(4000);
        
        // Final check
        if (window.location.href.includes('/list')) {
            console.log('🎯 MANUAL URL: ✅ Successfully navigated');
            return true;
        }
    }
    
    // If all fails, provide detailed debugging info
    console.error('🎯 CLICK RESULT: ❌ All fallback strategies failed');
    console.log('Current URL:', window.location.href);
    console.log('App Launcher status:', {
        isOpen: !!document.querySelector('.slds-modal, [data-aura-class*="appLauncher"]'),
        searchInput: !!document.querySelector('input[placeholder*="Search"]'),
        tilesFound: document.querySelectorAll('.slds-app-launcher__tile, .appTile').length
    });
    
    throw new Error(`Could not navigate to ${objectName} - tried app launcher tiles, direct navigation, global search, and manual URL construction`);
}

    async function waitForListPage(timeout = 3000) {
        console.log('⏳ WAIT LIST: Waiting for list page...');
        
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const listIndicators = [
                '.listViewContainer',
                '.slds-table',
                'table[role="grid"]',
                '.list-view',
                '[data-aura-class*="forceListView"]'
            ];
            
            for (const selector of listIndicators) {
                if (document.querySelector(selector)) {
                    console.log('⏳ WAIT LIST: ✅ List page loaded');
                    return true;
                }
            }
            
            await sleep(200);
        }
        
        console.log('⏳ WAIT LIST: ⚠️ Timeout, but continuing...');
        return false;
    }

    // FIXED: Removed invalid :contains() selector
    async function clickNewButton() {
        console.log('🆕 NEW: Looking for New button...');
        
        const newButtonSelectors = [
            'a[title*="New"]',
            'button[title*="New"]',
            '.forceActionLink[title*="New"]',
            '.slds-button[title*="New"]',
            'a[data-aura-class*="forceActionLink"]'
        ];
        
        for (const selector of newButtonSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                const text = button.textContent?.trim() || '';
                const title = button.title?.trim() || '';
                if ((text.toLowerCase().includes('new') || title.toLowerCase().includes('new')) && 
                    button.offsetParent !== null) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    button.click();
                    console.log('🆕 NEW: ✅ Clicked New button');
                    await sleep(2000);
                    return true;
                }
            }
        }
        
        // Alternative search for buttons with "New" text
        const allButtons = document.querySelectorAll('button, a[role="button"], .slds-button');
        for (const button of allButtons) {
            const text = button.textContent?.trim()?.toLowerCase() || '';
            if (text.includes('new') && button.offsetParent !== null) {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                button.click();
                console.log('🆕 NEW: ✅ Clicked New button (alternative search)');
                await sleep(2000);
                return true;
            }
        }
        
        throw new Error('New button not found');
    }

    // ENHANCED: Better Related tab navigation
    async function navigateToRelatedTab(relatedObject) {
        console.log('🔗 RELATED TAB: Looking for Related tab...');
        
        // Wait for detail page to load completely
        await sleep(3000);
        
        // Strategy 1: Look for "Related" tab specifically
        const relatedTabSelectors = [
            'a[title="Related"]',
            'a[data-label="Related"]',
            '.slds-tabs_default__item a[title="Related"]',
            'button[title="Related"]',
            '[role="tab"][title="Related"]',
            '.tabContainer a[title="Related"]'
        ];
        
        for (const selector of relatedTabSelectors) {
            const tab = document.querySelector(selector);
            if (tab && tab.offsetParent !== null) {
                tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tab.click();
                await sleep(2000);
                console.log('🔗 RELATED TAB: ✅ Clicked Related tab');
                return true;
            }
        }
        
        // Strategy 2: Look for any tab that might contain related lists
        const allTabs = document.querySelectorAll('a[role="tab"], .slds-tabs_default__item a, .tabContainer a');
        for (const tab of allTabs) {
            const text = tab.textContent?.trim()?.toLowerCase() || '';
            const title = tab.title?.toLowerCase() || '';
            if (text.includes('related') || title.includes('related') || 
                text.includes('detail') || title.includes('detail')) {
                tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tab.click();
                await sleep(2000);
                console.log('🔗 RELATED TAB: ✅ Clicked potential related tab:', text || title);
                return true;
            }
        }
        
        console.log('🔗 RELATED TAB: ⚠️ Related tab not found, continuing...');
        return true; // Continue even if not found
    }

    async function waitForForm(timeout = 5000) {
        console.log('⏳ WAIT FORM: Waiting for form...');
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const form = document.querySelector('.recordEditContainer, .slds-form, lightning-record-edit-form');
            if (form) {
                console.log('⏳ WAIT FORM: ✅ Form found!');
                return true;
            }
            await sleep(200);
        }
        return false;
    }

    async function executeIntelligentAutofillStep(instruction) {
        console.log('✨ INTELLIGENT AUTOFILL: Starting autofill step...');
        
        // Create visual indicator
        const autofillNotification = document.createElement('div');
        autofillNotification.style.cssText = `
            position: fixed; top: 120px; right: 20px; z-index: 999998;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white; padding: 12px 16px; border-radius: 8px;
            font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.3);
        `;
        autofillNotification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="width: 16px; height: 16px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; margin-right: 8px; animation: spin 1s linear infinite;"></div>
                <span>🤖 AI Filling Form...</span>
            </div>
        `;
        document.body.appendChild(autofillNotification);
        
        // Add CSS for spinner animation
        if (!document.getElementById('autofill-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'autofill-spinner-style';
            style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }
        
        try {
            await sleep(1000);
            
            // Enhanced form analysis and filling
            const formFields = document.querySelectorAll('input:not([type="hidden"]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled]), select:not([disabled])');
            const fillableFields = [];
            
            formFields.forEach((field, index) => {
                if (field.offsetParent !== null) {
                    const label = getFieldLabel(field);
                    if (label && !isLookupField(field)) {
                        fillableFields.push({
                            element: field,
                            label: label,
                            type: field.type || field.tagName.toLowerCase(),
                            fieldInfo: analyzeFieldType(field, label)
                        });
                    }
                }
            });
            
            console.log(`Found ${fillableFields.length} fillable fields`);
            
            if (fillableFields.length > 0) {
                let filledCount = 0;
                const timestamp = Date.now();
                
                for (const field of fillableFields) {
                    const value = generateEnhancedFieldValue(field, instruction, timestamp);
                    if (await fillFieldEnhanced(field.element, value, field.fieldInfo)) {
                        filledCount++;
                    }
                    await sleep(300); // Increased delay between fields
                }
                
                console.log(`Filled ${filledCount} of ${fillableFields.length} fields`);
                
                // UPDATE: Add 10-second review delay before proceeding
                autofillNotification.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px;">✅ Autofill Complete</div>
                        <div style="font-size: 10px; margin-bottom: 8px;">Filled ${filledCount}/${fillableFields.length} fields</div>
                        <div style="font-size: 10px; color: #ffeb3b;">⏰ 10-second review delay...</div>
                        <div style="margin-top: 5px;">Please review and fix any errors</div>
                    </div>
                `;
                
                // CRITICAL: 10-second delay for user review
                console.log('⏰ REVIEW DELAY: Starting 10-second review period...');
                await sleep(10000);
                
                autofillNotification.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px;">✅ Review Complete</div>
                        <div style="font-size: 10px;">Ready to proceed</div>
                    </div>
                `;
            } else {
                autofillNotification.innerHTML = `
                    <div style="text-align: center;">⚠️ No fillable fields found</div>
                `;
            }
            
        } catch (error) {
            console.error('Autofill error:', error);
            autofillNotification.innerHTML = `
                <div style="text-align: center;">❌ Autofill Error</div>
            `;
        }
        
        // Remove notification after delay
        setTimeout(() => {
            if (autofillNotification.parentNode) {
                autofillNotification.remove();
            }
        }, 3000);
        
        return true;
    }

    function analyzeFieldType(element, label) {
        const labelLower = label.toLowerCase();
        const fieldInfo = {
            type: 'text',
            isPicklist: false,
            isPostalCode: false,
            isPhone: false,
            isEmail: false,
            isDate: false,
            isNumber: false,
            isUrl: false,
            picklistOptions: []
        };
        
        // Detect picklist fields
        if (element.tagName.toLowerCase() === 'select' || 
            element.closest('lightning-combobox') ||
            element.closest('.slds-combobox') ||
            element.getAttribute('role') === 'combobox') {
            
            fieldInfo.isPicklist = true;
            fieldInfo.type = 'picklist';
            
            // Extract picklist options
            if (element.tagName.toLowerCase() === 'select') {
                const options = element.querySelectorAll('option');
                options.forEach(option => {
                    if (option.value && option.value !== '' && option.value !== '--None--') {
                        fieldInfo.picklistOptions.push({
                            value: option.value,
                            text: option.textContent.trim()
                        });
                    }
                });
            }
        }
        
        // Detect postal/pin code fields
        if (labelLower.includes('postal') || 
            labelLower.includes('zip') || 
            labelLower.includes('pin') ||
            labelLower.includes('postcode') ||
            labelLower.includes('postal code')) {
            fieldInfo.isPostalCode = true;
            fieldInfo.type = 'postal';
        }
        
        // Detect other field types
        if (element.type === 'email' || labelLower.includes('email')) {
            fieldInfo.isEmail = true;
            fieldInfo.type = 'email';
        } else if (element.type === 'tel' || labelLower.includes('phone') || labelLower.includes('mobile')) {
            fieldInfo.isPhone = true;
            fieldInfo.type = 'phone';
        } else if (element.type === 'url' || labelLower.includes('website') || labelLower.includes('url')) {
            fieldInfo.isUrl = true;
            fieldInfo.type = 'url';
        } else if (element.type === 'date' || labelLower.includes('date')) {
            fieldInfo.isDate = true;
            fieldInfo.type = 'date';
        } else if (element.type === 'number' || labelLower.includes('amount') || labelLower.includes('revenue')) {
            fieldInfo.isNumber = true;
            fieldInfo.type = 'number';
        }
        
        return fieldInfo;
    }

    function generateEnhancedFieldValue(field, instruction, timestamp) {
        const { fieldInfo, label } = field;
        const labelLower = label.toLowerCase();
        
        // Handle picklist fields - select from available options
        if (fieldInfo.isPicklist && fieldInfo.picklistOptions.length > 0) {
            console.log(`🎯 PICKLIST: Selecting from ${fieldInfo.picklistOptions.length} options for ${label}`);
            
            // Try to find a relevant option based on instruction context
            const instructionLower = instruction.toLowerCase();
            
            // Smart option selection based on common patterns
            for (const option of fieldInfo.picklistOptions) {
                const optionText = option.text.toLowerCase();
                
                // For industry fields
                if (labelLower.includes('industry')) {
                    if ((instructionLower.includes('tech') && optionText.includes('tech')) ||
                        (instructionLower.includes('healthcare') && optionText.includes('health')) ||
                        (instructionLower.includes('manufacturing') && optionText.includes('manufact'))) {
                        return option.text;
                    }
                }
                
                // For type/status fields
                if (labelLower.includes('type') || labelLower.includes('status')) {
                    if (optionText.includes('customer') || 
                        optionText.includes('prospect') || 
                        optionText.includes('active') ||
                        optionText.includes('hot') ||
                        optionText.includes('qualified')) {
                        return option.text;
                    }
                }
                
                // For lead source
                if (labelLower.includes('source')) {
                    if (optionText.includes('web') || 
                        optionText.includes('referral') || 
                        optionText.includes('marketing')) {
                        return option.text;
                    }
                }
            }
            
            // Fallback: return first valid option that's not "None" or empty
            for (const option of fieldInfo.picklistOptions) {
                if (!option.text.toLowerCase().includes('none') && 
                    !option.text.toLowerCase().includes('select') &&
                    option.text.trim() !== '') {
                    return option.text;
                }
            }
            
            return fieldInfo.picklistOptions[0].text;
        }
        
        // Handle postal code fields with realistic postal codes
        if (fieldInfo.isPostalCode) {
            const postalCodes = [
                '10001', '10002', '10003', '10004', '10005', // New York
                '90210', '90211', '90212', '90213', '90214', // Los Angeles
                '60601', '60602', '60603', '60604', '60605', // Chicago
                '33101', '33102', '33103', '33104', '33105', // Miami
                '78701', '78702', '78703', '78704', '78705', // Austin
                '94101', '94102', '94103', '94104', '94105', // San Francisco
                '02101', '02102', '02103', '02104', '02105', // Boston
                '20001', '20002', '20003', '20004', '20005'  // Washington DC
            ];
            return postalCodes[Math.floor(Math.random() * postalCodes.length)];
        }
        
        // Handle other field types with existing logic
        if (fieldInfo.isEmail) {
            return `contact${timestamp}@business.com`;
        } else if (fieldInfo.isPhone) {
            return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
        } else if (fieldInfo.isUrl) {
            return `https://business${timestamp}.com`;
        } else if (fieldInfo.isNumber) {
            if (labelLower.includes('employee')) {
                return Math.floor(Math.random() * 500) + 50;
            } else if (labelLower.includes('revenue') || labelLower.includes('amount')) {
                return Math.floor(Math.random() * 5000000) + 500000;
            } else {
                return Math.floor(Math.random() * 1000) + 1;
            }
        } else if (fieldInfo.isDate) {
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + Math.floor(Math.random() * 12) + 1);
            return futureDate.toISOString().split('T')[0];
        } else if (field.element.tagName.toLowerCase() === 'textarea' || labelLower.includes('description')) {
            return `Professional business description for ${instruction}. This is a comprehensive overview of our services and capabilities in the industry.`;
        } else if (labelLower.includes('first name') || labelLower.includes('firstname')) {
            const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (labelLower.includes('last name') || labelLower.includes('lastname')) {
            const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (labelLower.includes('company') || labelLower.includes('account name') || (labelLower.includes('name') && !labelLower.includes('first') && !labelLower.includes('last'))) {
            return `Business Solutions ${timestamp}`;
        } else if (labelLower.includes('title') || labelLower.includes('position') || labelLower.includes('role')) {
            const titles = ['CEO', 'CTO', 'VP Sales', 'Director', 'Manager', 'Specialist'];
            return titles[Math.floor(Math.random() * titles.length)];
        } else if (labelLower.includes('street') || labelLower.includes('address')) {
            const addresses = [
                '123 Business Ave', '456 Corporate Blvd', '789 Enterprise St', 
                '321 Commerce Dr', '654 Industry Way', '987 Technology Pkwy'
            ];
            return addresses[Math.floor(Math.random() * addresses.length)];
        } else if (labelLower.includes('city')) {
            const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
            return cities[Math.floor(Math.random() * cities.length)];
        } else if (labelLower.includes('state') || labelLower.includes('province')) {
            const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];
            return states[Math.floor(Math.random() * states.length)];
        } else if (labelLower.includes('country')) {
            return 'United States';
        } else {
            return `Professional Data ${timestamp}`;
        }
    }

    async function fillFieldEnhanced(element, value, fieldInfo) {
        try {
            if (!element.offsetParent || element.disabled || element.readOnly) {
                return false;
            }
            
            // Focus and scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            await sleep(200);
            
            // Handle picklist fields specially
            if (fieldInfo.isPicklist) {
                console.log(`🎯 FILLING PICKLIST: ${fieldInfo.label} with value: ${value}`);
                return await fillPicklistFieldEnhanced(element, value, fieldInfo);
            }
            
            // Handle regular input fields
            element.value = '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            
            // Set the value
            element.value = value;
            
            // Trigger events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            console.log(`✅ FILLED: ${fieldInfo.label || 'field'} with: ${value}`);
            return true;
            
        } catch (error) {
            console.error('Error filling field:', error);
            return false;
        }
    }

    // ENHANCED PICKLIST FILLING
    async function fillPicklistFieldEnhanced(element, value, fieldInfo) {
        try {
            // Handle standard select elements
            if (element.tagName.toLowerCase() === 'select') {
                const options = element.querySelectorAll('option');
                
                // Try exact match first
                for (const option of options) {
                    if (option.textContent.trim() === value || option.value === value) {
                        element.value = option.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`✅ PICKLIST SELECT: Selected "${option.textContent.trim()}"`);
                        return true;
                    }
                }
                
                // Try partial match
                for (const option of options) {
                    if (option.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
                        element.value = option.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`✅ PICKLIST SELECT: Selected "${option.textContent.trim()}" (partial match)`);
                        return true;
                    }
                }
            }
            
            // Handle Lightning combobox
            const combobox = element.closest('lightning-combobox, .slds-combobox');
            if (combobox) {
                const button = combobox.querySelector('button, [role="button"]') || element;
                button.click();
                await sleep(1500);
                
                // Look for dropdown options
                const options = document.querySelectorAll('[role="option"], .slds-dropdown__item, .slds-listbox__option');
                
                // Try exact match
                for (const option of options) {
                    const optionText = option.textContent?.trim() || '';
                    if (optionText === value) {
                        option.click();
                        await sleep(500);
                        console.log(`✅ PICKLIST COMBOBOX: Selected "${optionText}"`);
                        return true;
                    }
                }
                
                // Try partial match
                for (const option of options) {
                    const optionText = option.textContent?.trim() || '';
                    if (optionText.toLowerCase().includes(value.toLowerCase())) {
                        option.click();
                        await sleep(500);
                        console.log(`✅ PICKLIST COMBOBOX: Selected "${optionText}" (partial match)`);
                        return true;
                    }
                }
                
                // Close dropdown if no match found
                button.click();
            }
            
            return false;
        } catch (error) {
            console.error('Error filling picklist field:', error);
            return false;
        }
    }
        
    function getFieldLabel(element) {
        // Strategy 1: Lightning component label
        const lightningParent = element.closest('lightning-input, lightning-textarea, lightning-combobox');
        if (lightningParent) {
            const label = lightningParent.getAttribute('label');
            if (label) return label;
        }
        
        // Strategy 2: Associated label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim().replace(/\*/g, '');
        }
        
        // Strategy 3: Parent label
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim().replace(/\*/g, '');
        
        // Strategy 4: Form element label
        const formElement = element.closest('.slds-form-element');
        if (formElement) {
            const label = formElement.querySelector('label, .slds-form-element__label');
            if (label) return label.textContent.trim().replace(/\*/g, '');
        }
        
        // Strategy 5: ARIA label or placeholder
        return element.getAttribute('aria-label') || element.placeholder || element.name || '';
    }
    
    function isLookupField(element) {
        return element.closest('.slds-combobox[data-aura-class*="lookup"]') ||
               element.closest('lightning-lookup') ||
               element.closest('[data-aura-class*="lookup"]') ||
               (element.getAttribute('role') === 'combobox' && element.closest('.lookup'));
    }
    
    async function saveRecord() {
        console.log('💾 SAVE: Looking for save button...');
        
        // Wait for any pending form validations or UI updates
        await sleep(2000);
        
        // Comprehensive selectors for Salesforce save buttons
        const saveSelectors = [
            // Standard Lightning save buttons
            'button[title="Save"]',
            'button[title="Save Record"]', 
            'button[title*="Save"]',
            
            // SLDS button classes
            '.slds-button[title*="Save"]',
            'button.slds-button[title*="Save"]',
            
            // Lightning component buttons
            'lightning-button[variant="brand"]',
            'lightning-button[label*="Save"]',
            
            // Form submit buttons
            'input[type="submit"]',
            'input[value*="Save"]',
            
            // Data attributes
            'button[data-aura-class*="save"]',
            'button[data-aura-class*="uiButton"]',
            '[data-aura-rendered-by*="save"]',
            
            // Aria labels
            'button[aria-label*="Save"]',
            
            // Footer buttons (common in modals)
            '.slds-modal__footer button',
            '.modal-footer button',
            
            // Record edit form buttons
            '.recordEditContainer button',
            '.slds-form button',
            'lightning-record-edit-form button',
            
            // Generic button selectors as fallback
            'button',
            '[role="button"]'
        ];
        
        console.log('💾 SAVE: Searching through', saveSelectors.length, 'selector patterns...');
        
        // Try each selector pattern
        for (let i = 0; i < saveSelectors.length; i++) {
            const selector = saveSelectors[i];
            console.log(`💾 SAVE: Trying selector ${i + 1}: ${selector}`);
            
            try {
                const buttons = document.querySelectorAll(selector);
                console.log(`💾 SAVE: Found ${buttons.length} buttons with selector: ${selector}`);
                
                for (let j = 0; j < buttons.length; j++) {
                    const button = buttons[j];
                    
                    // Check if button is visible and enabled
                    if (!isButtonClickable(button)) {
                        continue;
                    }
                    
                    const buttonInfo = getButtonInfo(button);
                    console.log(`💾 SAVE: Examining button ${j + 1}:`, buttonInfo);
                    
                    // Check if this is likely a save button
                    if (isSaveButton(button, buttonInfo)) {
                        console.log('💾 SAVE: ✅ Found save button, attempting to click...');
                        
                        // Try multiple click strategies
                        const clickSuccess = await attemptButtonClick(button, buttonInfo);
                        
                        if (clickSuccess) {
                            console.log('💾 SAVE: ✅ Save button clicked successfully');
                            
                            // Wait for save to process and handle errors
                            const saveResult = await waitForSaveCompletion();
                            return saveResult;
                        } else {
                            console.log('💾 SAVE: ⚠️ Click attempt failed, trying next button...');
                        }
                    }
                }
            } catch (error) {
                console.error(`💾 SAVE: Error with selector ${selector}:`, error);
            }
        }
        
        console.error('💾 SAVE: ❌ No clickable save button found');
        return false;
    }

    function isButtonClickable(button) {
        if (!button) return false;
        
        // Check if element exists and is attached to DOM
        if (!button.parentNode || !document.contains(button)) {
            return false;
        }
        
        // Check if element is visible
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        
        const isVisible = (
            rect.width > 0 && 
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            button.offsetParent !== null
        );
        
        if (!isVisible) {
            return false;
        }
        
        // Check if button is enabled
        const isEnabled = (
            !button.disabled &&
            !button.hasAttribute('disabled') &&
            button.getAttribute('aria-disabled') !== 'true' &&
            !button.classList.contains('disabled') &&
            !button.classList.contains('slds-disabled')
        );
        
        return isEnabled;
    }

    // Helper function to get button information
    function getButtonInfo(button) {
        return {
            text: (button.textContent || '').trim().toLowerCase(),
            title: (button.title || '').toLowerCase(),
            ariaLabel: (button.getAttribute('aria-label') || '').toLowerCase(),
            className: button.className || '',
            tagName: button.tagName.toLowerCase(),
            type: button.type || '',
            value: (button.value || '').toLowerCase(),
            dataLabel: (button.getAttribute('data-label') || '').toLowerCase(),
            innerHTML: button.innerHTML.toLowerCase()
        };
    }

    // Helper function to determine if button is a save button
    function isSaveButton(button, info) {
        // Primary save button indicators
        const saveKeywords = ['save', 'submit', 'create', 'update'];
        
        // Check text content
        if (saveKeywords.some(keyword => info.text.includes(keyword))) {
            // Exclude buttons that are clearly not save buttons
            const excludeKeywords = ['cancel', 'close', 'delete', 'remove', 'discard'];
            if (!excludeKeywords.some(keyword => info.text.includes(keyword))) {
                return true;
            }
        }
        
        // Check title attribute
        if (saveKeywords.some(keyword => info.title.includes(keyword))) {
            return true;
        }
        
        // Check aria-label
        if (saveKeywords.some(keyword => info.ariaLabel.includes(keyword))) {
            return true;
        }
        
        // Check value attribute (for input buttons)
        if (saveKeywords.some(keyword => info.value.includes(keyword))) {
            return true;
        }
        
        // Check for Lightning brand buttons (usually save/primary actions)
        if (button.closest('lightning-button[variant="brand"]') || 
            button.classList.contains('slds-button_brand') ||
            button.classList.contains('slds-button--brand')) {
            return true;
        }
        
        // Check for submit type buttons
        if (info.type === 'submit') {
            return true;
        }
        
        // Check for common Lightning/SLDS save button classes
        const saveClasses = [
            'slds-button_brand',
            'slds-button--brand', 
            'uiButton--brand',
            'submit'
        ];
        
        if (saveClasses.some(cls => button.classList.contains(cls))) {
            return true;
        }
        
        return false;
    }

    // Helper function to attempt clicking with multiple strategies
    async function attemptButtonClick(button, buttonInfo) {
        console.log('💾 CLICK: Attempting to click save button...');
        
        try {
            // Scroll button into view
            button.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
            
            await sleep(500);
            
            // Strategy 1: Focus and direct click
            try {
                button.focus();
                await sleep(200);
                button.click();
                console.log('💾 CLICK: Strategy 1 (direct click) executed');
                await sleep(1000);
                
                // Check if click was successful by looking for loading indicators
                if (hasLoadingIndicators()) {
                    console.log('💾 CLICK: ✅ Loading indicators detected - click successful');
                    return true;
                }
            } catch (error) {
                console.log('💾 CLICK: Strategy 1 failed:', error);
            }
            
            // Strategy 2: Mouse events
            try {
                const mouseEvents = ['mousedown', 'mouseup', 'click'];
                for (const eventType of mouseEvents) {
                    const event = new MouseEvent(eventType, {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    button.dispatchEvent(event);
                }
                console.log('💾 CLICK: Strategy 2 (mouse events) executed');
                await sleep(1000);
                
                if (hasLoadingIndicators()) {
                    console.log('💾 CLICK: ✅ Loading indicators detected - mouse events successful');
                    return true;
                }
            } catch (error) {
                console.log('💾 CLICK: Strategy 2 failed:', error);
            }
            
            // Strategy 3: Form submission (if button is in a form)
            try {
                const form = button.closest('form');
                if (form) {
                    form.requestSubmit(button);
                    console.log('💾 CLICK: Strategy 3 (form submit) executed');
                    await sleep(1000);
                    
                    if (hasLoadingIndicators()) {
                        console.log('💾 CLICK: ✅ Form submission successful');
                        return true;
                    }
                }
            } catch (error) {
                console.log('💾 CLICK: Strategy 3 failed:', error);
            }
            
            // Strategy 4: Lightning component click
            try {
                const lightningButton = button.closest('lightning-button');
                if (lightningButton) {
                    lightningButton.click();
                    console.log('💾 CLICK: Strategy 4 (lightning click) executed');
                    await sleep(1000);
                    
                    if (hasLoadingIndicators()) {
                        console.log('💾 CLICK: ✅ Lightning button click successful');
                        return true;
                    }
                }
            } catch (error) {
                console.log('💾 CLICK: Strategy 4 failed:', error);
            }
            
            // Strategy 5: Keyboard events (Enter/Space)
            try {
                button.focus();
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true
                });
                button.dispatchEvent(enterEvent);
                console.log('💾 CLICK: Strategy 5 (keyboard) executed');
                await sleep(1000);
                
                if (hasLoadingIndicators()) {
                    console.log('💾 CLICK: ✅ Keyboard event successful');
                    return true;
                }
            } catch (error) {
                console.log('💾 CLICK: Strategy 5 failed:', error);
            }
            
            console.log('💾 CLICK: ⚠️ All click strategies failed');
            return false;
            
        } catch (error) {
            console.error('💾 CLICK: ❌ Error during click attempt:', error);
            return false;
        }
    }

    // Helper function to detect loading indicators
    function hasLoadingIndicators() {
        const loadingSelectors = [
            '.slds-spinner',
            '.loading',
            '.slds-is-loading',
            '[data-aura-class*="spinner"]',
            '.uiSpinner',
            '.slds-button[disabled]'
        ];
        
        for (const selector of loadingSelectors) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        
        // Check if save button became disabled (indicates processing)
        const saveButtons = document.querySelectorAll('button[title*="Save"], .slds-button[title*="Save"]');
        for (const btn of saveButtons) {
            if (btn.disabled || btn.hasAttribute('disabled')) {
                return true;
            }
        }
        
        return false;
    }

    async function waitForSaveCompletion() {
        console.log('⏰ SAVE: Waiting for save completion...');
        
        let retries = 30; // 60 seconds total (30 * 2 seconds)
        let errorCount = 0;
        const initialUrl = window.location.href;
        
        while (retries > 0) {
            await sleep(2000);
            
            // Check for navigation away from edit/new page (success indicator)
            const currentUrl = window.location.href;
            if (currentUrl !== initialUrl) {
                if (currentUrl.includes('/view') || currentUrl.includes('/detail') || 
                    (!currentUrl.includes('/new') && !currentUrl.includes('/edit'))) {
                    console.log('✅ SAVE: Record saved successfully - navigated to detail page');
                    removeErrorNotification();
                    return true;
                }
            }
            
            // Enhanced error detection
            const errorElements = [
                ...document.querySelectorAll('.slds-notify_toast.slds-theme--error'),
                ...document.querySelectorAll('.slds-theme--error'),
                ...document.querySelectorAll('.forceFormPageError'),
                ...document.querySelectorAll('.form-element__help'),
                ...document.querySelectorAll('.slds-form-element__help'),
                ...document.querySelectorAll('.slds-has-error'),
                ...document.querySelectorAll('[data-aura-class*="error"]'),
                ...document.querySelectorAll('.error-message'),
                ...document.querySelectorAll('.field-error')
            ];
            
            const visibleErrors = errorElements.filter(error => {
                const style = window.getComputedStyle(error);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       error.offsetParent !== null &&
                       error.textContent.trim() !== '';
            });
            
            if (visibleErrors.length > 0) {
                errorCount++;
                console.warn(`⚠️ VALIDATION ERRORS: ${visibleErrors.length} errors found (attempt ${errorCount})`);
                
                if (errorCount === 1) {
                    showErrorNotification(visibleErrors);
                }
                
                // Continue waiting for user to fix errors
            } else if (errorCount > 0) {
                // Errors were cleared, try saving again
                console.log('✅ SAVE: Errors cleared, attempting save again...');
                return await saveRecord(); // Recursive call to try save again
            } else {
                // No errors and reasonable time passed
                if (retries < 25) {
                    console.log('✅ SAVE: No errors detected, assuming save completed');
                    removeErrorNotification();
                    return true;
                }
            }
            
            retries--;
        }
        
        console.warn('⚠️ SAVE: Timeout reached after 60 seconds');
        removeErrorNotification();
        return false;
    }

    function showErrorNotification(errors) {
        // Remove existing notification
        removeErrorNotification();
        
        const errorNotification = document.createElement('div');
        errorNotification.id = 'automation-error-notification';
        errorNotification.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 999999; background: #f8d7da; color: #721c24;
            border: 2px solid #f5c6cb; border-radius: 12px; padding: 20px;
            font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;
            max-width: 500px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        `;
        
        const errorMessages = errors.slice(0, 3).map(error => 
            `• ${error.textContent.trim()}`
        ).join('\n');
        
        errorNotification.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 24px; margin-right: 12px;">⚠️</div>
                <div style="font-weight: bold;">Validation Errors Detected</div>
            </div>
            <div style="margin-bottom: 15px; white-space: pre-line; font-size: 12px;">
                ${errorMessages}
            </div>
            <div style="text-align: center; font-size: 12px; color: #856404;">
                Please fix the errors above. Automation will continue automatically once resolved.
            </div>
        `;
        
        document.body.appendChild(errorNotification);
    }

    function removeErrorNotification() {
        const existingNotification = document.getElementById('automation-error-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
    }

    // Execute automation steps
   try {
    updateIndicator('Starting enhanced automation...', 0);
    await sleep(1000);
    
    // FIXED: Show special message if starting from Setup
    if (isSetupPage) {
        updateIndicator('🔧 Detected Setup page - will navigate to main Salesforce first...', 0);
        await sleep(2000);
    }
    
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        step = i + 1;
        console.log(`🎯 STEP ${step}: ${instruction.action} - ${instruction.description}`);
        updateIndicator(instruction.description, step);
        
        switch (instruction.action) {
            case 'click_app_launcher':
                await clickAppLauncher();
                break;
                
            case 'search_in_app_launcher':
                await searchInAppLauncher(instruction.searchTerm);
                break;
                
            case 'click_search_result':
                await clickSearchResult(instruction.objectName);
                break;
                
            case 'wait_for_list_page':
                await waitForListPage(instruction.timeout || 3000);
                break;
                
            case 'click_new_button':
                await clickNewButton();
                break;
                
            case 'wait_for_form':
                await waitForForm(instruction.timeout || 5000);
                break;
                
            case 'intelligent_autofill':
                await executeIntelligentAutofillStep(instruction.instruction);
                break;
                
            case 'save_record':
                const saveSuccess = await saveRecord();
                if (!saveSuccess) {
                    console.error('❌ SAVE: Failed to save record');
                    // Continue anyway - don't break the automation
                }
                break;
                
            case 'wait_for_save_complete':
                await sleep(instruction.timeout || 15000);
                break;
                
            case 'navigate_to_related_tab':
                await navigateToRelatedTab(instruction.relatedObject);
                break;
                
            case 'wait_for_related_tab_load':
                await sleep(instruction.timeout || 3000);
                break;
                
            case 'scan_available_related_lists':
                await scanAvailableRelatedLists();
                break;
                
            case 'find_related_list_section':
                await findRelatedListSection(instruction.objectName, instruction.targetSection);
                break;
                
            case 'click_new_related_button':
                await clickNewRelatedButton(instruction.objectName, instruction.targetSection);
                break;

            case 'fill_field':
                // Handle individual field filling
                if (instruction.fieldName && instruction.value) {
                    await fillSpecificField(instruction.fieldName, instruction.value);
                } else if (instruction.instruction) {
                    // Fallback to intelligent autofill for this single field
                    await executeIntelligentAutofillStep(instruction.instruction);
                }
                break;
                
            default:
                console.log('❓ UNKNOWN ACTION:', instruction.action);
        }
                
        await sleep(800); // Pause between steps
    }
    
    // Show completion
    indicator.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    indicator.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <div style="font-weight: bold; margin-bottom: 10px;">Hybrid Automation Complete!</div>
            <div style="font-size: 12px; margin-bottom: 15px;">"${originalInstruction}"</div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
    `;
    
    setTimeout(() => {
        if (indicator.parentNode) indicator.remove();
    }, 10000);
    
    try {
        chrome.runtime.sendMessage({ type: 'AUTOMATION_COMPLETE', executionId: executionId });
    } catch (e) {
        console.warn('Could not notify background:', e);
    }
    
} catch (error) {
    console.error('🎯 HYBRID AUTOMATION: ❌ Error:', error);
    
    indicator.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    indicator.innerHTML = `
        <div style="text-align: center;">
            <div style="font-weight: bold; margin-bottom: 10px;">❌ Automation Error</div>
            <div style="font-size: 12px; margin-bottom: 15px;">${error.message}</div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
    `;
    
    try {
        chrome.runtime.sendMessage({ type: 'AUTOMATION_ERROR', error: error.message, executionId: executionId });
    } catch (e) {
        console.warn('Could not notify background:', e);
    }
}
}

async function fillSpecificField(fieldName, value) {
    console.log(`📝 FILL SPECIFIC: Filling ${fieldName} with ${value}`);
    
    const element = findFormElementByLabel(fieldName);
    if (element) {
        await fillFormElementWithValue(element, value, { label: fieldName });
        return true;
    }
    
    console.log(`❌ FILL SPECIFIC: Could not find field: ${fieldName}`);
    return false;
}

// Analyze current form fields - ENHANCED VERSION
async function analyzeCurrentFormFields(tabId) {
    console.log('🔍 FORM ANALYSIS: Analyzing current form fields...');
    
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: analyzeFormFieldsEnhanced
        }, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(`Form analysis failed: ${chrome.runtime.lastError.message}`));
            } else if (!result || !result[0] || !result[0].result) {
                reject(new Error('No form analysis result'));
            } else {
                resolve(result[0].result);
            }
        });
    });
}

// ENHANCED form field analysis function (injected)
function analyzeFormFieldsEnhanced() {
    console.log('🔍 ENHANCED ANALYSIS: Starting comprehensive form analysis...');
    
    const analysis = {
        url: window.location.href,
        objectType: 'Unknown',
        formType: 'Unknown',
        fields: [],
        timestamp: new Date().toISOString()
    };
    
    try {
        // Determine object type from URL
        const urlMatch = analysis.url.match(/\/lightning\/o\/([^\/]+)\/new/) || 
                        analysis.url.match(/\/lightning\/r\/([^\/]+)\/[^\/]+\/edit/);
        if (urlMatch) {
            analysis.objectType = urlMatch[1];
        }
        
        // Determine form type
        if (analysis.url.includes('/new')) {
            analysis.formType = 'creation';
        } else if (analysis.url.includes('/edit')) {
            analysis.formType = 'edit';
        }
        
        // Enhanced selectors for different Salesforce field types
        const fieldSelectors = [
            'input[type="text"]:not([readonly]):not([disabled])',
            'input[type="email"]:not([readonly]):not([disabled])',
            'input[type="tel"]:not([readonly]):not([disabled])',
            'input[type="number"]:not([readonly]):not([disabled])',
            'input[type="url"]:not([readonly]):not([disabled])',
            'textarea:not([readonly]):not([disabled])',
            'select:not([disabled])',
            'lightning-input:not([readonly]):not([disabled])',
            'lightning-textarea:not([readonly]):not([disabled])',
            'lightning-combobox:not([disabled])',
            'input.slds-input:not([readonly]):not([disabled])',
            'textarea.slds-textarea:not([readonly]):not([disabled])'
        ];
        
        const allFields = [];
        fieldSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (isElementVisible(element) && !isFieldExcluded(element)) {
                    allFields.push(element);
                }
            });
        });
        
        const uniqueFields = [...new Set(allFields)];
        
        uniqueFields.forEach((field, index) => {
            const fieldInfo = extractEnhancedFieldInfo(field, index);
            if (fieldInfo && fieldInfo.label && fieldInfo.label.length > 0) {
                analysis.fields.push(fieldInfo);
            }
        });
        
        // Remove duplicates based on name/id
        analysis.fields = analysis.fields.filter((field, index, self) => 
            index === self.findIndex(f => f.name === field.name)
        );
        
        console.log(`🔍 ENHANCED ANALYSIS: Found ${analysis.fields.length} unique fillable fields`);
        return analysis;
        
    } catch (error) {
        console.error('🔍 ENHANCED ANALYSIS: ❌ Error:', error);
        return {
            ...analysis,
            error: error.message,
            fields: []
        };
    }
    
    function extractEnhancedFieldInfo(element, index) {
        const name = element.name || 
                    element.id || 
                    element.getAttribute('data-field-name') || 
                    element.getAttribute('field-name') ||
                    element.getAttribute('data-id') ||
                    'unknown_' + Math.random().toString(36).substr(2, 9);
        
        const type = element.type || 'text';
        const tagName = element.tagName.toLowerCase();
        
        // Get field label for better AI understanding
        const label = getEnhancedFieldLabel(element);
        
        // Determine if field is required
        const required = element.required || 
                        element.hasAttribute('required') ||
                        element.getAttribute('aria-required') === 'true' ||
                        (label && label.includes('*'));
        
        const fieldInfo = {
            element: element,
            name: name,
            type: type,
            tagName: tagName,
            label: label || name,
            required: required,
            placeholder: element.placeholder || '',
            value: element.value || '',
            isLookup: false,
            isPicklist: false,
            fieldType: 'text',
            options: []
        };
        
        // Enhanced field type detection
        const labelLower = (label || '').toLowerCase();
        
        // Detect lookup fields (SKIP THESE)
        const lookupIndicators = [
            element.closest('.slds-combobox'),
            element.closest('[data-aura-class*="lookup"]'),
            element.closest('lightning-lookup'),
            element.getAttribute('role') === 'combobox',
            labelLower.includes('lookup'),
            element.classList.contains('lookup'),
            element.closest('.lookupInput')
        ];
        
        if (lookupIndicators.some(indicator => indicator)) {
            fieldInfo.isLookup = true;
            fieldInfo.fieldType = 'lookup';
            console.log('🔍 FIELD ANALYSIS: Skipping lookup field:', fieldInfo.label);
            return null; // Skip lookup fields
        }
        
        // Detect picklist/dropdown fields
        const picklistIndicators = [
            element.tagName === 'SELECT',
            element.closest('lightning-combobox'),
            element.closest('.slds-combobox'),
            element.getAttribute('role') === 'combobox',
            element.closest('[data-aura-class*="picklist"]')
        ];
        
        if (picklistIndicators.some(indicator => indicator)) {
            fieldInfo.isPicklist = true;
            fieldInfo.fieldType = 'picklist';
            
            // Get picklist options
            const optionSources = [
                element.querySelectorAll('option'),
                element.closest('.slds-combobox')?.querySelectorAll('[role="option"]'),
                element.closest('lightning-combobox')?.querySelectorAll('lightning-base-combobox-item')
            ];
            
            for (const source of optionSources) {
                if (source && source.length > 0) {
                    source.forEach(option => {
                        const value = option.value || option.getAttribute('data-value') || option.textContent?.trim();
                        const text = option.textContent?.trim() || option.getAttribute('data-label') || value;
                        if (value && value !== '' && value !== '--None--') {
                            fieldInfo.options.push({ value, text });
                        }
                    });
                    break;
                }
            }
            
            console.log('🎯 FIELD ANALYSIS: Picklist field found:', fieldInfo.label, 'with', fieldInfo.options.length, 'options');
        }
        
        // Enhanced field type detection based on label content
        if (fieldInfo.type === 'email' || labelLower.includes('email')) {
            fieldInfo.fieldType = 'email';
        } else if (fieldInfo.type === 'tel' || labelLower.includes('phone') || labelLower.includes('mobile') || labelLower.includes('telephone')) {
            fieldInfo.fieldType = 'phone';
        } else if (fieldInfo.type === 'url' || labelLower.includes('website') || labelLower.includes('url')) {
            fieldInfo.fieldType = 'url';
        } else if (fieldInfo.type === 'number' || labelLower.includes('number') || labelLower.includes('amount') || labelLower.includes('revenue') || labelLower.includes('salary')) {
            fieldInfo.fieldType = 'number';
        } else if (fieldInfo.type === 'date' || labelLower.includes('date')) {
            fieldInfo.fieldType = 'date';
        } else if (fieldInfo.tagName === 'textarea' || labelLower.includes('description') || labelLower.includes('comment') || labelLower.includes('notes')) {
            fieldInfo.fieldType = 'textarea';
        } else if (labelLower.includes('postal') || labelLower.includes('zip') || labelLower.includes('postcode')) {
            fieldInfo.fieldType = 'postal';
        } else if (labelLower.includes('city') || labelLower.includes('town')) {
            fieldInfo.fieldType = 'city';
        } else if (labelLower.includes('state') || labelLower.includes('province') || labelLower.includes('region')) {
            fieldInfo.fieldType = 'state';
        } else if (labelLower.includes('country')) {
            fieldInfo.fieldType = 'country';
        } else if (labelLower.includes('street') || labelLower.includes('address') || labelLower.includes('avenue') || labelLower.includes('road')) {
            fieldInfo.fieldType = 'street';
        } else if (labelLower.includes('industry') || labelLower.includes('type') || labelLower.includes('category')) {
            fieldInfo.fieldType = 'category';
        } else if (labelLower.includes('first name') || labelLower.includes('firstname')) {
            fieldInfo.fieldType = 'firstname';
        } else if (labelLower.includes('last name') || labelLower.includes('lastname') || labelLower.includes('surname')) {
            fieldInfo.fieldType = 'lastname';
        } else if (labelLower.includes('name') && !labelLower.includes('company')) {
            fieldInfo.fieldType = 'name';
        } else if (labelLower.includes('company') || labelLower.includes('account') || labelLower.includes('organization')) {
            fieldInfo.fieldType = 'company';
        } else if (labelLower.includes('title') || labelLower.includes('position') || labelLower.includes('role')) {
            fieldInfo.fieldType = 'title';
        } else if (labelLower.includes('department') || labelLower.includes('division')) {
            fieldInfo.fieldType = 'department';
        }
        
        return {
            element: element,
            name: element.name || element.id || 'field_' + index,
            type: element.type || 'text',
            tagName: element.tagName.toLowerCase(),
            label: getEnhancedFieldLabel(element) || element.name || '',
            required: element.required || element.hasAttribute('required'),
            placeholder: element.placeholder || '',
            value: element.value || '',
            isLookup: false,
            isPicklist: false,
            fieldType: 'text',
            options: []
        };
    }
    
    function getEnhancedFieldLabel(element) {
        // Strategy 1: Associated label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim();
        }
        
        // Strategy 2: Parent label
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();
        
        // Strategy 3: Nearby label elements
        const container = element.closest('.slds-form-element, .form-group, .field-container');
        if (container) {
            const label = container.querySelector('label, .slds-form-element__label, .field-label');
            if (label) return label.textContent.trim();
        }
        
        // Strategy 4: Lightning component attributes
        if (element.tagName.toLowerCase().startsWith('lightning-')) {
            const label = element.getAttribute('label') || element.getAttribute('field-label');
            if (label) return label;
        }
        
        return element.getAttribute('aria-label') || element.placeholder || '';
    }
    
    function isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return element && element.offsetParent !== null;    
    }
    
    function isFieldExcluded(element) {
        const excludePatterns = [
            'search', 'filter', 'hidden', 'password', 'captcha'
        ];
        
        const elementText = (element.name || element.id || element.className || '').toLowerCase();
        return false;
    }
}

// Enhanced AI Form Data Generation
async function generateIntelligentFormData(instruction, formAnalysis) {
    console.log('🤖 ENHANCED INTELLIGENT DATA: Generating data for fields...');
    
    const fieldDescriptions = formAnalysis.fields.map(field => {
        let desc = `${field.name} (${field.type}`;
        if (field.label && field.label !== field.name) {
            desc += `, label: "${field.label}"`;
        }
        if (field.required) desc += ', required';
        if (field.placeholder) desc += `, placeholder: "${field.placeholder}"`;
        if (field.isPicklist && field.options.length > 0) {
            desc += `, options: [${field.options.map(opt => opt.text).join(', ')}]`;
        }
        desc += ')';
        return desc;
    }).join('\n');

    const enhancedPrompt = `Generate realistic, professional business data for a Salesforce ${formAnalysis.objectType} form with these fields:

${fieldDescriptions}

REQUIREMENTS:
- Return as JSON object with field names as keys
- Use realistic business data appropriate for ${instruction}
- Make all data unique with timestamp: ${Date.now()}
- For required fields, always provide values
- For picklist fields, choose from available options
- For names, use professional business names
- For emails, use professional business format
- For phone numbers, use proper business format
- For amounts/numbers, use realistic business values
- For dates, use reasonable future dates
- For addresses, use real business addresses

FIELD MAPPING RULES:
- Name/Account Name/Company Name: Use "TechCorp Solutions [timestamp]" format
- First Name: Use professional first names
- Last Name: Use professional last names  
- Email: Use format like "contact[timestamp]@company.com"
- Phone: Use format like "+1-555-[7-digit-number]"
- Website: Use format like "https://company[timestamp].com"
- Annual Revenue: Use values like 1000000, 5000000, etc.
- Employees: Use values like 50, 100, 500, etc.
- Industry: Use values like "Technology", "Manufacturing", etc.
- Description: Use professional business descriptions

Example response format:
{
  "Name": "TechCorp Solutions ${Date.now()}",
  "Email": "contact${Date.now()}@techcorp.com",
  "Phone": "+1-555-${Math.floor(1000000 + Math.random() * 9000000)}",
  "Website": "https://techcorp${Date.now()}.com"
}

Generate data for the provided fields:`;
    
    try {
        console.log('🌐 ENHANCED AI: Calling Gemini for enhanced form data...');
        
        const response = await fetch(`${GEMINI_CONFIG.ENDPOINT}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 3096,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data?.candidates || data.candidates.length === 0) {
            throw new Error('No response from Gemini AI');
        }

        const rawResponse = data.candidates[0].content.parts[0].text;
        console.log('🤖 ENHANCED AI: Raw response received');
        
        return parseEnhancedIntelligentDataResponse(rawResponse, formAnalysis);
        
    } catch (error) {
        console.error('🤖 ENHANCED INTELLIGENT DATA: ❌ Request failed:', error);
        return generateEnhancedFallbackFormData(formAnalysis);
    }
}

// Parse enhanced intelligent data response
function parseEnhancedIntelligentDataResponse(responseText, formAnalysis) {
    try {
        let jsonText = responseText;
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        jsonText = jsonText
            .replace(/```json|```/g, '')
            .replace(/,(\s*})/g, '$1')
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
        
        const generatedData = JSON.parse(jsonText);
        console.log('🤖 ENHANCED PARSING: ✅ Parsed data for', Object.keys(generatedData).length, 'fields');
        return generatedData;
        
    } catch (parseError) {
        console.error('🤖 ENHANCED PARSING: ❌ Parse failed:', parseError);
        return generateEnhancedFallbackFormData(formAnalysis);
    }
}

// Generate enhanced fallback form data
function generateEnhancedFallbackFormData(formAnalysis) {
    const fallbackData = {};
    const timestamp = Date.now();
    
    formAnalysis.fields.forEach((field) => {
        const label = field.label;
        const labelLower = label.toLowerCase();
        
        // Handle picklist fields
        if (field.isPicklist && field.options.length > 0) {
            // Smart option selection
            let selectedOption = field.options[0]; // Default to first option
            
            // Try to find industry-relevant option
            for (const option of field.options) {
                const optionText = option.text.toLowerCase();
                if (optionText.includes('technology') ||
                    optionText.includes('customer') ||
                    optionText.includes('prospect') ||
                    optionText.includes('hot') ||
                    optionText.includes('qualified')) {
                    selectedOption = option;
                    break;
                }
            }
            
            fallbackData[label] = selectedOption.text;
            console.log('🎯 PICKLIST: Selected', selectedOption.text, 'for', label);
            return;
        }
        
        // Handle other field types
        if (field.fieldType === 'email' || labelLower.includes('email')) {
            fallbackData[label] = `contact${timestamp}@techflow.com`;
        } else if (field.fieldType === 'phone' || labelLower.includes('phone')) {
            fallbackData[label] = `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
        } else if (field.fieldType === 'url' || labelLower.includes('website')) {
            fallbackData[label] = `https://techflow${timestamp}.com`;
        } else if (field.fieldType === 'number' || labelLower.includes('revenue')) {
            if (labelLower.includes('employee')) {
                fallbackData[label] = Math.floor(Math.random() * 500) + 50;
            } else if (labelLower.includes('revenue') || labelLower.includes('amount')) {
                fallbackData[label] = Math.floor(Math.random() * 5000000) + 500000;
            } else {
                fallbackData[label] = Math.floor(Math.random() * 1000) + 1;
            }
        } else if (field.fieldType === 'date') {
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + Math.floor(Math.random() * 12) + 1);
            fallbackData[label] = futureDate.toISOString().split('T')[0];
        } else if (field.fieldType === 'firstname') {
            const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
            fallbackData[label] = firstNames[Math.floor(Math.random() * firstNames.length)];
        } else if (field.fieldType === 'lastname') {
            const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
            fallbackData[label] = lastNames[Math.floor(Math.random() * lastNames.length)];
        } else if (field.fieldType === 'company' || (labelLower.includes('name') && labelLower.includes('company'))) {
            fallbackData[label] = `TechFlow Solutions ${timestamp}`;
        } else if (field.fieldType === 'title') {
            const titles = ['CEO', 'CTO', 'VP Sales', 'Director of Operations', 'Senior Manager'];
            fallbackData[label] = titles[Math.floor(Math.random() * titles.length)];
        } else if (field.fieldType === 'textarea') {
            fallbackData[label] = `Comprehensive technology solutions provider focused on innovation and excellence. We deliver high-quality services and products to meet the evolving needs of our clients in the modern business environment.`;
        } else if (labelLower.includes('name')) {
            fallbackData[label] = `Business Value ${timestamp}`;
        } else {
            fallbackData[label] = `Professional Data ${timestamp}`;
        }
    });
    
    return fallbackData;
}

// Execute intelligent autofill
async function executeIntelligentAutofill(tabId, generatedData, formAnalysis) {
    console.log('✨ AUTOFILL: Executing intelligent autofill...');
    
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: performIntelligentAutofillExecution,
            args: [generatedData, formAnalysis, Date.now()]
        }, (result) => {
            if (chrome.runtime.lastError) {
                console.error('✨ AUTOFILL: ❌ Injection failed:', chrome.runtime.lastError);
                reject(new Error(`Autofill injection failed: ${chrome.runtime.lastError.message}`));
            } else {
                console.log('✨ AUTOFILL: ✅ Autofill completed successfully');
                resolve(result);
            }
        });
    });
}

// Enhanced intelligent autofill execution (injected function)
async function performIntelligentAutofillExecution(generatedData, formAnalysis, executionId) {
    console.log('✨ ENHANCED AUTOFILL EXECUTION: Starting...');
    
    // Create enhanced autofill indicator
    const autofillIndicator = document.createElement('div');
    autofillIndicator.style.cssText = `
        position: fixed; top: 80px; right: 20px; z-index: 999999;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white; padding: 20px; border-radius: 12px;
        font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; min-width: 350px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.3);
    `;
    
    document.body.appendChild(autofillIndicator);
    
    function updateAutofillIndicator(message, completed, total) {
        const progress = total > 0 ? (completed / total) * 100 : 0;
        autofillIndicator.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; margin-right: 12px; animation: autofillSpin 1s linear infinite;"></div>
                <strong>✨ Enhanced Autofill</strong>
            </div>
            <div style="margin-bottom: 8px;">Progress: ${completed}/${total} fields</div>
            <div style="background: rgba(255,255,255,0.3); height: 8px; border-radius: 4px; margin-bottom: 12px;">
                <div style="background: white; height: 100%; width: ${progress}%; border-radius: 4px; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        `;
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes autofillSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .autofill-highlight { 
            outline: 3px solid #4CAF50 !important; 
            outline-offset: 2px !important;
            background-color: rgba(76, 175, 80, 0.1) !important;
            transition: all 0.3s ease !important;
        }
    `;
    document.head.appendChild(style);
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function findFormElementByLabel(label) {
        console.log('🔍 ENHANCED FIND: Looking for field with label:', label);
        
        const strategies = [
            // Strategy 1: Lightning component with exact label
            () => document.querySelector(`lightning-input[label="${label}"] input, lightning-textarea[label="${label}"] textarea, lightning-combobox[label="${label}"] input`),
            
            // Strategy 2: Associated label element
            () => {
                const labels = document.querySelectorAll('label');
                for (const labelEl of labels) {
                    const labelText = labelEl.textContent.trim().replace(/\*/g, '').trim();
                    if (labelText === label) {
                        const forId = labelEl.getAttribute('for');
                        if (forId) {
                            return document.getElementById(forId);
                        }
                        const formElement = labelEl.closest('.slds-form-element');
                        if (formElement) {
                            return formElement.querySelector('input:not([type="hidden"]), textarea, select');
                        }
                    }
                }
                return null;
            },
            
            // Strategy 3: ARIA label
            () => document.querySelector(`input[aria-label="${label}"], textarea[aria-label="${label}"], select[aria-label="${label}"]`),
            
            // Strategy 4: Placeholder text
            () => document.querySelector(`input[placeholder="${label}"], textarea[placeholder="${label}"]`),
            
            // Strategy 5: Name attribute (partial match)
            () => document.querySelector(`input[name*="${label.toLowerCase().replace(/\s+/g, '')}"], textarea[name*="${label.toLowerCase().replace(/\s+/g, '')}"]`),
            
            // Strategy 6: Data attributes
            () => document.querySelector(`[data-field-name="${label}"], [field-name="${label}"]`)
        ];
        
        for (const strategy of strategies) {
            try {
                const element = strategy();
                if (element && element.offsetParent !== null && !element.disabled && !element.readOnly) {
                    console.log('🔍 ENHANCED FIND: ✅ Found element for:', label);
                    return element;
                }
            } catch (e) {
                // Continue to next strategy
                console.log('🔍 ENHANCED FIND: Strategy failed, trying next...');
            }
        }
        
        console.log('🔍 ENHANCED FIND: ❌ Element not found for:', label);
        return null;
    }

    async function fillFormElementWithValue(element, value, fieldInfo) {
        console.log('📝 ENHANCED FILL: Filling element with value:', value);
        
        try {
            // Skip if element is not fillable
            if (!element.offsetParent || element.disabled || element.readOnly) {
                console.log('📝 ENHANCED FILL: ⏭️ Skipping disabled/hidden element');
                return false;
            }
            
            // Skip lookup fields
            if (fieldInfo && fieldInfo.isLookup) {
                console.log('📝 ENHANCED FILL: ⏭️ Skipping lookup field:', fieldInfo.label);
                return false;
            }
            
            // Highlight and focus
            element.classList.add('autofill-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            await sleep(400);
            
            let success = false;
            
            // Handle different field types
            if (fieldInfo && fieldInfo.isPicklist) {
                console.log('📝 ENHANCED FILL: 🎯 Handling picklist field');
                success = await fillPicklistField(element, value, fieldInfo);
            } else if (element.tagName.toLowerCase() === 'select') {
                console.log('📝 ENHANCED FILL: 🎯 Handling standard select dropdown');
                success = await fillSelectDropdown(element, value);
            } else if (element.closest('lightning-combobox')) {
                console.log('📝 ENHANCED FILL: 🎯 Handling Lightning combobox');
                success = await fillLightningCombobox(element, value);
            } else if (element.closest('.slds-combobox')) {
                console.log('📝 ENHANCED FILL: 🎯 Handling SLDS combobox');
                success = await fillSldsCombobox(element, value);
            } else {
                console.log('📝 ENHANCED FILL: 📝 Handling regular input/textarea');
                success = await fillRegularInput(element, value);
            }
            
            // Remove highlight
            setTimeout(() => {
                element.classList.remove('autofill-highlight');
            }, 2000);
            
            console.log(`📝 ENHANCED FILL: ${success ? '✅' : '❌'} Result for ${fieldInfo?.label || 'field'}`);
            return success;
            
        } catch (error) {
            console.error('📝 ENHANCED FILL: ❌ Error:', error);
            element.classList.remove('autofill-highlight');
            return false;
        }
    }
    
    async function fillPicklistField(element, value, fieldInfo) {
        // For picklist fields, try to match with available options
        if (fieldInfo.options && fieldInfo.options.length > 0) {
            // Try exact match first
            for (const option of fieldInfo.options) {
                if (option.text.toLowerCase() === value.toLowerCase()) {
                    return await selectPicklistOption(element, option.value);
                }
            }
            
            // Try partial match
            for (const option of fieldInfo.options) {
                if (option.text.toLowerCase().includes(value.toLowerCase()) ||
                    value.toLowerCase().includes(option.text.toLowerCase())) {
                    return await selectPicklistOption(element, option.value);
                }
            }
            
            // Use first valid option as fallback
            const firstValidOption = fieldInfo.options.find(opt => opt.value && opt.value !== '--None--');
            if (firstValidOption) {
                return await selectPicklistOption(element, firstValidOption.value);
            }
        }
        
        return false;
    }
    
    async function selectPicklistOption(element, optionValue) {
        const combobox = element.closest('lightning-combobox, .slds-combobox');
        if (combobox) {
            const button = combobox.querySelector('button, [role="button"]') || element;
            button.click();
            await sleep(1000);
            
            const options = document.querySelectorAll('[role="option"], .slds-dropdown__item');
            for (const option of options) {
                const value = option.getAttribute('data-value') || option.textContent.trim();
                if (value === optionValue) {
                    option.click();
                    await sleep(300);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    async function fillSelectDropdown(element, value) {
        const options = element.querySelectorAll('option');
        
        for (const option of options) {
            if (option.textContent.trim() === value || option.value === value) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        for (const option of options) {
            if (option.textContent.trim().toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(option.textContent.trim().toLowerCase())) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        for (const option of options) {
            if (option.value && option.value !== '' && option.value !== '--None--') {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        return false;
    }
    
    async function fillLightningCombobox(element, value) {
        try {
            const combobox = element.closest('lightning-combobox');
            if (!combobox) return false;
            
            const button = combobox.querySelector('button, [role="button"]') || element;
            button.click();
            await sleep(1000);
            
            const options = document.querySelectorAll('.slds-dropdown__list [role="option"], .slds-listbox__option, lightning-base-combobox-item');
            
            if (options.length > 0) {
                for (const option of options) {
                    const optionText = option.textContent?.trim() || option.getAttribute('data-label') || '';
                    if (optionText === value) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                for (const option of options) {
                    const optionText = option.textContent?.trim() || option.getAttribute('data-label') || '';
                    if (optionText.toLowerCase().includes(value.toLowerCase()) ||
                        value.toLowerCase().includes(optionText.toLowerCase())) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                for (const option of options) {
                    const optionText = option.textContent?.trim() || '';
                    if (optionText && optionText !== '--None--' && optionText !== 'None') {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
            }
            
            button.click();
        } catch (error) {
            console.error('📝 LIGHTNING COMBOBOX: ❌ Error:', error);
        }
        
        return false;
    }
    
    async function fillSldsCombobox(element, value) {
        try {
            const combobox = element.closest('.slds-combobox');
            if (!combobox) return false;
            
            const button = combobox.querySelector('button[aria-haspopup="listbox"], .slds-combobox__input') || element;
            button.click();
            await sleep(1000);
            
            const options = document.querySelectorAll('.slds-dropdown__item, .slds-listbox__option, [role="option"]');
            
            if (options.length > 0) {
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText === value) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText && (optionText.toLowerCase().includes(value.toLowerCase()) ||
                        value.toLowerCase().includes(optionText.toLowerCase()))) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText && optionText !== '--None--') {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
            }
            
            button.click();
        } catch (error) {
            console.error('📝 SLDS COMBOBOX: ❌ Error:', error);
        }
        
        return false;
    }
    
    async function fillRegularInput(element, value) {
        try {
            element.value = '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            
            const stringValue = value.toString();
            for (let i = 0; i < stringValue.length; i++) {
                element.value += stringValue[i];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(30); // Realistic typing speed
            }
            
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            element.dispatchEvent(new CustomEvent('fieldchange', { 
                bubbles: true, 
                detail: { value: stringValue } 
            }));
            
            return true;
            
        } catch (error) {
            console.error('📝 REGULAR INPUT: ❌ Error:', error);
            return false;
        }
    }
    
    try {
        let completed = 0;
        const total = formAnalysis.fields.length;
        
        updateAutofillIndicator('Starting enhanced intelligent autofill...', completed, total);
        await sleep(1000);
        
        console.log(`✨ ENHANCED AUTOFILL: Processing ${total} fields with generated data for ${Object.keys(generatedData).length} fields`);
        
        for (const field of formAnalysis.fields) {
            const value = generatedData[field.label];
            if (value !== undefined && value !== null && value !== '') {
                updateAutofillIndicator(`Filling: ${field.label}`, completed, total);
                
                const element = findFormElementByLabel(field.label);
                if (element) {
                    const success = await fillFormElementWithValue(element, value, field);
                    if (success) {
                        completed++;
                        updateAutofillIndicator(`✅ Filled: ${field.label}`, completed, total);
                    } else {
                        updateAutofillIndicator(`⚠️ Failed: ${field.label}`, completed, total);
                    }
                } else {
                    console.log(`❌ Could not find element for: ${field.label}`);
                    updateAutofillIndicator(`❌ Not found: ${field.label}`, completed, total);
                }
            } else {
                console.log(`⏭️ No data generated for: ${field.label}`);
                updateAutofillIndicator(`⏭️ Skipped: ${field.label}`, completed, total);
            }
            
            await sleep(400); 
        }
        
        autofillIndicator.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        autofillIndicator.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 15px;">🎉</div>
                <div style="font-weight: bold; margin-bottom: 10px;">Enhanced Autofill Complete!</div>
                <div style="margin-bottom: 15px;">Successfully filled ${completed}/${total} fields</div>
                <div style="font-size: 12px; opacity: 0.9; margin-bottom: 15px;">
                    ${completed === total ? 'All fields filled perfectly!' : 
                      completed > total/2 ? 'Most fields filled successfully!' : 
                      'Partial completion - some fields may need manual review'}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">Close</button>
            </div>
        `;
        
        setTimeout(() => {
            if (autofillIndicator.parentNode) autofillIndicator.remove();
        }, 8000);
        
        console.log(`✨ ENHANCED AUTOFILL COMPLETED: ${completed}/${total} fields filled successfully`);
        
    } catch (error) {
        console.error('✨ ENHANCED AUTOFILL EXECUTION: ❌ Error:', error);
        autofillIndicator.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        autofillIndicator.innerHTML = `
            <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 10px;">❌ Autofill Error</div>
                <div style="font-size: 12px; margin-bottom: 15px;">${error.message}</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: rgba(255,255,255,0.3); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
        `;
        
        setTimeout(() => {
            if (autofillIndicator.parentNode) autofillIndicator.remove();
        }, 5000);
    }
}

function getDefaultHybridContext() {
    return {
        url: 'Unknown',
        title: 'Salesforce',
        pageType: 'home',
        currentObject: '',
        hasForm: false,
        formFields: [],
        buttons: [],
        appLauncherAvailable: true,
        timestamp: new Date().toISOString()
    };
}

function updateStatus(message) {
    console.log('🧠 HYBRID BACKGROUND: Status:', message);
    latestStatus = message;
    logger.logCustomEvent('STATUS_UPDATE', { message, timestamp: new Date().toISOString() });
    
    chrome.runtime.sendMessage({ 
        type: "statusUpdate", 
        message: message 
    }).catch(() => {
        // Ignore if popup not open
    });
}



chrome.runtime.onInstalled.addListener(() => {
    console.log('🧠 HYBRID BACKGROUND: Extension installed');
    latestStatus = 'Hybrid automation with intelligent autofill ready';
    logger.logCustomEvent('EXTENSION_INSTALLED', { version: chrome.runtime.getManifest().version });
});

console.log('🧠 HYBRID BACKGROUND: ✅ Fixed hybrid script with dynamic related list detection loaded successfully');
logger.logCustomEvent('SCRIPT_LOADED', { timestamp: new Date().toISOString() });
