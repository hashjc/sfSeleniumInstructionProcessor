// HYBRID GEMINI-POWERED BACKGROUND SCRIPT - Fixed Version
console.log('🧠 HYBRID BACKGROUND: Starting automation with intelligent autofill...');

let latestStatus = 'Hybrid Gemini automation ready';
const activeAutomations = new Set();
const GEMINI_CONFIG = {
    API_KEY: "AIzaSyCDj-g1nBpkiO-HXLKgUFxokD-F2gnKBzs",
    MODEL: "gemini-1.5-flash",
    ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🧠 HYBRID BACKGROUND: *** MESSAGE RECEIVED ***');
    console.log('🧠 HYBRID BACKGROUND: Request:', request);
    
    if (request.type === "getStatus") {
        console.log('🧠 HYBRID BACKGROUND: Status request received');
        sendResponse({ message: latestStatus });
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
    
    return false;
});

// Hybrid Gemini automation handler
async function handleHybridGeminiAutomation(requestData) {
    const { instruction, pageContext, tabId } = requestData;
    
    if (activeAutomations.has(tabId)) {
        throw new Error('Automation already in progress on this tab');
    }
    
    try {
        activeAutomations.add(tabId);
        
        console.log('🧠 HYBRID BACKGROUND: 🤖 Starting hybrid Gemini automation...');
        updateStatus('🧠 Gemini AI: Analyzing instruction and page...');
        
        // Step 1: Get enhanced page context
        const detailedContext = await getHybridPageContext(tabId);
        console.log('🧠 HYBRID BACKGROUND: Page context:', detailedContext);
        
        // Step 2: Decide automation strategy based on context and instruction
        const automationStrategy = determineAutomationStrategy(instruction, detailedContext);
        console.log('🧠 HYBRID BACKGROUND: Strategy:', automationStrategy);
        
        if (automationStrategy.type === 'intelligent_autofill_only') {
            // Just do intelligent autofill on current form
            updateStatus('🔍 Gemini AI: Analyzing current form fields...');
            const formAnalysis = await analyzeCurrentFormFields(tabId);
            
            updateStatus('🤖 Gemini AI: Generating intelligent data...');
            const generatedData = await generateIntelligentFormData(instruction, formAnalysis);
            
            updateStatus('✨ Executing intelligent autofill...');
            await executeIntelligentAutofill(tabId, generatedData, formAnalysis);
            
            return {
                success: true,
                message: 'Intelligent autofill completed',
                type: 'autofill_only',
                fieldsAnalyzed: formAnalysis.fields.length,
                fieldsFilled: Object.keys(generatedData).length
            };
            
        } else {
            // Execute full automation workflow + intelligent autofill
            updateStatus('🤖 Gemini AI: Generating automation workflow...');
            const automationInstructions = await generateHybridGeminiAutomation(instruction, detailedContext);
            console.log('🧠 HYBRID BACKGROUND: Generated instructions:', automationInstructions.length);
            
            updateStatus('🚀 Executing automation with intelligent autofill...');
            await executeHybridAutomation(tabId, automationInstructions, instruction);
            
            return {
                success: true,
                message: 'Hybrid automation completed successfully',
                type: 'full_automation',
                instructionsCount: automationInstructions.length,
                instruction: instruction
            };
        }
        
    } catch (error) {
        console.error('🧠 HYBRID BACKGROUND: ❌ Error:', error);
        updateStatus(`❌ Error: ${error.message}`);
        throw error;
    } finally {
        activeAutomations.delete(tabId);
    }
}

// Determine automation strategy with enhanced parent-child detection
function determineAutomationStrategy(instruction, pageContext) {
    const lowerInstruction = instruction.toLowerCase();
    
    // Enhanced parent-child relationship patterns
    const relationships = {
        'account': {
            children: ['contact', 'opportunity', 'case', 'task', 'event'],
            keywords: ['account', 'company', 'organization', 'business']
        },
        'contact': {
            children: ['opportunity', 'case', 'task', 'event', 'activity'],
            keywords: ['contact', 'person', 'individual', 'lead']
        },
        'opportunity': {
            children: ['quote', 'contract', 'order', 'product', 'task'],
            keywords: ['opportunity', 'deal', 'sale', 'revenue']
        },
        'lead': {
            children: ['task', 'event', 'activity'],
            keywords: ['lead', 'prospect', 'potential']
        },
        'case': {
            children: ['task', 'event', 'solution'],
            keywords: ['case', 'ticket', 'issue', 'problem']
        }
    };
    
    // Detect mentioned objects
    const mentionedObjects = [];
    const relatedKeywords = ['related', 'child', 'associated', 'linked', 'then', 'and', 'also'];
    const hasRelatedInstruction = relatedKeywords.some(keyword => lowerInstruction.includes(keyword));
    
    // Find all mentioned objects
    for (const [parent, config] of Object.entries(relationships)) {
        if (config.keywords.some(keyword => lowerInstruction.includes(keyword))) {
            mentionedObjects.push({
                type: parent,
                isParent: true,
                children: config.children
            });
        }
        
        config.children.forEach(child => {
            if (lowerInstruction.includes(child)) {
                mentionedObjects.push({
                    type: child,
                    isParent: false,
                    potentialParent: parent
                });
            }
        });
    }
    
    // If we're already on a form and instruction is about filling
    if (pageContext.hasForm && pageContext.formFields.length > 0) {
        if (lowerInstruction.includes('fill') || 
            lowerInstruction.includes('autofill') || 
            lowerInstruction.includes('complete') ||
            lowerInstruction.includes('populate')) {
            return {
                type: 'intelligent_autofill_only',
                reason: 'Form detected with fill instruction'
            };
        }
    }
    
    // Determine if this is a parent-child workflow
    if (mentionedObjects.length >= 2 || hasRelatedInstruction) {
        const parentObjects = mentionedObjects.filter(obj => obj.isParent);
        const childObjects = mentionedObjects.filter(obj => !obj.isParent);
        
        if (parentObjects.length > 0 && childObjects.length > 0) {
            return {
                type: 'parent_child_automation',
                parent: parentObjects[0].type,
                children: childObjects.map(obj => obj.type),
                reason: 'Parent-child relationship detected',
                requiresRelatedTab: true
            };
        }
    }
    
    // Single object creation
    if (mentionedObjects.length === 1) {
        return {
            type: 'single_object_automation',
            object: mentionedObjects[0].type,
            reason: 'Single object creation'
        };
    }
    
    // Default to full automation
    return {
        type: 'full_automation_with_autofill',
        reason: 'Default strategy'
    };
}

// Enhanced Gemini prompt creation for parent-child workflows
function createParentChildAutomationPrompt(instruction, pageContext, strategy) {
    // Ensure proper capitalization for Salesforce objects
    const parentCapitalized = strategy.parent.charAt(0).toUpperCase() + strategy.parent.slice(1);
    const childCapitalized = strategy.children[0].charAt(0).toUpperCase() + strategy.children[0].slice(1);
    const parentPlural = parentCapitalized + 's';
    const childPlural = childCapitalized + 's';
    
    return `
You are a Salesforce automation expert creating PRECISE parent-child workflows. Generate automation for: "${instruction}"

CRITICAL REQUIREMENTS FOR PARENT-CHILD WORKFLOW:
1. Create parent record (${parentCapitalized}) first using App Launcher
2. STAY on the parent record detail page after saving
3. Navigate to "Related" tab (NOT the main object tab)
4. Find the ${childPlural} related list section
5. Click "New" button within that specific related list
6. This automatically associates the child with the parent

DETECTED WORKFLOW:
- Parent: ${parentCapitalized}
- Child: ${strategy.children.join(', ')}

CURRENT CONTEXT:
- Page: ${pageContext.pageType}
- Object: ${pageContext.currentObject || 'none'}
- Has Form: ${pageContext.hasForm}

MANDATORY PARENT-CHILD SEQUENCE:
[
  {"action": "click_app_launcher", "description": "Click App Launcher (waffle icon)"},
  {"action": "search_in_app_launcher", "searchTerm": "${parentPlural}", "description": "Search for ${parentPlural}"},
  {"action": "click_search_result", "objectName": "${parentPlural}", "description": "Click ${parentPlural} from results"},
  {"action": "wait_for_list_page", "timeout": 3000, "description": "Wait for ${parentPlural} list"},
  {"action": "click_new_button", "description": "Click New ${parentCapitalized} button"},
  {"action": "wait_for_form", "timeout": 5000, "description": "Wait for ${parentCapitalized} form"},
  {"action": "intelligent_autofill", "instruction": "Create business ${parentCapitalized}", "description": "Fill ${parentCapitalized} form intelligently"},
  {"action": "save_record", "description": "Save ${parentCapitalized}"},
  {"action": "wait_for_save_complete", "timeout": 5000, "description": "Wait for ${parentCapitalized} to save and navigate to detail page"},
  {"action": "navigate_to_related_tab", "relatedObject": "Related", "description": "Navigate to Related tab on ${parentCapitalized} detail page"},
  {"action": "wait_for_related_tab_load", "timeout": 3000, "description": "Wait for Related tab to load"},
  {"action": "find_related_list_section", "objectName": "${childCapitalized}", "description": "Find ${childPlural} related list section"},
  {"action": "click_new_related_button", "objectName": "${childCapitalized}", "description": "Click New ${childCapitalized} from related list"},
  {"action": "wait_for_form", "timeout": 5000, "description": "Wait for ${childCapitalized} form"},
  {"action": "intelligent_autofill", "instruction": "Create professional ${childCapitalized}", "description": "Fill ${childCapitalized} form intelligently"},
  {"action": "save_record", "description": "Save ${childCapitalized}"}
]

CRITICAL: Do NOT navigate to main ${childPlural} tab. Stay on ${parentCapitalized} detail page and use Related tab.

Generate the complete workflow JSON array for "${instruction}". Use EXACT capitalization as shown above:
`;
}

function createSingleObjectAutomationPrompt(instruction, pageContext, strategy) {
    // Ensure proper capitalization
    const objectCapitalized = strategy.object.charAt(0).toUpperCase() + strategy.object.slice(1);
    const objectPlural = objectCapitalized + 's';
    
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
            timestamp: new Date().toISOString()
        };
        
        // Enhanced page type detection
        if (context.url.includes('/lightning/o/') && context.url.includes('/list')) {
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
        
        // Check for forms
        const formElements = document.querySelectorAll('.recordEditContainer, .slds-form, lightning-record-edit-form, form');
        context.hasForm = formElements.length > 0;
        
        // If form detected, analyze fields
        if (context.hasForm) {
            const allInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
            allInputs.forEach((input, index) => {
                if (input.offsetParent !== null && index < 20) { // Limit for performance
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
        
        // Check for App Launcher
        context.appLauncherAvailable = !!document.querySelector('.slds-icon-waffle, button[title*="App Launcher"]');
        
        // Find buttons
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
    
    try {
        const response = await fetch(`${GEMINI_CONFIG.ENDPOINT}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: hybridPrompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 1,
                    topP: 0.8,
                    maxOutputTokens: 4096,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('🧠 HYBRID GEMINI: API Error:', errorText);
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text.trim();
        
        console.log('🧠 HYBRID GEMINI: Response received, length:', responseText.length);
        console.log('response------->>>', JSON.stringify(responseText));       
        return parseHybridGeminiResponse(responseText, instruction);
        
    } catch (error) {
        console.error('🧠 HYBRID GEMINI: ❌ Request failed:', error);
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

// Enhanced fallback instructions with proper capitalization
function createHybridFallbackInstructions(instruction) {
    console.log('🆘 HYBRID FALLBACK: Creating enhanced fallback for:', instruction);
    
    const lowerInstruction = instruction.toLowerCase();
    
    // Enhanced relationship detection with proper capitalization
    const relationships = {
        'account': {
            children: ['contact', 'opportunity', 'case'],
            searchTerm: 'Accounts',
            capitalized: 'Account'
        },
        'contact': {
            children: ['opportunity', 'case', 'task'],
            searchTerm: 'Contacts',
            capitalized: 'Contact'
        },
        'opportunity': {
            children: ['quote', 'contract'],
            searchTerm: 'Opportunities',
            capitalized: 'Opportunity'
        },
        'lead': {
            children: ['task', 'event'],
            searchTerm: 'Leads',
            capitalized: 'Lead'
        }
    };
    
    // Check for related keywords
    const hasRelatedKeywords = ['related', 'child', 'associated', 'linked', 'then', 'and'].some(keyword => 
        lowerInstruction.includes(keyword)
    );
    
    // ENHANCED PARENT-CHILD WORKFLOWS
    
    // Account + Contact (most common)
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
            {"action": "find_related_list_section", "objectName": "Contact", "description": "Find Contacts related list section"},
            {"action": "click_new_related_button", "objectName": "Contact", "description": "Click New Contact from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Contact form"},
            {"action": "intelligent_autofill", "instruction": "Create professional Contact", "description": "Fill Contact form intelligently"},
            {"action": "save_record", "description": "Save Contact"}
        ];
    }
    
    // Account + Opportunity
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
            {"action": "find_related_list_section", "objectName": "Opportunity", "description": "Find Opportunities related list section"},
            {"action": "click_new_related_button", "objectName": "Opportunity", "description": "Click New Opportunity from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Opportunity form"},
            {"action": "intelligent_autofill", "instruction": "Create sales Opportunity", "description": "Fill Opportunity form intelligently"},
            {"action": "save_record", "description": "Save Opportunity"}
        ];
    }
    
    // Contact + Opportunity
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
            {"action": "find_related_list_section", "objectName": "Opportunity", "description": "Find Opportunities related list section"},
            {"action": "click_new_related_button", "objectName": "Opportunity", "description": "Click New Opportunity from related list"},
            {"action": "wait_for_form", "timeout": 5000, "description": "Wait for Opportunity form"},
            {"action": "intelligent_autofill", "instruction": "Create sales Opportunity", "description": "Fill Opportunity form intelligently"},
            {"action": "save_record", "description": "Save Opportunity"}
        ];
    }
    
    // SINGLE OBJECT WORKFLOWS (with proper capitalization)
    
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
    
    // DEFAULT FALLBACK - Account creation with proper capitalization
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
    
    return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: performHybridSalesforceAutomation,
            args: [instructions, originalInstruction, Date.now()]
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

// FIXED Hybrid Salesforce automation (injected function)
async function performHybridSalesforceAutomation(instructions, originalInstruction, executionId) {
    console.log('🎯 HYBRID AUTOMATION: Starting hybrid automation');
    console.log('🎯 HYBRID AUTOMATION: Instructions:', instructions);
    
    // Create enhanced visual indicator
    const indicator = document.createElement('div');
    indicator.id = 'hybrid-automation-indicator';
    indicator.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 999999;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; padding: 25px; border-radius: 15px;
        font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; min-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        border: 2px solid rgba(255,255,255,0.3);
    `;
    
    document.body.appendChild(indicator);
    
    function updateIndicator(message, step = 0) {
        const progress = Math.min((step / instructions.length) * 100, 100);
        indicator.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="width: 24px; height: 24px; border: 3px solid white; border-top: 3px solid transparent; border-radius: 50%; margin-right: 15px; animation: hybridSpin 1s linear infinite;"></div>
                <strong>🚀 Hybrid Automation</strong>
            </div>
            <div style="font-size: 13px; margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                "${originalInstruction}"
            </div>
            <div style="margin-bottom: 10px;">Step ${step + 1} of ${instructions.length}</div>
            <div style="background: rgba(255,255,255,0.3); height: 10px; border-radius: 5px; margin-bottom: 15px;">
                <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); height: 100%; border-radius: 5px; width: ${progress}%; transition: width 0.4s ease;"></div>
            </div>
            <div style="font-size: 13px; font-weight: 500;">${message}</div>
        `;
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes hybridSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hybrid-highlight { outline: 3px solid #4CAF50 !important; outline-offset: 3px !important; }
    `;
    document.head.appendChild(style);
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function clickAppLauncher() {
        console.log('🧭 APP LAUNCHER: Looking for App Launcher...');
        
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
                    await sleep(2500); // Increased wait time for app launcher to open
                    
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
        console.log('🎯 CLICK RESULT: Looking for:', objectName);
        
        await sleep(1500); // Increased wait time for search results
        
        // Enhanced selectors for Salesforce App Launcher
        const resultSelectors = [
            '.slds-app-launcher__tile',
            '.slds-app-launcher__tile-body',
            '.appTile',
            '.slds-app-launcher-item',
            '[data-name*="' + objectName + '"]',
            'a[title*="' + objectName + '"]',
            '.slds-app-launcher__tile a',
            '.oneAppLauncherItem',
            '[data-aura-class*="appLauncher"] a'
        ];
        
        console.log('🎯 CLICK RESULT: Searching with selectors...');
        
        for (const selector of resultSelectors) {
            const results = document.querySelectorAll(selector);
            console.log(`🎯 CLICK RESULT: Found ${results.length} elements with selector: ${selector}`);
            
            for (const result of results) {
                const text = result.textContent?.trim() || '';
                const title = result.title?.trim() || '';
                const ariaLabel = result.getAttribute('aria-label') || '';
                const dataLabel = result.getAttribute('data-label') || '';
                
                // Log what we found for debugging
                console.log('🎯 CLICK RESULT: Examining element:', {
                    text: text,
                    title: title,
                    ariaLabel: ariaLabel,
                    dataLabel: dataLabel
                });
                
                // More flexible matching
                const searchTarget = objectName.toLowerCase();
                const textMatches = text.toLowerCase().includes(searchTarget) ||
                                  title.toLowerCase().includes(searchTarget) ||
                                  ariaLabel.toLowerCase().includes(searchTarget) ||
                                  dataLabel.toLowerCase().includes(searchTarget);
                
                // Also try singular/plural matching
                const singularTarget = searchTarget.endsWith('s') ? searchTarget.slice(0, -1) : searchTarget + 's';
                const singularMatches = text.toLowerCase().includes(singularTarget) ||
                                      title.toLowerCase().includes(singularTarget);
                
                if ((textMatches || singularMatches) && result.offsetParent !== null) {
                    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Try clicking the link if it's a nested structure
                    const clickableElement = result.querySelector('a') || result;
                    clickableElement.click();
                    
                    console.log('🎯 CLICK RESULT: ✅ Clicked:', text || title || objectName);
                    await sleep(3000);
                    return true;
                }
            }
        }
        
        // Enhanced fallback: look for any visible app launcher items
        console.log('🎯 CLICK RESULT: Trying fallback approach...');
        const allItems = document.querySelectorAll('.slds-app-launcher__tile, .appTile, .oneAppLauncherItem, [data-aura-class*="appLauncher"] a');
        console.log('🎯 CLICK RESULT: Found', allItems.length, 'app launcher items for fallback');
        
        for (const item of allItems) {
            if (item.offsetParent !== null) {
                const allText = item.textContent?.toLowerCase() || '';
                console.log('🎯 CLICK RESULT: Fallback examining:', allText);
                
                if (allText.includes(objectName.toLowerCase()) || 
                    allText.includes('account') || 
                    allText.includes('contact') || 
                    allText.includes('opportunity')) {
                    
                    const clickableElement = item.querySelector('a') || item;
                    clickableElement.click();
                    console.log('🎯 CLICK RESULT: ✅ Clicked fallback item');
                    await sleep(3000);
                    return true;
                }
            }
        }
        
        // Ultimate fallback: click first visible item
        const firstItem = document.querySelector('.slds-app-launcher__tile, .appTile');
        if (firstItem && firstItem.offsetParent !== null) {
            const clickableElement = firstItem.querySelector('a') || firstItem;
            clickableElement.click();
            console.log('🎯 CLICK RESULT: ✅ Clicked first available item as last resort');
            await sleep(3000);
            return true;
        }
        
        console.error('🎯 CLICK RESULT: ❌ No app launcher items found');
        throw new Error(`Search result for ${objectName} not found - no app launcher items detected`);
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

    // NEW: Find specific related list section
    async function findRelatedListSection(objectName) {
        console.log('🔍 RELATED SECTION: Looking for', objectName, 'related list section...');
        
        await sleep(2000);
        
        // Look for the specific object section in related lists
        const sectionSelectors = [
            `[data-target-selection-name*="${objectName}"]`,
            `.slds-card__header h3`,
            `.slds-card__header-title`,
            `[title*="${objectName}"]`,
            `.listRelatedObject h3`,
            `.slds-card [title*="${objectName}"]`
        ];
        
        for (const selector of sectionSelectors) {
            const sections = document.querySelectorAll(selector);
            for (const section of sections) {
                const text = section.textContent?.trim() || section.title || '';
                if (text.toLowerCase().includes(objectName.toLowerCase())) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    console.log('🔍 RELATED SECTION: ✅ Found', objectName, 'section');
                    await sleep(1000);
                    return true;
                }
            }
        }
        
        console.log('🔍 RELATED SECTION: ⚠️ Section not found for', objectName);
        return true; // Continue anyway
    }

    // ENHANCED: Better related button clicking
    async function clickNewRelatedButton(objectName) {
        console.log('🆕 NEW RELATED: Looking for New', objectName, 'button...');
        
        await sleep(2000);
        
        // Strategy 1: Look for specific New + Object buttons
        const specificSelectors = [
            `button[title*="New ${objectName}"]`,
            `a[title*="New ${objectName}"]`,
            `button[data-label*="New ${objectName}"]`,
            `.slds-button[title*="New ${objectName}"]`,
            `[data-aura-class*="forceActionLink"][title*="New ${objectName}"]`
        ];
        
        for (const selector of specificSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                if (button.offsetParent !== null) {
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    button.click();
                    console.log('🆕 NEW RELATED: ✅ Clicked specific New', objectName, 'button');
                    await sleep(2000);
                    return true;
                }
            }
        }
        
        // Strategy 2: Look for New button in the correct related list section
        const objectSections = document.querySelectorAll('.slds-card, .listRelatedObject, .relatedListContainer');
        for (const section of objectSections) {
            const sectionText = section.textContent || '';
            if (sectionText.toLowerCase().includes(objectName.toLowerCase())) {
                // Found the right section, now look for New button within it
                const newButtons = section.querySelectorAll('button, a[role="button"]');
                for (const button of newButtons) {
                    const buttonText = button.textContent?.trim()?.toLowerCase() || '';
                    const buttonTitle = button.title?.toLowerCase() || '';
                    if ((buttonText.includes('new') || buttonTitle.includes('new')) && 
                        button.offsetParent !== null) {
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        button.click();
                        console.log('🆕 NEW RELATED: ✅ Clicked New button in', objectName, 'section');
                        await sleep(2000);
                        return true;
                    }
                }
            }
        }
        
        // Strategy 3: Look for dropdown buttons and expand them
        const dropdownButtons = document.querySelectorAll('[data-aura-class*="dropdown"], .slds-dropdown-trigger, button[aria-haspopup="true"]');
        for (const dropdown of dropdownButtons) {
            const parent = dropdown.closest('.slds-card, .listRelatedObject');
            if (parent) {
                const parentText = parent.textContent || '';
                if (parentText.toLowerCase().includes(objectName.toLowerCase())) {
                    dropdown.click();
                    await sleep(1000);
                    console.log('🆕 NEW RELATED: Opened dropdown for', objectName);
                    
                    // Look for New option in dropdown
                    const dropdownOptions = document.querySelectorAll('.slds-dropdown__item, [role="menuitem"]');
                    for (const option of dropdownOptions) {
                        const optionText = option.textContent?.toLowerCase() || '';
                        if (optionText.includes('new')) {
                            option.click();
                            console.log('🆕 NEW RELATED: ✅ Clicked New from dropdown');
                            await sleep(2000);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log('🆕 NEW RELATED: ❌ Could not find New', objectName, 'button');
        throw new Error(`New ${objectName} button not found in related lists`);
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
        
        // Simple placeholder for the automation step - actual autofill happens in performIntelligentAutofillExecution
        // Create a visual indicator that autofill is happening
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
            // Wait for form to be ready
            await sleep(1000);
            
            // Simple form analysis and filling
            const formFields = document.querySelectorAll('input:not([type="hidden"]):not([readonly]):not([disabled]), textarea:not([readonly]):not([disabled]), select:not([disabled])');
            const fillableFields = [];
            
            formFields.forEach((field, index) => {
                if (field.offsetParent !== null) {
                    const label = getFieldLabel(field);
                    if (label && !isLookupField(field)) {
                        fillableFields.push({
                            element: field,
                            label: label,
                            type: field.type || field.tagName.toLowerCase()
                        });
                    }
                }
            });
            
            console.log(`Found ${fillableFields.length} fillable fields`);
            
            if (fillableFields.length > 0) {
                // Generate simple data and fill fields
                let filledCount = 0;
                const timestamp = Date.now();
                
                for (const field of fillableFields) {
                    const value = generateFieldValue(field, instruction, timestamp);
                    if (await fillFieldSimple(field.element, value)) {
                        filledCount++;
                    }
                    await sleep(200);
                }
                
                console.log(`Filled ${filledCount} of ${fillableFields.length} fields`);
                
                autofillNotification.innerHTML = `
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px;">✅ Autofill Complete</div>
                        <div style="font-size: 10px;">Filled ${filledCount}/${fillableFields.length} fields</div>
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
    
    function generateFieldValue(field, instruction, timestamp) {
        const label = field.label.toLowerCase();
        const type = field.type;
        
        // Generate appropriate values based on field type and label
        if (type === 'email' || label.includes('email')) {
            return `contact${timestamp}@business.com`;
        } else if (type === 'tel' || label.includes('phone') || label.includes('mobile')) {
            return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
        } else if (type === 'url' || label.includes('website') || label.includes('url')) {
            return `https://business${timestamp}.com`;
        } else if (type === 'number' || label.includes('revenue') || label.includes('amount')) {
            if (label.includes('employee')) {
                return Math.floor(Math.random() * 500) + 50;
            } else if (label.includes('revenue')) {
                return Math.floor(Math.random() * 5000000) + 500000;
            } else {
                return Math.floor(Math.random() * 1000) + 1;
            }
        } else if (type === 'date' || label.includes('date')) {
            const futureDate = new Date();
            futureDate.setMonth(futureDate.getMonth() + Math.floor(Math.random() * 12) + 1);
            return futureDate.toISOString().split('T')[0];
        } else if (field.element.tagName.toLowerCase() === 'textarea' || label.includes('description')) {
            return `Professional business description for ${instruction}. This is a comprehensive overview of our services and capabilities in the industry.`;
        } else if (label.includes('first name') || label.includes('firstname')) {
            const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (label.includes('last name') || label.includes('lastname')) {
            const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
            return names[Math.floor(Math.random() * names.length)];
        } else if (label.includes('company') || label.includes('account name') || (label.includes('name') && !label.includes('first') && !label.includes('last'))) {
            return `Business Solutions ${timestamp}`;
        } else if (label.includes('title') || label.includes('position') || label.includes('role')) {
            const titles = ['CEO', 'CTO', 'VP Sales', 'Director', 'Manager', 'Specialist'];
            return titles[Math.floor(Math.random() * titles.length)];
        } else if (label.includes('industry') || label.includes('type')) {
            const industries = ['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Education', 'Retail'];
            return industries[Math.floor(Math.random() * industries.length)];
        } else {
            return `Professional Data ${timestamp}`;
        }
    }
    
    async function fillFieldSimple(element, value) {
        try {
            if (!element.offsetParent || element.disabled || element.readOnly) {
                return false;
            }
            
            // Focus and scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            await sleep(100);
            
            // Handle different field types
            if (element.tagName.toLowerCase() === 'select') {
                // Handle select dropdowns
                const options = element.querySelectorAll('option');
                for (const option of options) {
                    const optionText = option.textContent.trim().toLowerCase();
                    const valueText = value.toLowerCase();
                    if (optionText.includes(valueText) || valueText.includes(optionText)) {
                        element.value = option.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
                // Select first non-empty option as fallback
                for (const option of options) {
                    if (option.value && option.value !== '' && option.value !== '--None--') {
                        element.value = option.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        return true;
                    }
                }
            } else {
                // Handle input and textarea fields
                element.value = '';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(50);
                
                // Set the value
                element.value = value;
                
                // Trigger events
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('blur', { bubbles: true }));
                
                return true;
            }
        } catch (error) {
            console.error('Error filling field:', error);
            return false;
        }
        
        return false;
    }

    async function saveRecord() {
        console.log('💾 SAVE: Looking for save button...');
        
        const saveSelectors = [
            'button[title*="Save"]',
            'input[type="submit"]',
            '.slds-button[title*="Save"]',
            'button[data-aura-class*="save"]'
        ];
        
        for (const selector of saveSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                const text = button.textContent?.toLowerCase() || '';
                const title = button.title?.toLowerCase() || '';
                
                if ((text.includes('save') || title.includes('save')) && button.offsetParent !== null) {
                    button.click();
                    console.log('💾 SAVE: ✅ Save button clicked');
                    return true;
                }
            }
        }
        
        // Alternative search
        const allButtons = document.querySelectorAll('button, input[type="submit"]');
        for (const button of allButtons) {
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('save') && button.offsetParent !== null) {
                button.click();
                console.log('💾 SAVE: ✅ Save button clicked (alternative)');
                return true;
            }
        }
        
        return false;
    }
    
    // Execute automation steps
    try {
        updateIndicator('Starting enhanced automation...', 0);
        await sleep(1000);
        
        for (let i = 0; i < instructions.length; i++) {
            const instruction = instructions[i];
            console.log(`🎯 STEP ${i + 1}: ${instruction.action} - ${instruction.description}`);
            updateIndicator(instruction.description, i);
            
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
                    await saveRecord();
                    break;
                    
                case 'wait_for_save_complete':
                    await sleep(instruction.timeout || 5000);
                    break;
                    
                case 'navigate_to_related_tab':
                    await navigateToRelatedTab(instruction.relatedObject);
                    break;
                    
                case 'wait_for_related_tab_load':
                    await sleep(instruction.timeout || 3000);
                    break;
                    
                case 'find_related_list_section':
                    await findRelatedListSection(instruction.objectName);
                    break;
                    
                case 'click_new_related_button':
                    await clickNewRelatedButton(instruction.objectName);
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
        
        return fieldInfo;
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
        
        return null;
    }
    
    function isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 && 
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }
    
    function isFieldExcluded(element) {
        const excludePatterns = [
            'search', 'filter', 'hidden', 'password', 'captcha'
        ];
        
        const elementText = (element.name || element.id || element.className || '').toLowerCase();
        return excludePatterns.some(pattern => elementText.includes(pattern));
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
        // Click to open dropdown
        const combobox = element.closest('lightning-combobox, .slds-combobox');
        if (combobox) {
            const button = combobox.querySelector('button, [role="button"]') || element;
            button.click();
            await sleep(1000);
            
            // Find and click the option
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
        
        // Try exact match first
        for (const option of options) {
            if (option.textContent.trim() === value || option.value === value) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        // Try partial match
        for (const option of options) {
            if (option.textContent.trim().toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(option.textContent.trim().toLowerCase())) {
                element.value = option.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        
        // Select first non-empty option as fallback
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
            
            // Click to open the dropdown
            const button = combobox.querySelector('button, [role="button"]') || element;
            button.click();
            await sleep(1000);
            
            // Look for dropdown options
            const options = document.querySelectorAll('.slds-dropdown__list [role="option"], .slds-listbox__option, lightning-base-combobox-item');
            
            if (options.length > 0) {
                // Try exact match
                for (const option of options) {
                    const optionText = option.textContent?.trim() || option.getAttribute('data-label') || '';
                    if (optionText === value) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                // Try partial match
                for (const option of options) {
                    const optionText = option.textContent?.trim() || option.getAttribute('data-label') || '';
                    if (optionText.toLowerCase().includes(value.toLowerCase()) ||
                        value.toLowerCase().includes(optionText.toLowerCase())) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                // Select first valid option
                for (const option of options) {
                    const optionText = option.textContent?.trim() || '';
                    if (optionText && optionText !== '--None--' && optionText !== 'None') {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
            }
            
            // Close dropdown if still open
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
            
            // Click to open the dropdown
            const button = combobox.querySelector('button[aria-haspopup="listbox"], .slds-combobox__input') || element;
            button.click();
            await sleep(1000);
            
            // Look for dropdown options
            const options = document.querySelectorAll('.slds-dropdown__item, .slds-listbox__option, [role="option"]');
            
            if (options.length > 0) {
                // Try exact match
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText === value) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                // Try partial match
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText && (optionText.toLowerCase().includes(value.toLowerCase()) ||
                        value.toLowerCase().includes(optionText.toLowerCase()))) {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
                
                // Select first valid option
                for (const option of options) {
                    const optionText = option.textContent?.trim();
                    if (optionText && optionText !== '--None--') {
                        option.click();
                        await sleep(300);
                        return true;
                    }
                }
            }
            
            // Close dropdown if still open
            button.click();
        } catch (error) {
            console.error('📝 SLDS COMBOBOX: ❌ Error:', error);
        }
        
        return false;
    }
    
    async function fillRegularInput(element, value) {
        try {
            // Clear existing value
            element.value = '';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            
            // Type character by character for realistic effect
            const stringValue = value.toString();
            for (let i = 0; i < stringValue.length; i++) {
                element.value += stringValue[i];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(30); // Realistic typing speed
            }
            
            // Trigger all necessary events
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Additional events for Salesforce Lightning
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
                
                // Find and fill the field
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
            
            await sleep(400); // Pause between fields for better visual feedback
        }
        
        // Show completion with enhanced styling
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
    
    chrome.runtime.sendMessage({ 
        type: "statusUpdate", 
        message: message 
    }).catch(() => {
        // Ignore if popup not open
    });
}

// Extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
    console.log('🧠 HYBRID BACKGROUND: Extension installed');
    latestStatus = 'Hybrid automation with intelligent autofill ready';
});

console.log('🧠 HYBRID BACKGROUND: ✅ Fixed hybrid script loaded successfully');
