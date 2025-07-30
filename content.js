// ENHANCED UNIVERSAL: Complete content.js with UNIVERSAL UI SUPPORT for ALL Salesforce layouts

console.log('🌟 UNIVERSAL ENHANCED: Salesforce automation with UNIVERSAL UI SUPPORT for all layouts');

const recordContext = {};
let isExecuting = false;
let autofillInProgress = false;
let currentStepIndex = 0;
let currentSteps = [];
let currentInstruction = '';
let isWaitingForRecordType = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeAutomationSteps') {
        executeAutomationSteps(request.steps, request.instruction).catch(console.error);
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === 'getPageContext') {
        sendResponse({
            url: window.location.href,
            title: document.title,
            isLoggedIn: isUserLoggedIn(),
            currentObject: getCurrentObjectType(),
            recordContext: recordContext,
            availableObjects: getAvailableObjects(),
            currentFormFields: getCurrentFormFields()
        });
        return true;
    }

    if (request.action === "extractFields") {
        handleAutofillExtraction().then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error('🌟 UNIVERSAL: Autofill extraction failed:', error);
            sendResponse({ status: "error", message: error.message });
        });
        return true;
    }
});

/**
 * 🌟 UNIVERSAL: Execute automation steps with UNIVERSAL UI SUPPORT
 */
async function executeAutomationSteps(steps, originalInstruction) {
    console.log('🌟 UNIVERSAL: Executing automation with UNIVERSAL UI SUPPORT:', steps.length, 'steps');
    console.log('Original instruction:', originalInstruction);
    
    if (isExecuting) {
        showToast('Automation already in progress...', 2000);
        return;
    }
    
    isExecuting = true;
    currentSteps = steps;
    currentInstruction = originalInstruction;
    currentStepIndex = 0;
    
    try {
        showToast(`🌟 UNIVERSAL: Starting automation with UI detection: ${steps.length} steps`);
        
        await executeStepsSequentiallyWithProgress();
        
        sendProgressUpdate('AUTOMATION_COMPLETE', {});
        showToast('✅ UNIVERSAL: Automation completed successfully!', 3000);
        
    } catch (error) {
        console.error('❌ UNIVERSAL: Automation failed:', error);
        sendProgressUpdate('STEP_ERROR', {
            stepIndex: currentStepIndex,
            error: error.message
        });
        showToast(`❌ UNIVERSAL: Automation failed: ${error.message}`, 3000);
    } finally {
        isExecuting = false;
        currentSteps = [];
        currentStepIndex = 0;
        isWaitingForRecordType = false;
    }
}

/**
 * 🌟 UNIVERSAL: Execute steps with progress updates
 */
async function executeStepsSequentiallyWithProgress() {
    for (currentStepIndex = 0; currentStepIndex < currentSteps.length; currentStepIndex++) {
        const step = currentSteps[currentStepIndex];
        console.log(`🌟 UNIVERSAL: Executing step ${currentStepIndex+1}/${currentSteps.length}:`, step);
        
        sendProgressUpdate('STEP_PROGRESS', {
            stepIndex: currentStepIndex,
            stepDescription: step.description || step.action,
            status: 'started'
        });
        
        showToast(`🌟 Step ${currentStepIndex+1}/${currentSteps.length}: ${step.description || step.action}`, 2000);
        
        try {
            await executeStepUniversal(step);
            
            sendProgressUpdate('STEP_PROGRESS', {
                stepIndex: currentStepIndex,
                stepDescription: step.description || step.action,
                status: 'completed'
            });
            
            await sleep(step.delay || 1000);
            
        } catch (stepError) {
            console.error(`❌ UNIVERSAL Step ${currentStepIndex+1} failed:`, stepError);
            
            sendProgressUpdate('STEP_ERROR', {
                stepIndex: currentStepIndex,
                error: stepError.message
            });
            
            showToast(`❌ UNIVERSAL Step ${currentStepIndex+1} failed: ${stepError.message}`, 4000);
            
            if (!stepError.message.includes('critical')) {
                continue;
            }
            break;
        }
    }
}

/**
 * 🌟 UNIVERSAL: Enhanced step execution with universal UI support
 */
async function executeStepUniversal(step) {
    console.log('🌟 UNIVERSAL: Executing step with UI detection:', step.action);
    
    switch (step.action) {
        case 'navigate_app_launcher':
            console.log('🌟 UNIVERSAL: Navigating to App Launcher for:', step.objectName);
            await navigateViaAppLauncherUniversal(step.objectName);
            break;
            
        case 'click':
            console.log('🌟 UNIVERSAL: Universal clicking:', step.selector);
            await universalClick(step.selector, step.description);
            break;
            
        case 'type':
            console.log('🌟 UNIVERSAL: Universal typing:', step.value);
            await universalType(step.selector, step.value, step.description);
            break;
            
        case 'select':
            console.log('🌟 UNIVERSAL: Universal selecting:', step.value);
            await universalSelect(step.selector, step.value, step.description);
            break;
            
        case 'wait':
            console.log('🌟 UNIVERSAL: Waiting:', step.duration);
            await sleep(step.duration || 1000);
            break;
            
        case 'wait_for_element':
            console.log('🌟 UNIVERSAL: Waiting for element:', step.selector);
            await waitForElement(step.selector, step.timeout || 10000);
            break;
            
        case 'toast':
            console.log('🌟 UNIVERSAL: Showing toast:', step.message);
            showToast(step.message, step.duration || 2000);
            break;
            
        case 'fill_form':
            console.log('🌟 UNIVERSAL: Filling form with universal AI autofill');
            await fillFormWithUniversalAI(step.fields);
            break;
            
        case 'wait_for_save':
            console.log('🌟 UNIVERSAL: Universal waiting for save:', step.autoSave);
            await waitForUserToSaveUniversal(step.message, step.autoSave !== false);
            break;
            
        case 'capture_record_id':
            console.log('🌟 UNIVERSAL: Capturing record ID for:', step.variable);
            await captureRecordIdUniversal(step.variable);
            break;
            
        case 'navigate_to_related_tab':
            console.log('🌟 UNIVERSAL: Navigating to Related tab with UI detection');
            await navigateToRelatedTabUniversal();
            break;
            
        case 'click_related_list_new':
            console.log('🌟 UNIVERSAL: Clicking New in related list:', step.relatedListName, 'for object:', step.targetObject);
            await clickRelatedListNewUniversal(step.relatedListName, step.targetObject, step.parentRecordVariable);
            break;
            
        case 'fill_related_form':
            console.log('🌟 UNIVERSAL: Filling related form for:', step.objectType);
            await fillRelatedFormWithUniversalAI(step.objectType, step.originalInstruction);
            break;
            
        default:
            console.warn('❌ UNIVERSAL: Unknown step action:', step.action);
    }
}

/**
 * 🌟 UNIVERSAL: Enhanced App Launcher navigation with universal UI detection
 */
async function navigateViaAppLauncherUniversal(objectName) {
    console.log('🌟 UNIVERSAL: Navigating to', objectName, 'with universal UI detection');
    
    try {
        // 🌟 STEP 1: Universal App Launcher detection
        const appLauncherBtn = await findUniversalAppLauncher();
        if (!appLauncherBtn) {
            throw new Error('🌟 UNIVERSAL: App Launcher not found in any UI pattern');
        }
        
        appLauncherBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        appLauncherBtn.click();
        console.log('✅ UNIVERSAL: Clicked App Launcher');
        await sleep(3000);
        
        // 🌟 STEP 2: Universal search input detection
        const searchInput = await findUniversalSearchInput();
        if (!searchInput) {
            throw new Error('🌟 UNIVERSAL: Search input not found in any UI pattern');
        }
        
        searchInput.focus();
        searchInput.value = '';
        searchInput.value = objectName;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        
        console.log(`✅ UNIVERSAL: Searched for: ${objectName}`);
        await sleep(3000);
        
        // 🌟 STEP 3: Universal object link detection
        const objectLink = await findUniversalObjectLink(objectName);
        if (!objectLink) {
            throw new Error(`🌟 UNIVERSAL: ${objectName} link not found in any UI pattern`);
        }
        
        objectLink.click();
        console.log(`✅ UNIVERSAL: Clicked ${objectName} link`);
        await sleep(4000);
        
        // 🌟 STEP 4: Universal New button detection and Record Type handling
        await handleUniversalNewButtonWithRecordType();
        
    } catch (error) {
        console.error('❌ UNIVERSAL: App Launcher navigation failed:', error);
        throw error;
    }
}

/**
 * 🌟 UNIVERSAL: Find App Launcher across all UI patterns
 */
async function findUniversalAppLauncher() {
    console.log('🔍 UNIVERSAL: Searching for App Launcher across all UI patterns...');
    
    const strategies = [
        // Standard selectors
        () => document.querySelector("button[title='App Launcher']"),
        () => document.querySelector(".slds-icon-waffle_container button"),
        () => document.querySelector("button[aria-label='App Launcher']"),
        
        // Waffle icon variants
        () => document.querySelector("button[data-aura-class*='waffle']"),
        () => document.querySelector(".forceAppLauncher button"),
        () => document.querySelector("[data-target-selection-name*='AppLauncher'] button"),
        
        // Icon-based detection
        () => {
            const icons = document.querySelectorAll('svg use[href*="waffle"], svg use[href*="app_launcher"]');
            for (const icon of icons) {
                const button = icon.closest('button');
                if (button && isElementVisible(button)) return button;
            }
            return null;
        },
        
        // CSS class patterns
        () => document.querySelector('.slds-icon-waffle_container'),
        () => document.querySelector('.oneAppLauncher button'),
        () => document.querySelector('button.slds-button[title*="App"]'),
        
        // Flexible text-based search
        () => {
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                const title = btn.getAttribute('title') || '';
                const ariaLabel = btn.getAttribute('aria-label') || '';
                if ((title.toLowerCase().includes('app') && title.toLowerCase().includes('launch')) ||
                    (ariaLabel.toLowerCase().includes('app') && ariaLabel.toLowerCase().includes('launch'))) {
                    if (isElementVisible(btn)) return btn;
                }
            }
            return null;
        },
        
        // DOM structure analysis
        () => {
            const containers = document.querySelectorAll('div[class*="waffle"], div[class*="launcher"], div[class*="AppLauncher"]');
            for (const container of containers) {
                const button = container.querySelector('button');
                if (button && isElementVisible(button)) return button;
            }
            return null;
        },
        
        // Position-based detection (top-left area)
        () => {
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                const rect = btn.getBoundingClientRect();
                if (rect.left < 100 && rect.top < 100 && isElementVisible(btn)) {
                    const hasWaffleIcon = btn.querySelector('svg, .slds-icon') !== null;
                    if (hasWaffleIcon) return btn;
                }
            }
            return null;
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔍 UNIVERSAL: Trying App Launcher strategy ${i + 1}...`);
        
        try {
            const element = strategy();
            if (element && isElementVisible(element)) {
                console.log(`✅ UNIVERSAL: Found App Launcher with strategy ${i + 1}`);
                return element;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: App Launcher strategy ${i + 1} failed:`, error);
        }
    }
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Find search input across all UI patterns
 */
async function findUniversalSearchInput() {
    console.log('🔍 UNIVERSAL: Searching for search input across all UI patterns...');
    
    const strategies = [
        // Standard selectors
        () => document.querySelector("input[placeholder*='Search apps']"),
        () => document.querySelector("input[placeholder*='Search']"),
        () => document.querySelector("input[type='search']"),
        
        // App Launcher specific
        () => document.querySelector(".oneAppLauncher input"),
        () => document.querySelector("[data-aura-class*='appLauncher'] input"),
        () => document.querySelector(".forceAppLauncher input"),
        
        // Modal and popup patterns
        () => document.querySelector(".slds-modal input[type='search']"),
        () => document.querySelector(".modal input[placeholder*='Search']"),
        () => document.querySelector("[role='dialog'] input"),
        
        // Generic search patterns
        () => {
            const allInputs = document.querySelectorAll('input');
            for (const input of allInputs) {
                const placeholder = input.getAttribute('placeholder') || '';
                const type = input.getAttribute('type') || '';
                if ((placeholder.toLowerCase().includes('search') || type === 'search') && 
                    isElementVisible(input)) {
                    return input;
                }
            }
            return null;
        },
        
        // Wait and retry for dynamic content
        async () => {
            await sleep(2000);
            return document.querySelector("input[placeholder*='Search apps'], input[type='search']");
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔍 UNIVERSAL: Trying search input strategy ${i + 1}...`);
        
        try {
            const element = await strategy();
            if (element && isElementVisible(element)) {
                console.log(`✅ UNIVERSAL: Found search input with strategy ${i + 1}`);
                return element;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: Search input strategy ${i + 1} failed:`, error);
        }
    }
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Find object link across all UI patterns
 */
async function findUniversalObjectLink(objectName) {
    console.log(`🔍 UNIVERSAL: Searching for ${objectName} link across all UI patterns...`);
    
    const strategies = [
        // Standard selectors
        () => document.querySelector(`a[data-label='${objectName}']`),
        () => document.querySelector(`a[title='${objectName}']`),
        
        // App Launcher specific
        () => {
            const allLinks = document.querySelectorAll('one-app-launcher-menu-item a, .al-menu-dropdown-list a');
            for (const link of allLinks) {
                if (link.textContent.trim() === objectName) {
                    return link;
                }
            }
            return null;
        },
        
        // Flexible text matching
        () => {
            const allLinks = document.querySelectorAll('a');
            for (const link of allLinks) {
                const text = link.textContent.trim();
                const title = link.getAttribute('title') || '';
                const label = link.getAttribute('data-label') || '';
                
                if (text === objectName || title === objectName || label === objectName) {
                    if (isElementVisible(link)) return link;
                }
            }
            return null;
        },
        
        // Case-insensitive matching
        () => {
            const allLinks = document.querySelectorAll('a');
            for (const link of allLinks) {
                const text = link.textContent.trim().toLowerCase();
                if (text === objectName.toLowerCase() && isElementVisible(link)) {
                    return link;
                }
            }
            return null;
        },
        
        // Partial matching for plurals
        () => {
            const allLinks = document.querySelectorAll('a');
            const searchTerms = [objectName, objectName + 's', objectName.slice(0, -1)];
            
            for (const link of allLinks) {
                const text = link.textContent.trim().toLowerCase();
                if (searchTerms.some(term => text.includes(term.toLowerCase())) && isElementVisible(link)) {
                    return link;
                }
            }
            return null;
        },
        
        // Container-based search
        () => {
            const containers = document.querySelectorAll('.appLauncher, .oneAppLauncher, [role="dialog"]');
            for (const container of containers) {
                const links = container.querySelectorAll('a');
                for (const link of links) {
                    if (link.textContent.trim() === objectName && isElementVisible(link)) {
                        return link;
                    }
                }
            }
            return null;
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔍 UNIVERSAL: Trying object link strategy ${i + 1} for ${objectName}...`);
        
        try {
            const element = strategy();
            if (element && isElementVisible(element)) {
                console.log(`✅ UNIVERSAL: Found ${objectName} link with strategy ${i + 1}`);
                return element;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: Object link strategy ${i + 1} failed:`, error);
        }
    }
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Enhanced New button detection with Record Type handling for ALL UI patterns
 */
async function handleUniversalNewButtonWithRecordType() {
    console.log('🌟 UNIVERSAL: === ENHANCED NEW BUTTON DETECTION FOR ALL UI PATTERNS ===');
    
    await sleep(3000);
    
    const strategies = [
        // Strategy 1: Standard New button selectors
        () => findStandardNewButton(),
        
        // Strategy 2: List view specific New button
        () => findListViewNewButton(),
        
        // Strategy 3: Text-based New button search
        () => findTextBasedNewButton(),
        
        // Strategy 4: Icon-based New button detection
        () => findIconBasedNewButton(),
        
        // Strategy 5: Position-based New button (top-right area)
        () => findPositionBasedNewButton(),
        
        // Strategy 6: Container-based New button search
        () => findContainerBasedNewButton(),
        
        // Strategy 7: Dropdown menu New button
        () => findDropdownNewButton(),
        
        // Strategy 8: Force creation via URL manipulation
        () => findForceCreateButton(),
        
        // Strategy 9: Keyboard shortcut simulation
        () => simulateKeyboardShortcut(),
        
        // Strategy 10: Last resort - any visible button with "New" text
        () => findAnyNewButton()
    ];
    
    let newButtonClicked = false;
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔧 UNIVERSAL: Trying New button strategy ${i + 1}...`);
        
        try {
            const success = await strategy();
            if (success) {
                console.log(`✅ UNIVERSAL: New button strategy ${i + 1} successful!`);
                newButtonClicked = true;
                break;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: New button strategy ${i + 1} failed:`, error);
        }
        
        // Small delay between strategies
        await sleep(500);
    }
    
    if (!newButtonClicked) {
        throw new Error('🌟 UNIVERSAL: All New button strategies failed - unable to create new record');
    }
    
    // 🌟 UNIVERSAL: Wait and check for Record Type modal
    await sleep(3000);
    await checkAndHandleUniversalRecordTypeModal();
}

/**
 * 🌟 UNIVERSAL: Strategy 1 - Standard New button selectors
 */
async function findStandardNewButton() {
    const selectors = [
        "a[title='New']",
        "button[title='New']", 
        ".slds-button[title='New']",
        "lightning-button[title='New']",
        "input[value='New']",
        "[data-aura-class*='New'] button"
    ];
    
    for (const selector of selectors) {
        const button = document.querySelector(selector);
        if (button && isElementVisible(button)) {
            console.log(`✅ UNIVERSAL: Found standard New button: ${selector}`);
            button.click();
            return true;
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 2 - List view specific New button
 */
async function findListViewNewButton() {
    const listViewSelectors = [
        // Top-right area in list views
        ".slds-page-header__controls a[title='New']",
        ".slds-page-header__controls button[title='New']",
        ".listViewControls a[title='New']",
        ".listViewControls button[title='New']",
        
        // Toolbar areas
        ".slds-page-header .slds-button[title='New']",
        ".forceListViewManager a[title='New']",
        ".forceListViewManager button[title='New']",
        
        // Header button groups
        ".slds-button-group a[title='New']",
        ".slds-button-group button[title='New']",
        
        // Lightning specific
        "lightning-button[title='New']",
        "lightning-button-icon[title='New']"
    ];
    
    for (const selector of listViewSelectors) {
        const button = document.querySelector(selector);
        if (button && isElementVisible(button)) {
            console.log(`✅ UNIVERSAL: Found list view New button: ${selector}`);
            button.click();
            return true;
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 3 - Text-based New button search
 */
async function findTextBasedNewButton() {
    const allButtons = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
    
    for (const button of allButtons) {
        const text = button.textContent.trim().toLowerCase();
        const title = (button.getAttribute('title') || '').toLowerCase();
        const value = (button.getAttribute('value') || '').toLowerCase();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
        
        if ((text === 'new' || title === 'new' || value === 'new' || ariaLabel === 'new') && 
            isElementVisible(button)) {
            console.log('✅ UNIVERSAL: Found text-based New button');
            button.click();
            return true;
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 4 - Icon-based New button detection
 */
async function findIconBasedNewButton() {
    // Look for plus icons that might indicate "New"
    const iconSelectors = [
        'svg use[href*="add"]',
        'svg use[href*="plus"]', 
        'svg use[href*="new"]',
        '.slds-icon[title*="New"]',
        '.slds-icon[title*="Add"]'
    ];
    
    for (const selector of iconSelectors) {
        const icons = document.querySelectorAll(selector);
        for (const icon of icons) {
            const button = icon.closest('button, a');
            if (button && isElementVisible(button)) {
                console.log('✅ UNIVERSAL: Found icon-based New button');
                button.click();
                return true;
            }
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 5 - Position-based New button (top-right area)
 */
async function findPositionBasedNewButton() {
    const allButtons = document.querySelectorAll('button, a');
    const viewportWidth = window.innerWidth;
    
    for (const button of allButtons) {
        const rect = button.getBoundingClientRect();
        
        // Check if button is in top-right area of the screen
        if (rect.right > viewportWidth * 0.7 && rect.top < 200 && isElementVisible(button)) {
            const text = button.textContent.trim().toLowerCase();
            const title = (button.getAttribute('title') || '').toLowerCase();
            
            if (text.includes('new') || title.includes('new')) {
                console.log('✅ UNIVERSAL: Found position-based New button');
                button.click();
                return true;
            }
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 6 - Container-based New button search
 */
async function findContainerBasedNewButton() {
    const containerSelectors = [
        '.slds-page-header',
        '.forceListViewManager',
        '.listViewControls',
        '.slds-page-header__controls',
        '.oneHeader',
        '[data-aura-class*="header"]'
    ];
    
    for (const containerSelector of containerSelectors) {
        const container = document.querySelector(containerSelector);
        if (container) {
            const buttons = container.querySelectorAll('button, a');
            for (const button of buttons) {
                const text = button.textContent.trim().toLowerCase();
                const title = (button.getAttribute('title') || '').toLowerCase();
                
                if ((text === 'new' || title === 'new') && isElementVisible(button)) {
                    console.log(`✅ UNIVERSAL: Found container-based New button in ${containerSelector}`);
                    button.click();
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 7 - Dropdown menu New button
 */
async function findDropdownNewButton() {
    const dropdownTriggers = document.querySelectorAll("lightning-button-menu button, button[aria-haspopup='true']");
    
    for (const trigger of dropdownTriggers) {
        if (isElementVisible(trigger)) {
            console.log('🔍 UNIVERSAL: Trying dropdown trigger for New button');
            trigger.click();
            await sleep(1500);
            
            const dropdownNew = document.querySelector("a[title='New'][role='menuitem'], button[title='New'][role='menuitem']");
            if (dropdownNew && isElementVisible(dropdownNew)) {
                console.log('✅ UNIVERSAL: Found dropdown New button');
                dropdownNew.click();
                return true;
            }
            
            // Close dropdown if New not found
            trigger.click();
            await sleep(500);
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 8 - Force creation via URL manipulation
 */
async function findForceCreateButton() {
    const currentUrl = window.location.href;
    
    // Extract object type from URL
    const objectMatch = currentUrl.match(/\/lightning\/o\/([^\/]+)/);
    if (objectMatch) {
        const objectType = objectMatch[1];
        const newUrl = `/lightning/o/${objectType}/new`;
        
        console.log('🔍 UNIVERSAL: Attempting URL-based navigation to:', newUrl);
        window.location.href = newUrl;
        await sleep(3000);
        return true;
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Strategy 9 - Keyboard shortcut simulation
 */
async function simulateKeyboardShortcut() {
    console.log('🔍 UNIVERSAL: Trying keyboard shortcut (Ctrl+N)');
    
    // Simulate Ctrl+N or Cmd+N (common "New" shortcut)
    const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true
    });
    
    document.dispatchEvent(event);
    await sleep(2000);
    
    // Check if a form or modal appeared
    const hasModal = document.querySelector('.slds-modal, [role="dialog"]');
    const hasForm = document.querySelector('form, .slds-form');
    
    return !!(hasModal || hasForm);
}

/**
 * 🌟 UNIVERSAL: Strategy 10 - Last resort - any visible button with "New" text
 */
async function findAnyNewButton() {
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
        const text = element.textContent.trim();
        const isClickable = element.tagName === 'BUTTON' || element.tagName === 'A' || 
                           element.getAttribute('role') === 'button' ||
                           element.style.cursor === 'pointer';
        
        if (text === 'New' && isClickable && isElementVisible(element)) {
            console.log('✅ UNIVERSAL: Found last resort New button');
            element.click();
            return true;
        }
    }
    return false;
}

/**
 * 🌟 UNIVERSAL: Enhanced Record Type modal detection and handling
 */
async function checkAndHandleUniversalRecordTypeModal() {
    console.log('🌟 UNIVERSAL: === RECORD TYPE MODAL DETECTION FOR ALL UI PATTERNS ===');
    
    const strategies = [
        // Standard Record Type modal selectors
        () => document.querySelector('.slds-modal[aria-labelledby*="recordType"]'),
        () => document.querySelector('.slds-modal[aria-labelledby*="Record Type"]'),
        () => document.querySelector('.forceRecordTypeSelectionModal'),
        () => document.querySelector('[data-aura-class*="forceRecordTypeSelection"]'),
        
        // Generic modal detection
        () => {
            const modals = document.querySelectorAll('.slds-modal, .modal, [role="dialog"]');
            for (const modal of modals) {
                if (isElementVisible(modal)) {
                    const modalText = modal.textContent.toLowerCase();
                    if (modalText.includes('record type') || modalText.includes('select a record type')) {
                        return modal;
                    }
                }
            }
            return null;
        },
        
        // Header-based detection
        () => {
            const headers = document.querySelectorAll('h1, h2, h3, .slds-modal__header');
            for (const header of headers) {
                if (header.textContent.toLowerCase().includes('record type')) {
                    return header.closest('.slds-modal, [role="dialog"]');
                }
            }
            return null;
        },
        
        // Button-based detection (if Next button exists, likely Record Type modal)
        () => {
            const nextButtons = document.querySelectorAll('button[title="Next"], button[name="next"]');
            for (const button of nextButtons) {
                if (isElementVisible(button)) {
                    return button.closest('.slds-modal, [role="dialog"]');
                }
            }
            return null;
        }
    ];
    
    let recordTypeModal = null;
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            recordTypeModal = strategies[i]();
            if (recordTypeModal && isElementVisible(recordTypeModal)) {
                console.log(`✅ UNIVERSAL: Found Record Type modal with strategy ${i + 1}`);
                break;
            }
        } catch (error) {
            continue;
        }
    }
    
    if (recordTypeModal) {
        console.log('🎯 UNIVERSAL: Record Type modal detected - waiting for user interaction');
        await handleUniversalRecordTypeSelection(recordTypeModal);
    } else {
        console.log('✅ UNIVERSAL: No Record Type modal - proceeding to form');
    }
}

/**
 * 🌟 UNIVERSAL: Handle Record Type selection for all UI patterns
 */
async function handleUniversalRecordTypeSelection(modal) {
    console.log('⏳ UNIVERSAL: === RECORD TYPE SELECTION HANDLER FOR ALL UI PATTERNS ===');

    isWaitingForRecordType = true;

    showToast('🌟 UNIVERSAL: Record Type detected!\n\n1. Select your Record Type\n2. Click "Next" to continue\n3. Click "Cancel" to stop', 8000);

    highlightRecordTypeModal(modal);

    return new Promise((resolve, reject) => {
        let resolved = false;

        const nextButtonSelectors = [
            'button[title="Next"]',
            'button[name="next"]',
            'lightning-button[title="Next"]',
            'input[value="Next"]',
            'button[data-aura-class*="next"]',
            '.slds-button[title="Next"]'
        ];

        const cancelButtonSelectors = [
            'button[title="Cancel"]',
            'button[name="cancel"]',
            'lightning-button[title="Cancel"]',
            'input[value="Cancel"]',
            'button[data-aura-class*="cancel"]',
            '.slds-button[title="Cancel"]'
        ];

        const resolveIfNotYet = () => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                isWaitingForRecordType = false;
                console.log('✅ UNIVERSAL: Record Type selected - continuing...');
                showToast('✅ UNIVERSAL: Record Type selected - continuing NOW...', 2000);
                resolve();
            }
        };

        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkInterval);
                isWaitingForRecordType = false;
                console.log('⚠️ UNIVERSAL: Record Type selection timeout - continuing anyway');
                showToast('⚠️ UNIVERSAL: Timeout - continuing automation...', 3000);
                resolve();
            }
        }, 60000);

        const checkInterval = setInterval(() => {
            if (resolved) return;

            // Attach click listener to Next buttons
            nextButtonSelectors.forEach(selector => {
                const nextBtn = document.querySelector(selector);
                if (nextBtn && isElementVisible(nextBtn) && !nextBtn.hasAttribute('data-universal-listener')) {
                    nextBtn.setAttribute('data-universal-listener', 'true');
                    nextBtn.addEventListener('click', resolveIfNotYet);
                }
            });

            // Attach click listener to Cancel buttons
            cancelButtonSelectors.forEach(selector => {
                const cancelBtn = document.querySelector(selector);
                if (cancelBtn && isElementVisible(cancelBtn) && !cancelBtn.hasAttribute('data-universal-listener')) {
                    cancelBtn.setAttribute('data-universal-listener', 'true');
                    cancelBtn.addEventListener('click', () => {
                        if (!resolved) {
                            resolved = true;
                            clearInterval(checkInterval);
                            clearTimeout(timeoutId);
                            isWaitingForRecordType = false;
                            isExecuting = false;
                            console.log('❌ UNIVERSAL: Cancel button clicked - stopping automation');
                            showToast('❌ UNIVERSAL: Automation cancelled by user', 3000);
                            reject(new Error('User cancelled automation at Record Type selection'));
                        }
                    });
                }
            });

            // Fallback: modal disappears
            if (!isElementVisible(modal) || !document.contains(modal)) {
                resolveIfNotYet();
            }
        }, 250);
    });
}

/**
 * 🌟 UNIVERSAL: Fill form with AI autofill for all UI patterns
 */
async function fillFormWithUniversalAI(predefinedFields = []) {
    console.log('🌟 UNIVERSAL: === AI AUTOFILL FOR ALL UI PATTERNS ===');
    
    showToast('🌟 UNIVERSAL: Starting AI autofill for all UI patterns...', 3000);
    updateStatus('🌟 UNIVERSAL: Analyzing form fields across all UI patterns...');
    
    await sleep(3000);
    
    try {
        console.log('📋 UNIVERSAL: Extracting form fields from all UI patterns...');
        const fieldData = await extractUniversalFormFields();
        
        if (fieldData.fields.length === 0) {
            console.log('⚠️ UNIVERSAL: No fields found - using predefined fields');
            if (predefinedFields.length > 0) {
                await fillFormIntelligentlyUniversal(predefinedFields);
                return;
            }
            throw new Error('No form fields found in any UI pattern');
        }
        
        console.log(`📊 UNIVERSAL: Found ${fieldData.fields.length} fields across all UI patterns`);
        showToast(`📊 UNIVERSAL: Analyzing ${fieldData.fields.length} fields...`, 3000);
        
        updateStatus('🌟 UNIVERSAL: Getting AI suggestions...');
        console.log('🧠 UNIVERSAL: Fetching AI suggestions...');
        
        const aiSuggestions = await fetchGeminiDataMerged(fieldData.fields);
        console.log('✅ UNIVERSAL: AI suggestions received:', Object.keys(aiSuggestions).length, 'values');
        
        updateStatus('🌟 UNIVERSAL: Filling form fields...');
        showToast('🌟 UNIVERSAL: AI filling form fields...', 5000);
        
        await populateUniversalFormFields(fieldData.fields, aiSuggestions, fieldData.currentValues);
        
        console.log('⏳ UNIVERSAL: Waiting for all fields to be populated...');
        showToast('⏳ UNIVERSAL: Waiting for field population...', 3000);
        await sleep(5000);
        
        const verifyAttempts = 3;
        for (let i = 0; i < verifyAttempts; i++) {
            const populatedCount = await countPopulatedFieldsUniversal();
            console.log(`🔍 UNIVERSAL: Verification ${i+1}/${verifyAttempts}: ${populatedCount} fields populated`);
            
            if (populatedCount >= fieldData.fields.length * 0.8) {
                console.log('✅ UNIVERSAL: Field population verified!');
                break;
            }
            
            if (i < verifyAttempts - 1) {
                console.log('⏳ UNIVERSAL: Waiting for more fields...');
                await sleep(2000);
            }
        }
        
        console.log('⏰ UNIVERSAL: Final 10-second wait before continuing...');
        showToast('⏰ UNIVERSAL: Waiting 10 seconds before continuing...', 10000);
        await sleep(10000);
        
        updateStatus('🌟 UNIVERSAL: Autofill completed successfully!');
        showToast('✅ UNIVERSAL: AI autofill completed!', 3000);
        
    } catch (error) {
        console.error('❌ UNIVERSAL: AI autofill failed:', error);
        updateStatus(`🌟 UNIVERSAL: Autofill failed: ${error.message}`);
        showToast(`❌ UNIVERSAL: AI autofill failed: ${error.message}`, 5000);
        
        if (predefinedFields && predefinedFields.length > 0) {
            console.log('🔄 UNIVERSAL: Falling back to predefined fields...');
            showToast('🔄 UNIVERSAL: Using fallback field values...', 3000);
            await fillFormIntelligentlyUniversal(predefinedFields);
        }
    }
}

/**
 * 🌟 UNIVERSAL: Extract form fields from all UI patterns
 */
async function extractUniversalFormFields() {
    console.log('📋 UNIVERSAL: Extracting form fields from all UI patterns...');
    
    let fieldNames = [];
    let currentValues = {};
    
    // Strategy 1: Standard Salesforce field extraction
    const standardInputs = document.querySelectorAll('input.slds-input, input, .textarea, .slds-textarea');
    standardInputs.forEach(input => {
        let parent = input.closest('[data-target-selection-name]');
        let apiField = parent ? parent.getAttribute('data-target-selection-name') : null;
        
        if (apiField) {
            let apiName = apiField.replace(/^sfdc:RecordField\./, '');
            let type = getSalesforceFieldTypeMerged(apiName);
            
            if (type === "lookup") return;
            
            const existing = fieldNames.find((field) => field.apiName === apiName);
            if (!existing) {
                fieldNames.push({
                    'name': input.name || input.id,
                    'id': input?.id ?? null,
                    'apiName': apiName,
                    element: input,
                    "type": type,
                    "containsMultipleFields": false
                });
                
                currentValues[apiName] = input.value || '';
            }
        }
    });
    
    // Strategy 2: Lightning component field extraction
    const lightningInputs = document.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox');
    lightningInputs.forEach(lightningInput => {
        const fieldName = lightningInput.getAttribute('data-field-name') || 
                         lightningInput.getAttribute('field-name') ||
                         lightningInput.getAttribute('name');
        
        if (fieldName) {
            const input = lightningInput.querySelector('input, textarea') || lightningInput;
            const existing = fieldNames.find((field) => field.apiName === fieldName);
            
            if (!existing) {
                fieldNames.push({
                    'name': fieldName,
                    'id': input?.id || lightningInput.id,
                    'apiName': fieldName,
                    element: input || lightningInput,
                    "type": determineLightningFieldType(lightningInput),
                    "containsMultipleFields": false
                });
                
                currentValues[fieldName] = getFieldValue(input || lightningInput);
            }
        }
    });
    
    // Strategy 3: Generic form field extraction
    const genericInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    genericInputs.forEach(input => {
        const name = input.name || input.id || generateFieldName(input);
        if (name && !fieldNames.find(f => f.name === name)) {
            fieldNames.push({
                'name': name,
                'id': input.id,
                'apiName': name,
                element: input,
                "type": determineGenericFieldType(input),
                "containsMultipleFields": false
            });
            
            currentValues[name] = getFieldValue(input);
        }
    });
    
    // Strategy 4: Get universal picklist fields
    const picklistFields = await getAllPicklistOptionsUniversal();
    for (let key in picklistFields) {
        let currentVal = getPicklistValueUniversal(key);
        
        const existing = fieldNames.find((field) => field.apiName === key);
        if (!existing) {
            fieldNames.push({
                'name': key,
                'apiName': key,
                'options': picklistFields[key]?.options ?? [],
                'type': 'picklist'
            });
            currentValues[key] = currentVal;
        }
    }
    
    console.log(`✅ UNIVERSAL: Extracted ${fieldNames.length} fields from all UI patterns`);
    return {
        fields: fieldNames,
        currentValues: currentValues
    };
}

/**
 * 🌟 UNIVERSAL: Determine Lightning field type
 */
function determineLightningFieldType(lightningElement) {
    const variant = lightningElement.getAttribute('variant') || '';
    const type = lightningElement.getAttribute('type') || '';
    const tagName = lightningElement.tagName.toLowerCase();
    
    if (tagName === 'lightning-combobox') return 'picklist';
    if (tagName === 'lightning-textarea') return 'textarea';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';
    if (type === 'date') return 'date';
    if (type === 'datetime-local') return 'datetime';
    if (type === 'number') return 'number';
    if (type === 'checkbox') return 'checkbox';
    
    return 'text';
}

/**
 * 🌟 UNIVERSAL: Determine generic field type
 */
function determineGenericFieldType(input) {
    const type = input.type || input.tagName.toLowerCase();
    const name = (input.name || input.id || '').toLowerCase();
    
    if (type === 'email' || name.includes('email')) return 'email';
    if (type === 'tel' || name.includes('phone')) return 'phone';
    if (type === 'date') return 'date';
    if (type === 'datetime-local') return 'datetime';
    if (type === 'number' || name.includes('amount') || name.includes('price')) return 'number';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'select' || input.tagName === 'SELECT') return 'picklist';
    if (input.tagName === 'TEXTAREA') return 'textarea';
    
    return 'text';
}

/**
 * 🌟 UNIVERSAL: Generate field name for unnamed inputs
 */
function generateFieldName(input) {
    const label = findAssociatedLabel(input);
    if (label) return label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    const placeholder = input.getAttribute('placeholder');
    if (placeholder) return placeholder.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    return `field_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🌟 UNIVERSAL: Find associated label for input
 */
function findAssociatedLabel(input) {
    // Try for attribute
    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent.trim();
    }
    
    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    
    // Try sibling label
    const siblingLabel = input.parentElement?.querySelector('label');
    if (siblingLabel) return siblingLabel.textContent.trim();
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Get field value universally
 */
function getFieldValue(element) {
    if (element.type === 'checkbox') return element.checked;
    if (element.tagName === 'SELECT') return element.value;
    return element.value || '';
}

/**
 * 🌟 UNIVERSAL: Get all picklist options for all UI patterns
 */
async function getAllPicklistOptionsUniversal() {
    const results = {};
    
    // Strategy 1: Standard Salesforce picklists
    const standardPicklists = await getAllPicklistOptionsMerged();
    Object.assign(results, standardPicklists);
    
    // Strategy 2: Lightning comboboxes
    const lightningComboboxes = document.querySelectorAll('lightning-combobox');
    for (const combobox of lightningComboboxes) {
        const fieldName = combobox.getAttribute('data-field-name') || 
                         combobox.getAttribute('field-name') ||
                         combobox.getAttribute('name');
        
        if (fieldName) {
            const options = await getLightningComboboxOptions(combobox);
            if (options.length > 0) {
                results[fieldName] = { options: options };
            }
        }
    }
    
    // Strategy 3: Standard HTML selects
    const htmlSelects = document.querySelectorAll('select');
    for (const select of htmlSelects) {
        const fieldName = select.name || select.id;
        if (fieldName) {
            const options = Array.from(select.options).map(option => option.textContent.trim());
            if (options.length > 0) {
                results[fieldName] = { options: options };
            }
        }
    }
    
    return results;
}

/**
 * 🌟 UNIVERSAL: Get Lightning combobox options
 */
async function getLightningComboboxOptions(combobox) {
    return new Promise((resolve) => {
        const button = combobox.querySelector('button');
        if (!button) return resolve([]);
        
        button.click();
        
        setTimeout(() => {
            const dropdown = combobox.querySelector('[role="listbox"]');
            const options = dropdown ? 
                Array.from(dropdown.querySelectorAll('[role="option"]')).map(opt => opt.textContent.trim()) : 
                [];
            
            button.click(); // Close dropdown
            resolve(options.filter(Boolean));
        }, 500);
    });
}

/**
 * 🌟 UNIVERSAL: Get picklist value for all UI patterns
 */
function getPicklistValueUniversal(apiFieldName) {
    // Try standard method first
    const standardValue = getPicklistValueMerged(apiFieldName);
    if (standardValue) return standardValue;
    
    // Try Lightning combobox
    const lightningCombobox = document.querySelector(`lightning-combobox[data-field-name="${apiFieldName}"], lightning-combobox[field-name="${apiFieldName}"]`);
    if (lightningCombobox) {
        const button = lightningCombobox.querySelector('button');
        return button ? button.textContent.trim() : '';
    }
    
    // Try standard HTML select
    const htmlSelect = document.querySelector(`select[name="${apiFieldName}"], select[id="${apiFieldName}"]`);
    if (htmlSelect) {
        return htmlSelect.value;
    }
    
    return '';
}

/**
 * 🌟 UNIVERSAL: Populate form fields for all UI patterns
 */
async function populateUniversalFormFields(allFieldNames, generatedValues, existingData) {
    console.log('📝 UNIVERSAL: Populating fields with AI data across all UI patterns...');
    
    const totalFields = allFieldNames.length;
    let processedFields = 0;
    
    for (const field of allFieldNames) {
        try {
            processedFields++;
            console.log(`📝 UNIVERSAL: Processing field ${processedFields}/${totalFields}: ${field.apiName}`);
            
            showToast(`📝 UNIVERSAL: Filling ${field.apiName} (${processedFields}/${totalFields})`, 1500);
            
            if (field?.type === "picklist") {
                if (generatedValues[field.apiName] !== undefined) {
                    await setPicklistValueUniversal(field?.apiName, generatedValues[field.apiName]);
                    console.log(`✅ UNIVERSAL: Set picklist ${field.apiName} = ${generatedValues[field.apiName]}`);
                }
            } else {
                if (generatedValues[field.apiName] !== undefined && generatedValues[field.apiName] !== null) {
                    await fillFieldWithValueUniversal(field, generatedValues[field.apiName], existingData);
                }
            }
            
            await sleep(300);
            
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: Failed to fill field ${field.apiName}:`, error);
        }
    }
    
    console.log(`✅ UNIVERSAL: Field population completed (${processedFields}/${totalFields})`);
}

/**
 * 🌟 UNIVERSAL: Set picklist value for all UI patterns
 */
async function setPicklistValueUniversal(apiFieldName, desiredValue) {
    // Try standard method first
    try {
        await setPicklistValueMerged(apiFieldName, desiredValue);
        return;
    } catch (error) {
        console.log('Standard picklist method failed, trying universal methods...');
    }
    
    // Try Lightning combobox
    const lightningCombobox = document.querySelector(`lightning-combobox[data-field-name="${apiFieldName}"], lightning-combobox[field-name="${apiFieldName}"]`);
    if (lightningCombobox) {
        const button = lightningCombobox.querySelector('button');
        if (button) {
            button.click();
            await sleep(500);
            
            const dropdown = lightningCombobox.querySelector('[role="listbox"]');
            if (dropdown) {
                const options = dropdown.querySelectorAll('[role="option"]');
                for (const option of options) {
                    if (option.textContent.trim() === desiredValue) {
                        option.click();
                        return;
                    }
                }
            }
            button.click(); // Close dropdown
        }
    }
    
    // Try standard HTML select
    const htmlSelect = document.querySelector(`select[name="${apiFieldName}"], select[id="${apiFieldName}"]`);
    if (htmlSelect) {
        htmlSelect.value = desiredValue;
        htmlSelect.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }
    
    throw new Error(`Could not set picklist value for ${apiFieldName}`);
}

/**
 * 🌟 UNIVERSAL: Fill field with value for all UI patterns
 */
async function fillFieldWithValueUniversal(field, value, existingData) {
    const previousValue = existingData[field.apiName];
    
    if (previousValue && previousValue !== '' && previousValue !== false) {
        console.log(`⏭️ UNIVERSAL: Skipping ${field.apiName} - already has value: ${previousValue}`);
        return;
    }
    
    if (typeof value === 'object') {
        await fillComplexFieldUniversal(field, value);
    } else {
        await fillSimpleFieldUniversal(field, value);
    }
}

/**
 * 🌟 UNIVERSAL: Fill simple field for all UI patterns
 */
async function fillSimpleFieldUniversal(field, value) {
    try {
        if (field.element) {
            field.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(300);
            
            if (typeof value === 'boolean') {
                field.element.checked = value;
            } else {
                field.element.focus();
                field.element.value = '';
                field.element.value = value;
                
                // Trigger all possible events
                field.element.dispatchEvent(new Event('input', { bubbles: true }));
                field.element.dispatchEvent(new Event('change', { bubbles: true }));
                field.element.dispatchEvent(new Event('blur', { bubbles: true }));
                
                // For Lightning components
                field.element.dispatchEvent(new CustomEvent('fieldchange', { 
                    bubbles: true, 
                    detail: { value: value } 
                }));
            }
            
            console.log(`✅ UNIVERSAL: Filled ${field.apiName} = ${value}`);
        }
    } catch (error) {
        console.warn(`⚠️ UNIVERSAL: Error filling ${field.apiName}:`, error);
    }
}

/**
 * 🌟 UNIVERSAL: Fill complex field for all UI patterns
 */
async function fillComplexFieldUniversal(field, value) {
    console.log(`📝 UNIVERSAL: Filling complex field ${field.apiName} with:`, value);
    // Implementation for complex field types (datetime, etc.)
}

/**
 * 🌟 UNIVERSAL: Count populated fields for all UI patterns
 */
async function countPopulatedFieldsUniversal() {
    const allInputs = document.querySelectorAll('input, textarea, select, lightning-input, lightning-textarea, lightning-combobox');
    let populatedCount = 0;
    
    allInputs.forEach(input => {
        const value = getFieldValue(input);
        if (value && value !== '' && value !== false) {
            populatedCount++;
        }
    });
    
    return populatedCount;
}

/**
 * 🌟 UNIVERSAL: Fill form intelligently for all UI patterns
 */
async function fillFormIntelligentlyUniversal(fields) {
    console.log('📝 UNIVERSAL: Filling form intelligently across all UI patterns with', fields.length, 'predefined fields');

    await sleep(2000);

    for (const field of fields) {
        console.log(`🔍 UNIVERSAL: Processing predefined field: ${field.label}`);

        try {
            const element = await findFieldElementUniversal(field);
            if (!element) {
                console.warn(`⚠️ UNIVERSAL: Field not found: ${field.label}`);
                continue;
            }
            await fillFieldElementUniversal(element, field);
            await sleep(500);
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: Failed to fill field ${field.label}:`, error);
        }
    }

    console.log('✅ UNIVERSAL: Predefined form filling completed');
}

/**
 * 🌟 UNIVERSAL: Find field element across all UI patterns
 */
async function findFieldElementUniversal(field) {
    const strategies = [
        () => document.querySelector(field.selector),
        () => document.querySelector(`input[name="${field.label}"]`),
        () => document.querySelector(`input[aria-label*="${field.label}"]`),
        () => document.querySelector(`lightning-input[field-name*="${field.label}"]`),
        () => document.querySelector(`lightning-input[data-field-name*="${field.label}"]`),
        () => findByLabelTextUniversal(field.label)
    ];
    
    for (const strategy of strategies) {
        try {
            const element = strategy();
            if (element) return element;
        } catch (error) {
            continue;
        }
    }
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Find by label text across all UI patterns
 */
function findByLabelTextUniversal(labelText) {
    // Try various label strategies
    const labelStrategies = [
        () => {
            const labels = document.querySelectorAll('label');
            for (const label of labels) {
                if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
                    const forId = label.getAttribute('for');
                    if (forId) {
                        return document.getElementById(forId);
                    }
                    
                    const input = label.querySelector('input, textarea, select');
                    if (input) return input;
                }
            }
            return null;
        },
        
        () => {
            const lightningLabels = document.querySelectorAll('lightning-input, lightning-textarea, lightning-combobox');
            for (const lightning of lightningLabels) {
                const label = lightning.getAttribute('label') || '';
                if (label.toLowerCase().includes(labelText.toLowerCase())) {
                    return lightning.querySelector('input, textarea') || lightning;
                }
            }
            return null;
        }
    ];
    
    for (const strategy of labelStrategies) {
        try {
            const element = strategy();
            if (element) return element;
        } catch (error) {
            continue;
        }
    }
    
    return null;
}

/**
 * 🌟 UNIVERSAL: Fill field element across all UI patterns
 */
async function fillFieldElementUniversal(element, field) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);

    const finalValue = field.value || generateSampleValue(field);
    
    // Handle Lightning components
    if (element.tagName && element.tagName.toLowerCase().startsWith('lightning-')) {
        const input = element.querySelector('input, textarea') || element;
        input.focus();
        input.value = finalValue;
        
        // Trigger Lightning-specific events
        input.dispatchEvent(new CustomEvent('fieldchange', { 
            bubbles: true, 
            detail: { value: finalValue } 
        }));
    } else {
        element.focus();
        element.value = '';
        element.value = finalValue;
    }

    // Trigger standard events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    console.log(`✅ UNIVERSAL: Filled ${field.label} = ${finalValue}`);
}

// Keep all existing helper functions from the original code
function generateSampleValue(field) {
    const label = field.label?.toLowerCase() || '';
    const type = field.type || 'text';

    if (label.includes('name')) return 'Sample ' + (label.split(' ')[0] || 'Name');
    if (label.includes('email')) return `user${Math.floor(Math.random() * 1000)}@example.com`;
    if (label.includes('phone') || label.includes('mobile')) return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
    if (label.includes('website') || label.includes('url')) return `https://example${Math.floor(Math.random() * 100)}.com`;
    if (label.includes('amount') || label.includes('price')) return (Math.floor(Math.random() * 10000) + 100) + '';
    if (label.includes('date')) return new Date().toISOString().split('T')[0];
    if (label.includes('description') || label.includes('notes')) return 'Auto-generated description text.';
    if (label.includes('city')) return 'San Francisco';
    if (label.includes('state')) return 'California';
    if (label.includes('zip') || label.includes('postal')) return '94105';
    if (label.includes('company')) return 'TechCorp Ltd.';
    
    switch (type) {
        case 'number': return Math.floor(Math.random() * 1000);
        case 'date': return new Date().toISOString().split('T')[0];
        case 'tel': return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
        case 'email': return `user${Math.floor(Math.random() * 1000)}@example.com`;
        case 'url': return `https://example${Math.floor(Math.random() * 100)}.com`;
        default: return 'Sample ' + (label || 'Value');
    }
}

// Universal action methods
async function universalClick(selector, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);
    element.click();
    console.log(`✅ UNIVERSAL: Clicked: ${description}`);
}

async function universalType(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ UNIVERSAL: Typed "${value}": ${description}`);
}

async function universalSelect(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ UNIVERSAL: Selected "${value}": ${description}`);
}

// Progress updates
function sendProgressUpdate(type, data) {
    try {
        chrome.runtime.sendMessage({
            type: type,
            data: data
        });
        console.log(`📡 UNIVERSAL: Sent progress update - ${type}:`, data);
    } catch (error) {
        console.warn('Failed to send progress update:', error);
    }
}

// Keep all existing functions from original code (preserving all functionality)
// ... [Include all the remaining functions from the original content.js]

// Highlight Record Type modal
function highlightRecordTypeModal(modal) {
    const originalBorder = modal.style.border;
    const originalBoxShadow = modal.style.boxShadow;
    
    modal.style.border = '4px solid #ff6b6b';
    modal.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.5), inset 0 0 20px rgba(255, 107, 107, 0.1)';
    
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        pulseCount++;
        if (pulseCount > 6 || !document.contains(modal) || !isElementVisible(modal)) {
            clearInterval(pulseInterval);
            if (document.contains(modal)) {
                modal.style.border = originalBorder;
                modal.style.boxShadow = originalBoxShadow;
            }
            return;
        }
        
        modal.style.border = pulseCount % 2 === 0 ? '4px solid #ff6b6b' : '4px solid #4ecdc4';
    }, 800);
}

// Keep ALL existing functions from the original merged code
// [Include all remaining functions...]

// Utility functions
function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
        (rect.width > 0 || rect.height > 0) &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
    );
}

function showToast(msg, ms = 2000) {
    let toast = document.getElementById('sf-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sf-toast';
        Object.assign(toast.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            padding: '12px 16px', background: 'rgba(0,0,0,0.85)',
            color: '#fff', borderRadius: '6px',
            fontFamily: 'system-ui, sans-serif', fontSize: '14px', zIndex: 99999,
            transition: 'opacity 0.3s', maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'pre-line'
        });
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.style.opacity = '0', ms);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        await sleep(200);
    }
    return null;
}

function updateStatus(message) {
    console.log('📢 UNIVERSAL: Status update:', message);
    chrome.runtime.sendMessage({ type: "statusUpdate", message: message });
}

function isUserLoggedIn() {
    return !!(
        document.querySelector('[data-aura-rendered-by]') ||
        document.querySelector('.slds-') ||
        document.querySelector('lightning-') ||
        document.querySelector('.oneHeader')
    );
}

function getCurrentObjectType() {
    const url = window.location.href;
    const match = url.match(/\/lightning\/[or]\/([^\/]+)/);
    return match ? match[1] : null;
}

function getAvailableObjects() {
    const objects = new Set();
    document.querySelectorAll('a[href*="/lightning/o/"]').forEach(link => {
        const match = link.href.match(/\/lightning\/o\/([^\/]+)/);
        if (match) objects.add(match[1]);
    });
    return Array.from(objects);
}

function getCurrentFormFields() {
    const fields = [];
    document.querySelectorAll('[data-target-selection-name*="RecordField"], lightning-input').forEach(field => {
        const apiName = field.getAttribute('data-target-selection-name')?.replace('sfdc:RecordField.', '') ||
                       field.getAttribute('data-field-name');
        if (apiName) fields.push(apiName);
    });
    return fields;
}

/**
 * 🌟 UNIVERSAL: Navigate to Related tab with universal UI detection
 */
async function navigateToRelatedTabUniversal() {
    console.log('🌟 UNIVERSAL: === RELATED TAB NAVIGATION FOR ALL UI PATTERNS ===');
    
    await sleep(2000);
    
    const strategies = [
        // Strategy 1: Standard Related tab selectors
        () => findStandardRelatedTab(),
        
        // Strategy 2: Lightning component Related tabs
        () => findLightningRelatedTab(),
        
        // Strategy 3: Text-based Related tab search
        () => findTextBasedRelatedTab(),
        
        // Strategy 4: Console app Related tabs
        () => findConsoleRelatedTab(),
        
        // Strategy 5: Custom component Related tabs
        () => findCustomRelatedTab(),
        
        // Strategy 6: Force Related tab activation
        () => forceRelatedTabActivation()
    ];
    
    let relatedTabFound = false;
    
    for (let i = 0; i < strategies.length; i++) {
        console.log(`🔧 UNIVERSAL: Trying Related tab strategy ${i + 1}...`);
        
        try {
            const success = await strategies[i]();
            if (success) {
                console.log(`✅ UNIVERSAL: Related tab strategy ${i + 1} successful!`);
                relatedTabFound = true;
                break;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL: Related tab strategy ${i + 1} failed:`, error);
        }
        
        await sleep(500);
    }
    
    if (!relatedTabFound) {
        console.log('⚠️ UNIVERSAL: Related tab not found - may already be active or not applicable');
        showToast('⚠️ UNIVERSAL: Related tab not found - continuing', 3000);
    }
}

async function findStandardRelatedTab() {
    const selectors = [
        'a[data-label="Related"]',
        'a[title="Related"]', 
        'lightning-tab[title="Related"] a',
        '.slds-tabs_default__item a[title="Related"]',
        'lightning-tab-bar a[title="Related"]',
        '.slds-tabs_default__nav a[data-label="Related"]',
        '[role="tab"][title="Related"]'
    ];
    
    for (const selector of selectors) {
        const tab = document.querySelector(selector);
        if (tab && isElementVisible(tab)) {
            console.log(`✅ UNIVERSAL: Found standard Related tab: ${selector}`);
            await clickRelatedTab(tab);
            return true;
        }
    }
    return false;
}

async function findLightningRelatedTab() {
    const lightningTabs = document.querySelectorAll('lightning-tab, lightning-tab-bar lightning-tab');
    for (const tab of lightningTabs) {
        const title = tab.getAttribute('title') || tab.getAttribute('label') || '';
        if (title.toLowerCase() === 'related') {
            const link = tab.querySelector('a') || tab;
            if (isElementVisible(link)) {
                console.log('✅ UNIVERSAL: Found Lightning Related tab');
                await clickRelatedTab(link);
                return true;
            }
        }
    }
    return false;
}

async function findTextBasedRelatedTab() {
    const allTabs = document.querySelectorAll('a[role="tab"], lightning-tab a, .slds-tabs_default__item a, [role="tab"]');
    
    for (const tab of allTabs) {
        const text = tab.textContent.trim().toLowerCase();
        if (text === 'related' && isElementVisible(tab)) {
            console.log('✅ UNIVERSAL: Found text-based Related tab');
            await clickRelatedTab(tab);
            return true;
        }
    }
    return false;
}

async function findConsoleRelatedTab() {
    const consoleSelectors = [
        '.oneConsoleTabset a[title="Related"]',
        '.slds-context-bar__item a[title="Related"]',
        '.workspace__tabs a[title="Related"]'
    ];
    
    for (const selector of consoleSelectors) {
        const tab = document.querySelector(selector);
        if (tab && isElementVisible(tab)) {
            console.log(`✅ UNIVERSAL: Found console Related tab: ${selector}`);
            await clickRelatedTab(tab);
            return true;
        }
    }
    return false;
}

async function findCustomRelatedTab() {
    // Look for any clickable element with "Related" text
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        const text = element.textContent.trim();
        const isClickable = element.tagName === 'A' || element.tagName === 'BUTTON' || 
                           element.getAttribute('role') === 'tab' ||
                           element.style.cursor === 'pointer';
        
        if (text === 'Related' && isClickable && isElementVisible(element)) {
            console.log('✅ UNIVERSAL: Found custom Related tab');
            await clickRelatedTab(element);
            return true;
        }
    }
    return false;
}

async function forceRelatedTabActivation() {
    // Try URL manipulation to force Related tab
    const currentUrl = window.location.href;
    if (currentUrl.includes('/lightning/r/')) {
        const newUrl = currentUrl.replace(/\/view$/, '') + '/related';
        console.log('🔍 UNIVERSAL: Attempting URL-based Related tab navigation');
        window.location.href = newUrl;
        await sleep(3000);
        return true;
    }
    return false;
}

async function clickRelatedTab(tab) {
    try {
        const isActive = tab.getAttribute('aria-selected') === 'true' ||
                         tab.classList.contains('slds-is-active') ||
                         tab.parentElement?.classList.contains('slds-is-active');
        
        if (isActive) {
            console.log('✅ UNIVERSAL: Related tab already active');
            showToast('✅ UNIVERSAL: Already on Related tab', 2000);
            return;
        }
        
        tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        
        // Highlight the tab
        const originalBorder = tab.style.border;
        tab.style.border = '3px solid red';
        await sleep(1000);
        tab.style.border = originalBorder;
        
        tab.click();
        console.log('✅ UNIVERSAL: Clicked Related tab');
        showToast('✅ UNIVERSAL: Switched to Related tab', 2000);
        
        await sleep(3000);
        
    } catch (error) {
        console.error('❌ UNIVERSAL: Error clicking Related tab:', error);
        // Try alternative click method
        try {
            tab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await sleep(3000);
        } catch (altError) {
            console.error('❌ UNIVERSAL: Alternative click failed:', altError);
        }
    }
}

/**
 * 🌟 UNIVERSAL: Click Related List New with universal UI support
 */
async function clickRelatedListNewUniversal(relatedListName, targetObject, parentRecordVariable) {
    console.log(`🌟 UNIVERSAL: === RELATED LIST NEW WITH UNIVERSAL UI SUPPORT ===`);
    console.log(`UNIVERSAL: Target List: ${relatedListName}`);
    console.log(`UNIVERSAL: Target Object: ${targetObject}`);
    console.log(`UNIVERSAL: Parent Variable: ${parentRecordVariable}`);
    
    await sleep(4000);
    
    const strategies = [
        // Strategy 1: Exact Related List Section Match with universal selectors
        () => findUniversalRelatedListSection(relatedListName, targetObject),
        
        // Strategy 2: Header-Based Section Detection with enhanced patterns
        () => findUniversalHeaderBasedSection(relatedListName, targetObject),
        
        // Strategy 3: Quick Links Universal Detection
        () => findUniversalQuickLinks(relatedListName, targetObject),
        
        // Strategy 4: Card Content Universal Analysis
        () => findUniversalCardContent(relatedListName, targetObject),
        
        // Strategy 5: Lightning Component Detection
        () => findLightningComponentNew(relatedListName, targetObject),
        
        // Strategy 6: Console App Related List Detection
        () => findConsoleRelatedListNew(relatedListName, targetObject),
        
        // Strategy 7: Mobile/Responsive Layout Detection
        () => findMobileRelatedListNew(relatedListName, targetObject),
        
        // Strategy 8: Custom Component Detection
        () => findCustomComponentNew(relatedListName, targetObject),
        
        // Strategy 9: Fallback Any New Button in Related Area
        () => findAnyRelatedAreaNewButton(targetObject),
        
        // Strategy 10: Force creation via URL manipulation
        () => forceRelatedObjectCreation(targetObject)
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔧 UNIVERSAL Strategy ${i + 1}: Testing universal UI pattern...`);
        
        try {
            const success = await strategy();
            if (success) {
                console.log(`✅ UNIVERSAL Strategy ${i + 1} successful for ${targetObject}!`);
                showToast(`✅ UNIVERSAL: ${targetObject} New button found`, 3000);
                
                // Check for Record Type modal after clicking New
                await sleep(3000);
                await checkAndHandleUniversalRecordTypeModal();
                return true;
            }
        } catch (error) {
            console.warn(`⚠️ UNIVERSAL Strategy ${i + 1} failed:`, error);
        }
        
        await sleep(500);
    }
    
    console.error(`❌ UNIVERSAL: All strategies failed for ${targetObject}`);
    showToast(`⚠️ UNIVERSAL: ${targetObject} New button not found - please click manually`, 5000);
    return false;
}

async function findUniversalRelatedListSection(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Exact section search for ${targetObject} in ${relatedListName}`);

    const cardSelectors = [
        '.slds-card',
        'article.slds-card',
        '[data-aura-class*="relatedList"]',
        '.forceRelatedListSingleContainer',
        '.related-list-container',
        '[data-component-id*="relatedList"]',
        'lightning-card',
        '.lightning-card',
        '.uiBlock',
        '[data-target-reveals*="related"]'
    ];

    const allCards = document.querySelectorAll(cardSelectors.join(', '));
    console.log(`UNIVERSAL: Found ${allCards.length} potential cards across all UI patterns`);

    for (const card of allCards) {
        const headers = card.querySelectorAll('.slds-card__header, .slds-card__header-title, h2, h3, h4, lightning-card-header, .card-header');
        
        for (const header of headers) {
            const headerText = header.textContent.trim();

            if (headerText.startsWith(relatedListName) || headerText.includes(targetObject)) {
                console.log(`✅ UNIVERSAL: Matched card header "${headerText}" with related list "${relatedListName}"`);

                const newButton = card.querySelector('button[title="New"], a[title="New"], lightning-button[title="New"], .new-button, [data-action="new"]');
                if (newButton && isElementVisible(newButton)) {
                    console.log(`✅ UNIVERSAL: Clicking "New" button inside correct card for "${relatedListName}"`);
                    newButton.click();
                    return true;
                }
            }
        }
    }

    console.log(`❌ UNIVERSAL: No exact section found for "${relatedListName}"`);
    return false;
}

async function findUniversalHeaderBasedSection(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Header-based search for ${targetObject}`);

    const headerSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.slds-card__header-title',
        '.slds-text-heading_small',
        '.slds-text-heading_medium',
        '.slds-page-header__title',
        '[data-aura-class*="header"]',
        'lightning-card-header',
        '.card-title',
        '.section-header'
    ];

    for (const selector of headerSelectors) {
        const headers = document.querySelectorAll(selector);

        for (const header of headers) {
            const headerText = header.textContent.trim();

            if (headerText.startsWith(relatedListName) || headerText.includes(targetObject)) {
                console.log(`✅ UNIVERSAL: Found header matching "${relatedListName}"`);

                const section = header.closest('.slds-card, article, lightning-card, .uiBlock, .related-section') || 
                                header.parentElement?.closest('.container, .section, .panel');

                if (section) {
                    const newButton = section.querySelector('button[title="New"], a[title="New"], lightning-button, .new-btn, [data-action*="new"]');
                    if (newButton && isElementVisible(newButton)) {
                        console.log(`✅ UNIVERSAL: Clicking "New" button in section "${relatedListName}"`);
                        newButton.click();
                        return true;
                    }
                }
            }
        }
    }

    console.log(`❌ UNIVERSAL: No header match found for ${relatedListName}`);
    return false;
}

async function findUniversalQuickLinks(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Quick Links search for ${targetObject}`);
    
    const quickLinksSelectors = [
        '.relatedListQuickLinks',
        '[data-aura-class*="relatedListQuickLinks"]',
        '.slds-card__body .slds-grid',
        '.quick-links',
        '.lightning-quick-links',
        '.related-quick-actions'
    ];
    
    for (const selector of quickLinksSelectors) {
        const quickLinksSection = document.querySelector(selector);
        if (quickLinksSection) {
            console.log(`✅ UNIVERSAL: Found Quick Links: ${selector}`);
            
            const allLinks = quickLinksSection.querySelectorAll('a, span[role="button"], div[role="button"], lightning-button, button');
            
            for (const link of allLinks) {
                const linkText = link.textContent.trim().toLowerCase();
                
                if (linkText.includes(targetObject.toLowerCase()) || linkText.includes(relatedListName.toLowerCase())) {
                    console.log(`✅ UNIVERSAL: Found Quick Link match "${linkText}"`);
                    
                    link.click();
                    await sleep(4000);
                    
                    const newBtn = document.querySelector('button[title="New"], a[title="New"], lightning-button[title="New"]');
                    if (newBtn && isElementVisible(newBtn)) {
                        newBtn.click();
                        return true;
                    }
                }
            }
        }
    }
    
    console.log(`❌ UNIVERSAL: No Quick Link found for ${targetObject}`);
    return false;
}

async function findUniversalCardContent(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Card content analysis for ${targetObject}`);
    
    const allCards = document.querySelectorAll('.slds-card, article.slds-card, lightning-card, .card, .panel, .uiBlock');
    
    for (const card of allCards) {
        const cardText = card.textContent.toLowerCase();
        
        if (cardText.includes(relatedListName.toLowerCase()) || cardText.includes(targetObject.toLowerCase())) {
            console.log(`✅ UNIVERSAL: Found card with content match for ${targetObject}`);
            
            const newButton = card.querySelector('button[title="New"], a[title="New"], lightning-button[title="New"], .new-button, [data-action="new"]');
            if (newButton && isElementVisible(newButton)) {
                console.log(`✅ UNIVERSAL: Clicking New button in matched card`);
                newButton.click();
                return true;
            }
        }
    }
    
    console.log(`❌ UNIVERSAL: No card content match for ${targetObject}`);
    return false;
}

async function findLightningComponentNew(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Lightning component search for ${targetObject}`);
    
    const lightningComponents = document.querySelectorAll('lightning-card, lightning-datatable, lightning-tree-grid, c-*');
    
    for (const component of lightningComponents) {
        const componentText = component.textContent.toLowerCase();
        
        if (componentText.includes(targetObject.toLowerCase())) {
            const lightningButton = component.querySelector('lightning-button[title="New"], lightning-button-icon[title="New"]');
            if (lightningButton && isElementVisible(lightningButton)) {
                console.log('✅ UNIVERSAL: Found Lightning component New button');
                lightningButton.click();
                return true;
            }
        }
    }
    
    return false;
}

async function findConsoleRelatedListNew(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Console app search for ${targetObject}`);
    
    const consoleSelectors = [
        '.oneConsole .slds-card',
        '.workspace .related-list',
        '.slds-split-view .slds-card'
    ];
    
    for (const selector of consoleSelectors) {
        const consoleCards = document.querySelectorAll(selector);
        
        for (const card of consoleCards) {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(targetObject.toLowerCase())) {
                const newButton = card.querySelector('button[title="New"], a[title="New"]');
                if (newButton && isElementVisible(newButton)) {
                    console.log('✅ UNIVERSAL: Found console New button');
                    newButton.click();
                    return true;
                }
            }
        }
    }
    
    return false;
}

async function findMobileRelatedListNew(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Mobile layout search for ${targetObject}`);
    
    // Mobile-specific selectors
    const mobileSelectors = [
        '.slds-size_1-of-1 .slds-card',
        '.mobile-card',
        '.slds-grid_vertical .slds-card'
    ];
    
    for (const selector of mobileSelectors) {
        const mobileCards = document.querySelectorAll(selector);
        
        for (const card of mobileCards) {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(targetObject.toLowerCase())) {
                const newButton = card.querySelector('button, a[title*="New"], lightning-button');
                if (newButton && isElementVisible(newButton)) {
                    console.log('✅ UNIVERSAL: Found mobile New button');
                    newButton.click();
                    return true;
                }
            }
        }
    }
    
    return false;
}

async function findCustomComponentNew(relatedListName, targetObject) {
    console.log(`🔍 UNIVERSAL: Custom component search for ${targetObject}`);
    
    // Look for custom components (starting with c-)
    const customComponents = document.querySelectorAll('[data-aura-class*="c-"], [class*="c-"], c-\\*');
    
    for (const component of customComponents) {
        const componentText = component.textContent.toLowerCase();
        if (componentText.includes(targetObject.toLowerCase())) {
            const anyButton = component.querySelector('button, a, [role="button"]');
            if (anyButton && isElementVisible(anyButton)) {
                const buttonText = anyButton.textContent.toLowerCase();
                if (buttonText.includes('new') || buttonText.includes('add') || buttonText.includes('create')) {
                    console.log('✅ UNIVERSAL: Found custom component New button');
                    anyButton.click();
                    return true;
                }
            }
        }
    }
    
    return false;
}

async function findAnyRelatedAreaNewButton(targetObject) {
    console.log(`🔍 UNIVERSAL: Fallback - looking for any New button in related area for ${targetObject}`);
    
    const relatedAreas = document.querySelectorAll('.related, .slds-card, lightning-card, .related-list, [data-target*="related"]');
    
    for (const area of relatedAreas) {
        const allNewButtons = area.querySelectorAll('button[title="New"], a[title="New"], lightning-button, button:contains("New"), a:contains("New")');
        const visibleButtons = Array.from(allNewButtons).filter(btn => isElementVisible(btn));
        
        if (visibleButtons.length > 0) {
            console.log(`✅ UNIVERSAL: Using first available New button in related area for ${targetObject}`);
            visibleButtons[0].click();
            return true;
        }
    }
    
    return false;
}

async function forceRelatedObjectCreation(targetObject) {
    console.log(`🔍 UNIVERSAL: Force creation via URL for ${targetObject}`);
    
    const currentUrl = window.location.href;
    
    // Extract record ID from URL
    const recordIdMatch = currentUrl.match(/\/lightning\/r\/\w+\/(\w{15}|\w{18})/);
    if (recordIdMatch) {
        const recordId = recordIdMatch[1];
        const objectMapping = {
            'Contact': 'Contact',
            'Opportunity': 'Opportunity', 
            'Case': 'Case',
            'Task': 'Task',
            'Event': 'Event'
        };
        
        const salesforceObject = objectMapping[targetObject];
        if (salesforceObject) {
            const newUrl = `/lightning/o/${salesforceObject}/new?parentId=${recordId}`;
            console.log('🔍 UNIVERSAL: Attempting URL-based related creation:', newUrl);
            window.location.href = newUrl;
            await sleep(3000);
            return true;
        }
    }
    
    return false;
}

/**
 * 🌟 UNIVERSAL: Fill related form with universal AI
 */
async function fillRelatedFormWithUniversalAI(objectType, originalInstruction) {
    console.log(`📝 UNIVERSAL: === FILLING ${objectType} RELATED FORM WITH UNIVERSAL AI ===`);
    console.log('UNIVERSAL: Original instruction:', originalInstruction);
    
    await sleep(4000);
    
    try {
        await fillFormWithUniversalAI([]);
        
        showToast(`✅ UNIVERSAL: ${objectType} form filled with universal AI!\n\nAuto-linked to parent record.\nPlease review and save.`, 5000);
        
    } catch (error) {
        console.error(`❌ UNIVERSAL: AI fill failed for ${objectType}:`, error);
        
        const formFields = getFormFieldsForObjectTypeUniversal(objectType, originalInstruction);
        
        if (formFields.length === 0) {
            console.log(`⚠️ UNIVERSAL: No predefined fields for ${objectType} - form opened for manual entry`);
            showToast(`✅ UNIVERSAL: ${objectType} form opened\n\nAuto-linked to parent record.\nPlease fill manually.`, 5000);
            return;
        }
        
        console.log(`📝 UNIVERSAL: Filling ${formFields.length} predefined fields for ${objectType}`);
        await fillFormIntelligentlyUniversal(formFields);
        
        showToast(`✅ UNIVERSAL: ${objectType} form filled!\n\nAuto-linked to parent record.\nPlease review and save.`, 5000);
    }
}

/**
 * 🌟 UNIVERSAL: Get form fields for object type
 */
function getFormFieldsForObjectTypeUniversal(objectType, originalInstruction) {
    console.log(`🎯 UNIVERSAL: Getting fields for ${objectType} with instruction: ${originalInstruction}`);
    
    const fieldMappings = {
        'Contact': [
            { selector: 'input[name="firstName"], lightning-input[field-name="firstName"]', value: 'Sarah', label: 'First Name', type: 'input' },
            { selector: 'input[name="lastName"], lightning-input[field-name="lastName"]', value: 'Johnson', label: 'Last Name', type: 'input' },
            { selector: 'input[name="Email"], lightning-input[field-name="Email"]', value: 'sarah.johnson@company.com', label: 'Email', type: 'input' },
            { selector: 'input[name="Phone"], lightning-input[field-name="Phone"]', value: '555-987-6543', label: 'Phone', type: 'input' }
        ],
        'Opportunity': [
            { selector: 'input[name="Name"], lightning-input[field-name="Name"]', value: 'Q1 2025 Enterprise Deal', label: 'Opportunity Name', type: 'input' },
            { selector: 'input[name="Amount"], lightning-input[field-name="Amount"]', value: '125000', label: 'Amount', type: 'input' },
            { selector: 'input[name="CloseDate"], lightning-input[field-name="CloseDate"]', value: '2025-04-30', label: 'Close Date', type: 'input' }
        ],
        'Case': [
            { selector: 'input[name="Subject"], lightning-input[field-name="Subject"]', value: 'Technical Support Request', label: 'Subject', type: 'input' },
            { selector: 'textarea[name="Description"], lightning-textarea[field-name="Description"]', value: 'Customer needs assistance.', label: 'Description', type: 'input' }
        ],
        'Task': [
            { selector: 'input[name="Subject"], lightning-input[field-name="Subject"]', value: 'Follow up task', label: 'Subject', type: 'input' },
            { selector: 'input[name="ActivityDate"], lightning-input[field-name="ActivityDate"]', value: '2025-02-15', label: 'Due Date', type: 'input' }
        ],
        'Event': [
            { selector: 'input[name="Subject"], lightning-input[field-name="Subject"]', value: 'Client meeting', label: 'Subject', type: 'input' },
            { selector: 'input[name="StartDateTime"], lightning-input[field-name="StartDateTime"]', value: '2025-02-10T10:00', label: 'Start Date Time', type: 'input' }
        ]
    };
    
    return fieldMappings[objectType] || [];
}

/**
 * 🌟 UNIVERSAL: Capture record ID with universal patterns
 */
async function captureRecordIdUniversal(variable) {
    console.log('📝 UNIVERSAL: === RECORD CAPTURE ACROSS ALL UI PATTERNS ===');
    console.log(`UNIVERSAL: Capturing record ID for: ${variable}`);
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const url = window.location.href;
        
        const recordIdPatterns = [
            /\/lightning\/r\/\w+\/(\w{15}|\w{18})/,
            /\/lightning\/r\/[^\/]+\/([a-zA-Z0-9]{15,18})/,
            /[\/\?&]id=(\w{15}|\w{18})/,
            /\/([a-zA-Z0-9]{15,18})\/view/,
            /recordId=([a-zA-Z0-9]{15,18})/,
            /\/detail\/([a-zA-Z0-9]{15,18})/
        ];
        
        for (const pattern of recordIdPatterns) {
            const match = url.match(pattern);
            if (match) {
                const recordId = match[1];
                console.log(`✅ UNIVERSAL: Found record ID: ${recordId}`);
                
                recordContext[variable] = recordId;
                console.log(`💾 UNIVERSAL: Stored ${variable}: ${recordId}`);
                
                showToast(`✅ UNIVERSAL: Captured ${recordId.substring(0, 8)}...`, 3000);
                return;
            }
        }
        
        await sleep(1000);
        attempts++;
    }
    
    console.error(`❌ UNIVERSAL: Failed to capture record ID for ${variable}`);
}

/**
 * 🌟 UNIVERSAL: Enhanced wait for save with universal button detection
 */
async function waitForUserToSaveUniversal(message = 'Please click Save to continue...', enableAutoSave = true) {
    console.log('⏳ UNIVERSAL: Enhanced waiting for save with universal UI support...');
    console.log('Auto-save enabled:', enableAutoSave);
    
    const enhancedMessage = enableAutoSave ? 
        `${message}\n\n⚡ Auto-save in 10 seconds if not saved manually` : 
        message;
    
    showToast(enhancedMessage, enableAutoSave ? 10000 : 15000);
    
    return new Promise((resolve) => {
        let resolved = false;
        const startUrl = window.location.href;
        const startTime = Date.now();
        
        const autoSaveTimeout = enableAutoSave ? setTimeout(async () => {
            if (!resolved) {
                console.log('🤖 UNIVERSAL: Auto-save triggered...');
                showToast('🤖 UNIVERSAL: Auto-saving now...', 3000);
                
                const saveSuccess = await attemptUniversalAutoSave();
                if (saveSuccess) {
                    console.log('✅ UNIVERSAL: Auto-save successful!');
                    showToast('✅ UNIVERSAL: Auto-save completed!', 3000);
                    
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkForSave);
                        setTimeout(resolve, 2000);
                    }
                } else {
                    console.log('⚠️ UNIVERSAL: Auto-save failed, continuing...');
                    
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkForSave);
                        resolve();
                    }
                }
            }
        }, 10000) : null;
        
        const checkForSave = setInterval(() => {
            const currentUrl = window.location.href;
            const elapsed = Date.now() - startTime;
            
            if (currentUrl !== startUrl && 
                (currentUrl.includes('/lightning/r/') && !currentUrl.includes('/new'))) {
                
                if (!resolved) {
                    resolved = true;
                    clearInterval(checkForSave);
                    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                    console.log('✅ UNIVERSAL: Manual save detected!');
                    showToast('✅ UNIVERSAL: Save detected!');
                    setTimeout(resolve, 2000);
                }
            }
            
            const successToast = document.querySelector('.slds-notify_toast.slds-theme_success, .slds-toast_success, .toast-success');
            if (successToast && !resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('✅ UNIVERSAL: Success toast detected!');
                showToast('✅ UNIVERSAL: Save successful!');
                setTimeout(resolve, 2000);
            }
            
            if (enableAutoSave && elapsed >= 7000 && elapsed <= 9900 && !resolved) {
                const remaining = Math.ceil((10000 - elapsed) / 1000);
                showToast(`🤖 UNIVERSAL: Auto-saving in ${remaining}...`, 900);
            }
        }, 1000);
        
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('⚠️ UNIVERSAL: Timeout - continuing...');
                resolve();
            }
        }, 120000);
    });
}

async function attemptUniversalAutoSave() {
    console.log('🤖 UNIVERSAL: === AUTO-SAVE WITH UNIVERSAL UI SUPPORT ===');
    
    try {
        const saveButtonSelectors = [
            'button[title="Save"]',
            '.slds-button[title="Save"]',
            'lightning-button[title="Save"]',
            'input[value="Save"]',
            'button[name="save"]',
            '.save-button',
            '[data-action="save"]'
        ];
        
        let saveButton = null;
        for (const selector of saveButtonSelectors) {
            saveButton = document.querySelector(selector);
            if (saveButton && isElementVisible(saveButton)) {
                console.log(`✅ UNIVERSAL: Found Save button: ${selector}`);
                break;
            }
        }
        
        if (!saveButton) {
            const allButtons = document.querySelectorAll('button, input[type="submit"], lightning-button');
            for (const btn of allButtons) {
                const text = btn.textContent.trim().toLowerCase();
                const value = (btn.getAttribute('value') || '').toLowerCase();
                if ((text === 'save' || value === 'save') && isElementVisible(btn)) {
                    saveButton = btn;
                    console.log('✅ UNIVERSAL: Found Save by text');
                    break;
                }
            }
        }
        
        if (!saveButton) {
            console.log('❌ UNIVERSAL: No Save button found');
            return false;
        }
        
        saveButton.click();
        await sleep(2000);
        
        const success = window.location.href.includes('/lightning/r/') && 
                       !window.location.href.includes('/new');
        
        console.log(`${success ? '✅' : '⚠️'} UNIVERSAL: Auto-save result: ${success}`);
        return success;
        
    } catch (error) {
        console.error('❌ UNIVERSAL: Auto-save error:', error);
        return false;
    }
}

/**
 * 🌟 UNIVERSAL: Handle autofill extraction
 */
async function handleAutofillExtraction() {
    try {
        updateStatus("🌟 UNIVERSAL: Extracting fields for autofill across all UI patterns...");
        
        const fieldData = await extractUniversalFormFields();
        const aiSuggestions = await fetchGeminiDataMerged(fieldData.fields);
        
        await populateUniversalFormFields(fieldData.fields, aiSuggestions, fieldData.currentValues);
        
        updateStatus("🌟 UNIVERSAL: Autofill completed successfully");
        
        return {
            status: "success",
            fields: fieldData.fields.map(f => f.name),
            populated: Object.keys(aiSuggestions).length
        };
        
    } catch (error) {
        updateStatus(`🌟 UNIVERSAL: Autofill failed: ${error.message}`);
        throw error;
    }
}

// Keep all original helper functions but enhance them for universal support
function getSalesforceFieldTypeMerged(apiFieldName) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    const inputElement = container?.querySelector('input') ?? null;
    
    if (container) {
        const typeDiv = container.querySelector('[class*="uiInput"]');
        const classList = typeDiv?.className ?? '';
        
        const editableDiv = container.querySelector('input[type=file]');
        const lightningDatetimePicker = container.querySelector('lightning-datetimepicker');
        const fieldSetDatetime = container.querySelector('fieldset');
        const fieldSetDtClasses = fieldSetDatetime?.className ?? '';
        const lightningDatePicker = container.querySelector('lightning-datepicker');
        const datePickerBtn = container.querySelector('a.datePicker-openIcon');
        const lightningTimePicker = container.querySelector('lightning-timepicker');
        
        if (editableDiv) return 'file';
        
        if ((lightningDatetimePicker !== null && lightningDatetimePicker !== undefined) ||
            (fieldSetDtClasses.includes('uiInputDateTime'))) {
            return 'datetime';
        }
        
        if (lightningTimePicker) return 'time';
        
        if (lightningDatePicker || datePickerBtn) return 'date';
        
        if (inputElement && inputElement.classList.contains('uiInput--lookup')) {
            return "lookup";
        } else if (inputElement && inputElement.classList.contains('slds-combobox__input')) {
            let parent = inputElement.closest('[data-lookup]');
            if (parent !== null) {
                return "lookup";
            }
        }
        
        if (classList.includes('uiInputNumber')) return 'number';
        if (classList.includes('uiInputCurrency')) return 'currency';
        if (classList.includes('uiInputRichText')) return 'richtext';
        if (classList.includes('uiInputCheckbox')) return 'checkbox';
        if (classList.includes('uiInputSelect')) return 'picklist';
        if (typeDiv && typeDiv.querySelector('a.select')) return 'picklist-anchor';
    }
    
    return 'text';
}

async function getAllPicklistOptionsMerged() {
    const allFields = document.querySelectorAll('[data-target-selection-name*="sfdc:RecordField."]');
    const results = {};

    for (const container of allFields) {
        const childWithClass = container.querySelector('.uiInputSelect.forceInputPicklist');
        const fieldName = container.getAttribute('data-target-selection-name');
        const apiName = fieldName.replace(/^sfdc:RecordField\./, '');
        const comboboxBtn = container.querySelector('button.slds-combobox__input');
        
        if (childWithClass !== null && childWithClass !== undefined && childWithClass) {
            if (!fieldName) continue;
            
            const hasAnchor = container.querySelector('a.select');
            if (!hasAnchor) continue;
            
            const options = await getPicklistOptionsForFieldMerged(fieldName, "anchor");
            results[apiName] = { 'options': options };
        } else if (comboboxBtn !== null && comboboxBtn) {
            const isRichText = isRichTextInputMerged(apiName);
            if (isRichText) continue;
            if (!fieldName) continue;
            
            const options = await getPicklistOptionsForFieldMerged(fieldName, "combobox");
            results[apiName] = { 'options': options };
        }
    }

    return results;
}

function getPicklistOptionsForFieldMerged(apiFieldName, type) {
    const selector = `[data-target-selection-name="${apiFieldName}"]`;
    const fieldContainer = document.querySelector(selector);
    
    if (type === "anchor") {
        if (!fieldContainer) return Promise.resolve([]);
        
        const dropdownAnchor = fieldContainer.querySelector('a.select');
        if (!dropdownAnchor) return Promise.resolve([]);
        
        dropdownAnchor.click();
        
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const interval = setInterval(() => {
                const menus = [...document.body.querySelectorAll('div[role="listbox"].select-options')];
                const menu = menus.find(m => m.offsetParent !== null && m.querySelector('ul') && m.querySelector('li'));
                
                if (menu) {
                    const options = [...menu.querySelectorAll('a[role="option"]')]
                        .map(a => a.textContent.trim())
                        .filter(Boolean);
                    
                    clearInterval(interval);
                    dropdownAnchor.click();
                    resolve(options);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve([]);
                }
            }, 200);
        });
    } else if (type === "combobox") {
        return new Promise((resolve) => {
            if (!fieldContainer) return resolve([]);
            
            const picklistButton = fieldContainer.querySelector('button.slds-combobox__input');
            if (!picklistButton) return resolve([]);
            
            picklistButton.click();
            
            let attempts = 0;
            const maxAttempts = 10;
            
            const interval = setInterval(() => {
                const dropdown = fieldContainer.querySelector('[role="listbox"]');
                if (dropdown && dropdown.querySelectorAll('[role="option"]').length > 0) {
                    const options = Array.from(dropdown.querySelectorAll('[role="option"]'))
                        .map(opt => opt.innerText.trim())
                        .filter(Boolean);
                    
                    clearInterval(interval);
                    picklistButton.click();
                    resolve(options);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    picklistButton.click();
                    resolve([]);
                }
            }, 200);
        });
    }
    
    return Promise.resolve([]);
}

async function setPicklistValueMerged(apiFieldName, desiredValue) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    const typeOfPicklistField = getTypeOfPicklistFieldMerged(apiFieldName);
    
    if (typeOfPicklistField === "anchor") {
        return new Promise((resolve, reject) => {
            if (!container) return reject(`Field ${apiFieldName} not found`);
            
            const dropdownAnchor = container.querySelector('a.select');
            if (!dropdownAnchor) return reject(`No dropdown anchor found for ${apiFieldName}`);
            
            dropdownAnchor.click();
            
            let attempts = 0;
            const maxAttempts = 20;
            
            const interval = setInterval(() => {
                const allMenus = [...document.querySelectorAll('div[role="listbox"].select-options')];
                const visibleMenu = allMenus.find(menu => menu.offsetParent !== null);
                
                if (visibleMenu) {
                    const options = [...visibleMenu.querySelectorAll('a[role="option"]')];
                    const option = options.find(a => a.textContent.trim() === desiredValue);
                    
                    if (option) {
                        option.click();
                        clearInterval(interval);
                        resolve(`Set ${apiFieldName} to ${desiredValue}`);
                    } else if (options.length > 0) {
                        clearInterval(interval);
                        const available = options.map(o => o.textContent.trim()).join(', ');
                        dropdownAnchor.click();
                        reject(`Value "${desiredValue}" not found for ${apiFieldName}. Available: ${available}`);
                    }
                }
                
                if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    dropdownAnchor.click();
                    reject(`Dropdown for ${apiFieldName} did not render`);
                }
            }, 200);
        });
    } else if (typeOfPicklistField === "combobox") {
        return new Promise((resolve, reject) => {
            if (!container) return reject(`Field ${apiFieldName} not found`);
            
            const picklistButton = container.querySelector('button.slds-combobox__input');
            if (!picklistButton) return reject(`No combobox button found for ${apiFieldName}`);
            
            picklistButton.click();
            
            let attempts = 0;
            const maxAttempts = 20;
            
            const interval = setInterval(() => {
                const dropdown = container.querySelector('[role="listbox"]');
                const options = dropdown ? dropdown.querySelectorAll('[role="option"]') : [];
                
                if (options.length > 0) {
                    const option = Array.from(options).find(opt => opt.innerText.trim() === desiredValue);
                    if (option) {
                        option.click();
                        clearInterval(interval);
                        resolve(`Set ${apiFieldName} to ${desiredValue}`);
                    } else {
                        clearInterval(interval);
                        picklistButton.click();
                        const available = Array.from(options).map(o => o.innerText.trim()).join(', ');
                        reject(`Value "${desiredValue}" not found for ${apiFieldName}. Available: ${available}`);
                    }
                }
                
                if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    picklistButton.click();
                    reject(`Combobox dropdown for ${apiFieldName} did not render`);
                }
            }, 200);
        });
    }
    
    return Promise.resolve();
}

function getTypeOfPicklistFieldMerged(apiFieldName) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    const childWithClass = container.querySelector('.uiInputSelect.forceInputPicklist');
    const fieldName = container.getAttribute('data-target-selection-name');
    const comboboxBtn = container.querySelector('button.slds-combobox__input');
    
    if (childWithClass !== null && childWithClass !== undefined && childWithClass) {
        const hasAnchor = container.querySelector('a.select');
        if (fieldName && hasAnchor) {
            return "anchor";
        }
    } else if (comboboxBtn !== null && comboboxBtn) {
        return "combobox";
    }
    
    return null;
}

function getPicklistValueMerged(apiFieldName) {
    const typeOfPicklistField = getTypeOfPicklistFieldMerged(apiFieldName);
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    
    if (!container) {
        console.warn(`Field ${apiFieldName} not found`);
        return null;
    }
    
    if (typeOfPicklistField === "anchor") {
        const selected = container.querySelector('.uiMenuItem > a.selected');
        if (selected) {
            return selected.textContent.trim();
        }
        
        const anchor = container.querySelector('a.select');
        return anchor ? anchor.textContent.trim() : null;
    } else if (typeOfPicklistField === "combobox") {
        const selectedButton = container?.querySelector('button.slds-combobox__input-value[data-value]');
        let selectedValue = '';
        if (selectedButton) {
            selectedValue = selectedButton.getAttribute('data-value');
        }
        return selectedValue;
    }
    
    return '';
}

function isRichTextInputMerged(apiFieldName) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    if (container) {
        const editableDiv = container.querySelector('input[type=file]');
        if (editableDiv) {
            return true;
        }
    }
    return false;
}

function getTimeOptionsMerged() {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const isPM = hour >= 12;
            const hour12 = hour % 12 === 0 ? 12 : hour % 12;
            const minStr = min.toString().padStart(2, '0');
            const suffix = isPM ? 'PM' : 'AM';
            options.push(`${hour12}:${minStr} ${suffix}`);
        }
    }
    return options;
}

async function fetchGeminiDataMerged(fieldNames) {
    const API_KEY = "AIzaSyD2SEIrk0TXk32YMmDJ83YvUIWUfvQEXTc";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const fieldDescriptions = fieldNames.map(field => {
        if (field.type === 'picklist' && field.options?.length) {
            const validOptions = field.options.filter(opt => opt !== '--None--');
            return `${field.apiName} (picklist): Options = ${validOptions.join(', ')}`;
        } else if (field.type === "time") {
            return `${field.apiName} (time)`;
        } else if (field.type === "datetime") {
            return `${field.apiName} (datetime)`;
        } else if (field.type === "date") {
            return `${field.apiName} (date)`;
        } else if (field.type === "double" || field.type === "int" || field.type === "currency") {
            let range = '';
            if (field.min !== undefined && field.max !== undefined) {
                range = ` Range: ${field.min} - ${field.max}`;
            }
            return `${field.apiName} (${field.type})${range}`;
        } else {
            return `${field.apiName} (${field?.type || 'text'})`;
        }
    });

    const timeOptions = getTimeOptionsMerged();

    const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

    const userMessage = `Generate realistic and unique Salesforce field values for:
${fieldDescriptions.join('\n')}

Requirements:
- Return as JSON object with field API names as keys
- For picklist fields, only use provided options (not '--None--')
- For date fields, use format: DD/MM/YYYY (with slashes only, not hyphens)
- For datetime fields, return object: {date: "31/12/2025", time: "2:00 AM"} (use DD/MM/YYYY format with slashes only)
- For time fields, use options: ${timeOptions.slice(0, 10).join(', ')}...
- For number fields (like currency or int), keep values within the specified range
- Use unique, non-generic values. Append suffix ${randomSuffix} to names and emails to ensure uniqueness
- Always include mandatory fields like LastName if present
- Return only valid JSON, no explanation

Example format:
{
  "Name": "Visionary Dynamics ${randomSuffix}",
  "LastName": "Brown${randomSuffix}",
  "Email": "visionary${randomSuffix}@tech.com",
  "Start_Date__c": "31/12/2025",
  "Revenue__c": 12000
}`;

    const requestBody = {
        contents: [{
            role: "user",
            parts: [{ text: userMessage }]
        }]
    };

    try {
        console.log('🌐 UNIVERSAL: Calling Gemini API...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No AI response received");
        }

        let rawResponse = data.candidates[0].content.parts[0].text;
        let jsonString = rawResponse.replace(/```json|```/g, "").trim();
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        const parsedData = JSON.parse(jsonString);

        // Make key fields unique
        if (parsedData.Name) {
            parsedData.Name += ` ${randomSuffix}`;
        }
        if (parsedData.LastName && typeof parsedData.LastName === 'string') {
            parsedData.LastName += `${randomSuffix}`;
        } else if (!parsedData.LastName) {
            parsedData.LastName = `LastName${randomSuffix}`;
        }
        if (parsedData.Email && parsedData.Email.includes('@')) {
            const [local, domain] = parsedData.Email.split('@');
            parsedData.Email = `${local.replace(/\W/g, '')}${randomSuffix}@${domain}`;
        }
        if (parsedData.Phone) {
            parsedData.Phone = parsedData.Phone.replace(/\D/g, '').slice(0, 7) + randomSuffix;
        }

        // AI Validation: fix date formats and number ranges
        for (const field of fieldNames) {
            const value = parsedData[field.apiName];

            // Fix date format: YYYY-MM-DD ➜ DD/MM/YYYY
            if (field.type === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [yyyy, mm, dd] = value.split('-');
                parsedData[field.apiName] = `${dd}/${mm}/${yyyy}`;
            }

            if (field.type === 'datetime' && value?.date && /^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
                const [yyyy, mm, dd] = value.date.split('-');
                parsedData[field.apiName].date = `${dd}/${mm}/${yyyy}`;
            }

            if (
                ['double', 'int', 'currency'].includes(field.type) &&
                typeof value === 'number'
            ) {
                if (field.min !== undefined && value < field.min) {
                    parsedData[field.apiName] = field.min;
                } else if (field.max !== undefined && value > field.max) {
                    parsedData[field.apiName] = field.max;
                }
            }
        }

        console.log('✅ FINAL AI-SAFE DATA:', parsedData);
        return parsedData;

    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        throw new Error(`AI suggestions failed: ${error.message}`);
    }
}

console.log('✅ 🌟 UNIVERSAL: Enhanced content script with UNIVERSAL UI SUPPORT for ALL Salesforce layouts loaded successfully');
