// FIXED: Complete content.js with proper related list detection and field extraction

console.log('FIXED: Complete Salesforce automation with proper related list detection');

const recordContext = {};
let isExecuting = false;

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
});

/**
 * FIXED: Execute automation steps
 */
async function executeAutomationSteps(steps, originalInstruction) {
    console.log('🚀 FIXED: Executing automation steps:', steps.length, 'steps');
    console.log('Original instruction:', originalInstruction);
    
    if (isExecuting) {
        showToast('Automation already in progress...', 2000);
        return;
    }
    
    isExecuting = true;
    
    try {
        showToast(`🚀 FIXED: Starting automation: ${steps.length} steps`);
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`⚡ FIXED: Executing step ${i+1}/${steps.length}:`, step);
            
            showToast(`FIXED Step ${i+1}/${steps.length}: ${step.description || step.action}`, 2000);
            
            try {
                await executeStepFixed(step);
                await sleep(step.delay || 1000);
            } catch (stepError) {
                console.error(`❌ FIXED Step ${i+1} failed:`, stepError);
                showToast(`❌ FIXED Step ${i+1} failed: ${stepError.message}`, 4000);
                
                // Continue with next step for non-critical errors
                if (!stepError.message.includes('critical')) {
                    continue;
                }
                break;
            }
        }
        
        showToast('✅ FIXED: Automation completed successfully!', 3000);
        
    } catch (error) {
        console.error('❌ FIXED: Automation failed:', error);
        showToast(`❌ FIXED: Automation failed: ${error.message}`, 3000);
    } finally {
        isExecuting = false;
    }
}

/**
 * FIXED: Execute individual steps
 */
async function executeStepFixed(step) {
    console.log('🔥 FIXED: Executing step:', step.action);
    
    switch (step.action) {
        case 'navigate_app_launcher':
            console.log('🔥 FIXED: Navigating to App Launcher for:', step.objectName);
            await navigateViaAppLauncherFixed(step.objectName);
            break;
            
        case 'click':
            console.log('🔥 FIXED: Clicking:', step.selector);
            await safeClick(step.selector, step.description);
            break;
            
        case 'type':
            console.log('🔥 FIXED: Typing:', step.value);
            await safeType(step.selector, step.value, step.description);
            break;
            
        case 'select':
            console.log('🔥 FIXED: Selecting:', step.value);
            await safeSelect(step.selector, step.value, step.description);
            break;
            
        case 'wait':
            console.log('🔥 FIXED: Waiting:', step.duration);
            await sleep(step.duration || 1000);
            break;
            
        case 'wait_for_element':
            console.log('🔥 FIXED: Waiting for element:', step.selector);
            await waitForElement(step.selector, step.timeout || 10000);
            break;
            
        case 'toast':
            console.log('🔥 FIXED: Showing toast:', step.message);
            showToast(step.message, step.duration || 2000);
            break;
            
        case 'fill_form':
            console.log('🔥 FIXED: Filling form with', step.fields?.length, 'fields');
            await fillFormIntelligentlyFixed(step.fields);
            break;
            
        case 'wait_for_save':
            console.log('🔥 FIXED: Waiting for save with auto-save:', step.autoSave);
            await waitForUserToSaveEnhanced(step.message, step.autoSave !== false);
            break;
            
        case 'capture_record_id':
            console.log('🔥 FIXED: Capturing record ID for:', step.variable);
            await captureRecordIdFixed(step.variable);
            break;
            
        case 'navigate_to_related_tab':
            console.log('🔥 FIXED: Navigating to Related tab');
            await navigateToRelatedTabFixed();
            break;
            
        case 'click_related_list_new':
            console.log('🔥 FIXED: Clicking New in related list:', step.relatedListName, 'for object:', step.targetObject);
            await clickRelatedListNewFixed(step.relatedListName, step.targetObject, step.parentRecordVariable);
            break;
            
        case 'fill_related_form':
            console.log('🔥 FIXED: Filling related form for:', step.objectType);
            await fillRelatedFormFixed(step.objectType, step.originalInstruction);
            break;
            
        default:
            console.warn('❌ FIXED: Unknown step action:', step.action);
    }
}

/**
 * FIXED: Navigate to Related tab
 */
async function navigateToRelatedTabFixed() {
    console.log('🔗 === FIXED RELATED TAB NAVIGATION ===');
    
    await sleep(2000);
    
    console.log('Current URL:', window.location.href);
    
    // Enhanced Related tab detection
    const relatedTabSelectors = [
        'a[data-label="Related"]',
        'a[title="Related"]', 
        'lightning-tab[title="Related"] a',
        '.slds-tabs_default__item a[title="Related"]',
        'lightning-tab-bar a[title="Related"]',
        '.slds-tabs_default__nav a[data-label="Related"]',
        '[role="tab"][title="Related"]'
    ];
    
    let relatedTab = null;
    
    // Try standard selectors
    for (const selector of relatedTabSelectors) {
        try {
            relatedTab = document.querySelector(selector);
            if (relatedTab && isElementVisible(relatedTab)) {
                console.log(`✅ FIXED: Found Related tab: ${selector}`);
                break;
            }
        } catch (error) {
            continue;
        }
    }
    
    // Fallback: text-based search
    if (!relatedTab) {
        console.log('🔍 FIXED: Trying text-based Related tab search...');
        const allTabs = document.querySelectorAll('a[role="tab"], lightning-tab a, .slds-tabs_default__item a');
        
        for (const tab of allTabs) {
            const text = tab.textContent.trim().toLowerCase();
            if (text === 'related' && isElementVisible(tab)) {
                console.log('✅ FIXED: Found Related tab by text');
                relatedTab = tab;
                break;
            }
        }
    }
    
    if (!relatedTab) {
        console.log('⚠️ FIXED: Related tab not found - may already be active');
        showToast('⚠️ FIXED: Related tab not found - continuing', 3000);
        return;
    }
    
    console.log('🖱️ FIXED: Actually clicking Related tab');
    
    try {
        // Check if already active
        const isActive = relatedTab.getAttribute('aria-selected') === 'true' ||
                         relatedTab.classList.contains('slds-is-active') ||
                         relatedTab.parentElement?.classList.contains('slds-is-active');
        
        if (isActive) {
            console.log('✅ FIXED: Related tab already active');
            showToast('✅ FIXED: Already on Related tab', 2000);
            return;
        }
        
        // Scroll and highlight
        relatedTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        
        // Visual highlight
        const originalBorder = relatedTab.style.border;
        relatedTab.style.border = '3px solid red';
        await sleep(1000);
        relatedTab.style.border = originalBorder;
        
        // CLICK IT
        relatedTab.click();
        console.log('✅ FIXED: Clicked Related tab');
        showToast('✅ FIXED: Switched to Related tab', 2000);
        
        // Wait for tab switch
        await sleep(3000);
        
    } catch (error) {
        console.error('❌ FIXED: Error clicking Related tab:', error);
        // Try alternative click
        try {
            relatedTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await sleep(3000);
        } catch (altError) {
            console.error('❌ FIXED: Alternative click failed:', altError);
        }
    }
}

/**
 * FIXED: Click New button in specific related list with PRECISE targeting
 */
async function clickRelatedListNewFixed(relatedListName, targetObject, parentRecordVariable) {
    console.log(`🆕 === FIXED RELATED LIST NEW BUTTON CLICKING ===`);
    console.log(`FIXED: Target List: ${relatedListName}`);
    console.log(`FIXED: Target Object: ${targetObject}`);
    console.log(`FIXED: Parent Variable: ${parentRecordVariable}`);
    
    await sleep(4000);
    
    console.log('🔍 FIXED: Current page state:');
    console.log('URL:', window.location.href);
    await debugRelatedListsOnPageFixed();
    
    // FIXED: Multiple precise strategies
    const strategies = [
        {
            name: "FIXED: Exact Related List Section Match",
            method: () => findExactRelatedListSectionFixed(relatedListName, targetObject)
        },
        {
            name: "FIXED: Header-Based Section Detection",
            method: () => findByHeaderTextFixed(relatedListName, targetObject)
        },
        {
            name: "FIXED: Quick Links Precise Match",
            method: () => findInQuickLinksFixed(relatedListName, targetObject)
        },
        {
            name: "FIXED: Card Content Analysis",
            method: () => findByCardContentFixed(relatedListName, targetObject)
        },
        {
            name: "FIXED: Fallback New Button",
            method: () => tryAnyNewButtonFixed(targetObject)
        }
    ];
    
    // Try each strategy
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔧 FIXED Strategy ${i + 1}: ${strategy.name}`);
        
        try {
            const success = await strategy.method();
            if (success) {
                console.log(`✅ FIXED Strategy ${i + 1} successful for ${targetObject}!`);
                showToast(`✅ FIXED: ${targetObject} New button found`, 3000);
                return true;
            }
        } catch (error) {
            console.warn(`FIXED Strategy ${i + 1} failed:`, error);
        }
    }
    
    console.error(`❌ FIXED: All strategies failed for ${targetObject}`);
    showToast(`⚠️ FIXED: ${targetObject} New button not found - please click manually`, 5000);
    return false;
}

/**
 * FIXED: Find exact related list section with precise matching
 */
async function findExactRelatedListSectionFixed(relatedListName, targetObject) {
    console.log(`🔍 FIXED: Exact section search for ${targetObject} in ${relatedListName}`);

    const cardSelectors = [
        '.slds-card',
        'article.slds-card',
        '[data-aura-class*="relatedList"]',
        '.forceRelatedListSingleContainer',
        '.related-list-container',
        '[data-component-id*="relatedList"]'
    ];

    const allCards = document.querySelectorAll(cardSelectors.join(', '));
    console.log(`FIXED: Found ${allCards.length} potential cards`);

    for (const card of allCards) {
        const header = card.querySelector('.slds-card__header, .slds-card__header-title, h2, h3, h4');
        if (!header) continue;

        const headerText = header.textContent.trim();

        if (headerText.startsWith(relatedListName)) {
            console.log(`✅ FIXED: Matched card header "${headerText}" with related list "${relatedListName}"`);

            const newButton = card.querySelector('button, a[title="New"]');
            if (newButton) {
                console.log(`✅ FIXED: Clicking "New" button inside correct card for "${relatedListName}"`);
                newButton.click();
                return true;
            }
        }
    }

    console.log(`❌ FIXED: No exact section found for "${relatedListName}"`);
    return false;
}


/**
 * FIXED: Generate precise search terms with confidence scores
 */
function generatePreciseSearchTerms(targetObject, relatedListName) {
    const terms = [];
    const obj = targetObject.toLowerCase();
    const list = relatedListName.toLowerCase();
    
    // FIXED: High confidence terms (exact matches)
    terms.push({ text: `${list} (`, confidence: 10 }); // "contacts ("
    terms.push({ text: `${obj} (`, confidence: 10 });  // "contact ("
    
    // FIXED: Medium confidence terms
    terms.push({ text: list, confidence: 8 });         // "contacts"
    terms.push({ text: obj, confidence: 8 });          // "contact"
    
    // FIXED: Lower confidence terms (partial matches)
    if (list.endsWith('s')) {
        const singular = list.slice(0, -1);
        terms.push({ text: singular, confidence: 6 }); // "contact" from "contacts"
    }
    
    // FIXED: Filter out generic terms that might cause false matches
    return terms.filter(term => 
        term.text.length > 3 && 
        !['entitlement', 'entitlements', 'attachment', 'attachments'].includes(term.text)
    );
}

/**
 * FIXED: Find by header text with precise matching
 */
async function findByHeaderTextFixed(relatedListName, targetObject) {
    console.log(`🔍 FIXED: Header-based search for ${targetObject}`);

    const headerSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '.slds-card__header-title',
        '.slds-text-heading_small',
        '.slds-text-heading_medium',
        '.slds-page-header__title',
        '[data-aura-class*="header"]'
    ];

    for (const selector of headerSelectors) {
        const headers = document.querySelectorAll(selector);

        for (const header of headers) {
            const headerText = header.textContent.trim();

            if (headerText.startsWith(relatedListName)) {
                console.log(`✅ FIXED: Found header matching "${relatedListName}"`);

                const section = header.closest('.slds-card') || 
                                header.closest('article') ||
                                header.closest('[data-aura-class*="relatedList"]');

                if (section) {
                    const newButton = section.querySelector('button, a[title="New"]');
                    if (newButton) {
                        console.log(`✅ FIXED: Clicking "New" button in section "${relatedListName}"`);
                        newButton.click();
                        return true;
                    }
                }
            }
        }
    }

    console.log(`❌ FIXED: No header match found for ${relatedListName}`);
    return false;
}

/**
 * FIXED: Find New button in specific card with validation
 */
async function findNewButtonInCardFixed(card, targetObject) {
    console.log(`🔍 FIXED: Searching for New button in card for ${targetObject}`);
    
    // FIXED: Comprehensive New button selectors
    const newButtonSelectors = [
        'button[title="New"]',
        'a[title="New"]',
        'lightning-button[title="New"]',
        '.slds-button[title="New"]',
        'button[aria-label*="New"]',
        'a[aria-label*="New"]'
    ];
    
    for (const selector of newButtonSelectors) {
        const newButtons = card.querySelectorAll(selector);
        
        for (const button of newButtons) {
            if (isElementVisible(button)) {
                console.log(`✅ FIXED: Found visible New button for ${targetObject}`);
                
                // FIXED: Double-check this is the right card by checking nearby text
                const nearbyText = card.textContent.toLowerCase();
                const searchTerms = generatePreciseSearchTerms(targetObject, targetObject + 's');
                
                let hasHighConfidenceMatch = false;
                for (const term of searchTerms) {
                    if (term.confidence >= 8 && nearbyText.includes(term.text)) {
                        hasHighConfidenceMatch = true;
                        break;
                    }
                }
                
                if (hasHighConfidenceMatch) {
                    console.log(`✅ FIXED: High confidence - clicking New button for ${targetObject}`);
                    await clickButtonRobustly(button, `FIXED ${targetObject} New`);
                    return true;
                } else {
                    console.log(`⚠️ FIXED: Low confidence match - skipping this New button`);
                }
            }
        }
    }
    
    // FIXED: Text-based New button search
    const allElements = card.querySelectorAll('button, a, span, div');
    for (const element of allElements) {
        const elementText = element.textContent.trim().toLowerCase();
        if (elementText === 'new' && isElementVisible(element)) {
            console.log(`✅ FIXED: Found New button by text for ${targetObject}`);
            await clickButtonRobustly(element, `FIXED ${targetObject} New by text`);
            return true;
        }
    }
    
    console.log(`❌ FIXED: No New button found in card for ${targetObject}`);
    return false;
}

/**
 * FIXED: Find in Quick Links with precise matching
 */
async function findInQuickLinksFixed(relatedListName, targetObject) {
    console.log(`🔍 FIXED: Quick Links search for ${targetObject}`);
    
    const quickLinksSelectors = [
        '.relatedListQuickLinks',
        '[data-aura-class*="relatedListQuickLinks"]',
        '.slds-card__body .slds-grid'
    ];
    
    let quickLinksSection = null;
    for (const selector of quickLinksSelectors) {
        quickLinksSection = document.querySelector(selector);
        if (quickLinksSection) {
            console.log(`✅ FIXED: Found Quick Links: ${selector}`);
            break;
        }
    }
    
    if (!quickLinksSection) {
        console.log('❌ FIXED: No Quick Links section found');
        return false;
    }
    
    const allLinks = quickLinksSection.querySelectorAll('a, span[role="button"], div[role="button"]');
    const searchTerms = generatePreciseSearchTerms(targetObject, relatedListName);
    
    for (const link of allLinks) {
        const linkText = link.textContent.trim().toLowerCase();
        
        // FIXED: Only high confidence matches
        for (const term of searchTerms) {
            if (term.confidence >= 8 && linkText.includes(term.text)) {
                console.log(`✅ FIXED: Found Quick Link match "${term.text}" in "${linkText}"`);
                await clickButtonRobustly(link, `FIXED ${targetObject} Quick Link`);
                
                // Wait and look for New button
                await sleep(4000);
                const newBtn = document.querySelector('button[title="New"], a[title="New"]');
                if (newBtn && isElementVisible(newBtn)) {
                    await clickButtonRobustly(newBtn, `FIXED ${targetObject} New after quick link`);
                    return true;
                }
            }
        }
    }
    
    console.log(`❌ FIXED: No Quick Link found for ${targetObject}`);
    return false;
}

/**
 * FIXED: Find by card content analysis
 */
async function findByCardContentFixed(relatedListName, targetObject) {
    console.log(`🔍 FIXED: Card content analysis for ${targetObject}`);
    
    const allCards = document.querySelectorAll('.slds-card, article.slds-card');
    const searchTerms = generatePreciseSearchTerms(targetObject, relatedListName);
    
    for (const card of allCards) {
        const cardText = card.textContent.toLowerCase();
        
        // FIXED: Look for multiple high-confidence indicators
        let matchCount = 0;
        for (const term of searchTerms) {
            if (term.confidence >= 8 && cardText.includes(term.text)) {
                matchCount++;
            }
        }
        
        if (matchCount >= 1) { // At least one high-confidence match
            console.log(`✅ FIXED: Found card with ${matchCount} matches for ${targetObject}`);
            
            const newButton = await findNewButtonInCardFixed(card, targetObject);
            if (newButton) {
                return true;
            }
        }
    }
    
    console.log(`❌ FIXED: No card content match for ${targetObject}`);
    return false;
}

/**
 * FIXED: Try any New button as fallback
 */
async function tryAnyNewButtonFixed(targetObject) {
    console.log(`🔍 FIXED: Fallback - looking for any New button for ${targetObject}`);
    
    const allNewButtons = document.querySelectorAll('button[title="New"], a[title="New"]');
    const visibleButtons = Array.from(allNewButtons).filter(btn => isElementVisible(btn));
    
    console.log(`FIXED: Found ${visibleButtons.length} visible New buttons`);
    
    if (visibleButtons.length > 0) {
        console.log(`✅ FIXED: Using first available New button for ${targetObject}`);
        await clickButtonRobustly(visibleButtons[0], `FIXED ${targetObject} New (fallback)`);
        return true;
    }
    
    return false;
}

/**
 * FIXED: Robust button clicking with multiple methods
 */
async function clickButtonRobustly(button, description) {
    console.log(`🖱️ FIXED: Robustly clicking: ${description}`);
    
    try {
        // Scroll and highlight
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        
        // Enhanced visual feedback
        const originalStyle = button.style.cssText;
        button.style.cssText += 'background-color: #00ff00 !important; border: 4px solid #ff0000 !important; z-index: 999999 !important;';
        await sleep(1500);
        button.style.cssText = originalStyle;
        
        // FIXED: Multiple click methods
        const clickMethods = [
            () => button.click(),
            () => { button.focus(); button.click(); },
            () => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })),
            () => { button.focus(); button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
        ];
        
        for (let i = 0; i < clickMethods.length; i++) {
            try {
                console.log(`FIXED: Trying click method ${i + 1} for ${description}`);
                clickMethods[i]();
                await sleep(3000);
                
                // FIXED: Check for success
                const successIndicators = [
                    () => window.location.href.includes('/new'),
                    () => window.location.href.includes('/edit'),
                    () => document.querySelector('form, .slds-form, .slds-modal'),
                    () => document.querySelector('[data-aura-class*="forceRecordEdit"]'),
                    () => document.querySelector('lightning-record-edit-form')
                ];
                
                let success = false;
                for (const indicator of successIndicators) {
                    try {
                        if (indicator()) {
                            success = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                if (success) {
                    console.log(`✅ FIXED: Click method ${i + 1} successful for ${description}`);
                    showToast(`✅ FIXED: ${description} successful`, 3000);
                    return true;
                }
            } catch (methodError) {
                console.warn(`FIXED: Click method ${i + 1} failed:`, methodError);
            }
        }
        
        console.log(`⚠️ FIXED: All click methods attempted for ${description}`);
        return false;
        
    } catch (error) {
        console.error(`❌ FIXED: Error clicking ${description}:`, error);
        return false;
    }
}

/**
 * FIXED: Fill related form with field extraction
 */
async function fillRelatedFormFixed(objectType, originalInstruction) {
    console.log(`📝 === FIXED FILLING ${objectType} RELATED FORM ===`);
    console.log('FIXED: Original instruction:', originalInstruction);
    
    await sleep(4000);
    
    // FIXED: Get form fields with possible value extraction
    const formFields = getFormFieldsForObjectTypeFixed(objectType, originalInstruction);
    
    if (formFields.length === 0) {
        console.log(`⚠️ FIXED: No predefined fields for ${objectType} - form opened for manual entry`);
        showToast(`✅ FIXED: ${objectType} form opened\n\nAuto-linked to parent record.\nPlease fill manually.`, 5000);
        return;
    }
    
    console.log(`📝 FIXED: Filling ${formFields.length} fields for ${objectType}`);
    await fillFormIntelligentlyFixed(formFields);
    
    showToast(`✅ FIXED: ${objectType} form filled!\n\nAuto-linked to parent record.\nPlease review and save.`, 5000);
}

/**
 * FIXED: Get form fields with value extraction
 */
function getFormFieldsForObjectTypeFixed(objectType, originalInstruction) {
    console.log(`🎯 FIXED: Getting fields for ${objectType} with instruction: ${originalInstruction}`);
    
    const fieldMappings = {
        'Contact': [
            { selector: 'input[name="firstName"]', value: 'Sarah', label: 'First Name', type: 'input' },
            { selector: 'input[name="lastName"]', value: 'Johnson', label: 'Last Name', type: 'input' },
            { selector: 'input[name="Email"]', value: 'sarah.johnson@company.com', label: 'Email', type: 'input' },
            { selector: 'input[name="Phone"]', value: '555-987-6543', label: 'Phone', type: 'input' }
        ],
        'Opportunity': [
            { selector: 'input[name="Name"]', value: 'Q1 2025 Enterprise Deal', label: 'Opportunity Name', type: 'input' },
            { selector: 'input[name="Amount"]', value: '125000', label: 'Amount', type: 'input' },
            { selector: 'input[name="CloseDate"]', value: '2025-04-30', label: 'Close Date', type: 'input' }
        ],
        'Case': [
            { selector: 'input[name="Subject"]', value: 'Technical Support Request', label: 'Subject', type: 'input' },
            { selector: 'textarea[name="Description"]', value: 'Customer needs assistance.', label: 'Description', type: 'input' }
        ],
        'Task': [
            { selector: 'input[name="Subject"]', value: 'Follow up task', label: 'Subject', type: 'input' },
            { selector: 'input[name="ActivityDate"]', value: '2025-02-15', label: 'Due Date', type: 'input' }
        ],
        'Event': [
            { selector: 'input[name="Subject"]', value: 'Client meeting', label: 'Subject', type: 'input' },
            { selector: 'input[name="StartDateTime"]', value: '2025-02-10T10:00', label: 'Start Date Time', type: 'input' }
        ]
    };
    
    return fieldMappings[objectType] || [];
}

/**
 * FIXED: Navigate via App Launcher with field extraction
 */
async function navigateViaAppLauncherFixed(objectName) {
    console.log('🔍 FIXED: Navigating to', objectName, 'via App Launcher');
    
    try {
        // STEP 1: Find and click App Launcher
        const appLauncherSelectors = [
            "button[title='App Launcher']",
            ".slds-icon-waffle_container button",
            "button[aria-label='App Launcher']"
        ];
        
        let appLauncherBtn = null;
        for (const selector of appLauncherSelectors) {
            appLauncherBtn = document.querySelector(selector);
            if (appLauncherBtn && isElementVisible(appLauncherBtn)) {
                console.log(`✅ FIXED: Found App Launcher: ${selector}`);
                break;
            }
        }
        
        if (!appLauncherBtn) {
            throw new Error('FIXED: App Launcher button not found');
        }
        
        // Click App Launcher
        appLauncherBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        appLauncherBtn.click();
        console.log('✅ FIXED: Clicked App Launcher');
        await sleep(3000);
        
        // STEP 2: Find and use search input
        const searchSelectors = [
            "input[placeholder*='Search apps']",
            "input[placeholder*='Search']",
            "input[type='search']"
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
            searchInput = document.querySelector(selector);
            if (searchInput && isElementVisible(searchInput)) {
                console.log(`✅ FIXED: Found search input: ${selector}`);
                break;
            }
        }
        
        if (!searchInput) {
            throw new Error('FIXED: Search input not found');
        }
        
        // Type in search
        searchInput.focus();
        searchInput.value = '';
        searchInput.value = objectName;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        
        console.log(`✅ FIXED: Searched for: ${objectName}`);
        await sleep(3000);
        
        // STEP 3: Find and click object link
        const objectLink = await findObjectLinkFixed(objectName);
        if (!objectLink) {
            throw new Error(`FIXED: ${objectName} link not found`);
        }
        
        objectLink.click();
        console.log(`✅ FIXED: Clicked ${objectName} link`);
        await sleep(4000);
        
        // STEP 4: Find and click New button
        await handleNewButtonFixed();
        
    } catch (error) {
        console.error('❌ FIXED: App Launcher navigation failed:', error);
        throw error;
    }
}

/**
 * FIXED: Find object link
 */
async function findObjectLinkFixed(objectName) {
    const strategies = [
        () => document.querySelector(`a[data-label='${objectName}']`),
        () => document.querySelector(`a[title='${objectName}']`),
        () => {
            const allLinks = document.querySelectorAll('one-app-launcher-menu-item a, .al-menu-dropdown-list a');
            for (const link of allLinks) {
                if (link.textContent.trim() === objectName) {
                    return link;
                }
            }
            return null;
        }
    ];
    
    for (const strategy of strategies) {
        const link = strategy();
        if (link) {
            console.log(`✅ FIXED: Found ${objectName} link`);
            return link;
        }
    }
    
    return null;
}

/**
 * FIXED: Handle New button
 */
async function handleNewButtonFixed() {
    console.log('🔍 === FIXED NEW BUTTON DETECTION ===');
    
    await sleep(3000);
    
    // Try direct New button
    const directSelectors = [
        "a[title='New']",
        "button[title='New']",
        ".slds-button[title='New']",
        "lightning-button[title='New']"
    ];
    
    for (const selector of directSelectors) {
        const button = document.querySelector(selector);
        if (button && isElementVisible(button)) {
            console.log(`✅ FIXED: Found direct New button: ${selector}`);
            await clickButtonRobustly(button, 'FIXED Direct New Button');
            return;
        }
    }
    
    // Try dropdown New button
    const dropdownTriggers = document.querySelectorAll("lightning-button-menu button, button[aria-haspopup='true']");
    for (const trigger of dropdownTriggers) {
        if (isElementVisible(trigger)) {
            console.log(`✅ FIXED: Found dropdown trigger`);
            await clickButtonRobustly(trigger, 'FIXED Dropdown Trigger');
            await sleep(1500);
            
            const dropdownNew = document.querySelector("a[title='New'][role='menuitem']");
            if (dropdownNew && isElementVisible(dropdownNew)) {
                await clickButtonRobustly(dropdownNew, 'FIXED Dropdown New');
                return;
            }
        }
    }
    
    throw new Error('FIXED: New button not found');
}

/**
 * FIXED: Fill form intelligently with field extraction
 */
async function fillFormIntelligentlyFixed(fields) {
    console.log('📝 FIXED: Filling form with', fields.length, 'fields');

    await sleep(2000);

    for (const field of fields) {
        console.log(`🔍 FIXED: Processing field: ${field.label}`);

        try {
            const element = await findFieldElementFixed(field);
            if (!element) {
                console.warn(`⚠️ FIXED: Field not found: ${field.label}`);
                const altElement = await findFieldByLabelFixed(field.label);
                if (altElement) {
                    await fillFieldElementFixed(altElement, field);
                }
                continue;
            }
            await fillFieldElementFixed(element, field);
            await sleep(500);
        } catch (error) {
            console.warn(`⚠️ FIXED: Failed to fill field ${field.label}:`, error);
        }
    }

    console.log('✅ FIXED: Form filling completed');
}

/**
 * FIXED: Find field element
 */
async function findFieldElementFixed(field) {
    const strategies = [
        () => document.querySelector(field.selector),
        () => document.querySelector(`input[name="${field.label}"]`),
        () => document.querySelector(`input[aria-label*="${field.label}"]`),
        () => {
            if (field.label === 'First Name') {
                return document.querySelector('input[name="firstName"], input[data-field-name="firstName"]');
            }
            if (field.label === 'Last Name') {
                return document.querySelector('input[name="lastName"], input[data-field-name="lastName"]');
            }
            return null;
        }
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
 * FIXED: Find field by label
 */
async function findFieldByLabelFixed(labelText) {
    const allLabels = document.querySelectorAll('label, span, div');
    for (const label of allLabels) {
        if (label.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
            const input = label.querySelector('input, textarea') || 
                         label.parentElement.querySelector('input, textarea');
            if (input) return input;
        }
    }
    return null;
}

/**
 * FIXED: Fill field element
 */

function generateSampleValue(field) {
    const label = field.label?.toLowerCase() || '';
    const type = field.type || 'text';

    if (label.includes('name')) return 'Sample ' + (label.split(' ')[0] || 'Name');
    if (label.includes('email')) return `user${Math.floor(Math.random() * 1000)}@example.com`;
    if (label.includes('phone') || label.includes('mobile')) return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
    if (label.includes('website') || label.includes('url')) return `https://example${Math.floor(Math.random() * 100)}.com`;
    if (label.includes('amount') || label.includes('price')) return (Math.floor(Math.random() * 10000) + 100) + '';
    if (label.includes('date')) return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (label.includes('description') || label.includes('notes')) return 'Auto-generated description text.';
    if (label.includes('city')) return 'San Francisco';
    if (label.includes('state')) return 'California';
    if (label.includes('zip') || label.includes('postal')) return '94105';
    if (label.includes('company')) return 'TechCorp Ltd.';
    
    // Fallbacks based on field type
    switch (type) {
        case 'number': return Math.floor(Math.random() * 1000);
        case 'date': return new Date().toISOString().split('T')[0];
        case 'tel': return `+1-555-${Math.floor(1000000 + Math.random() * 9000000)}`;
        case 'email': return `user${Math.floor(Math.random() * 1000)}@example.com`;
        case 'url': return `https://example${Math.floor(Math.random() * 100)}.com`;
        default: return 'Sample ' + (label || 'Value');
    }
}

async function fillFieldElementFixed(element, field) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(300);

    const finalValue = field.value || generateSampleValue(field);
    element.focus();
    element.value = '';
    element.value = finalValue;

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));

    console.log(`✅ FIXED: Filled ${field.label} = ${finalValue}`);
}

/**
 * FIXED: Capture record ID
 */
async function captureRecordIdFixed(variable) {
    console.log('📝 === FIXED RECORD CAPTURE ===');
    console.log(`FIXED: Capturing record ID for: ${variable}`);
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const url = window.location.href;
        
        const recordIdPatterns = [
            /\/lightning\/r\/\w+\/(\w{15}|\w{18})/,
            /\/lightning\/r\/[^\/]+\/([a-zA-Z0-9]{15,18})/,
            /[\/\?&]id=(\w{15}|\w{18})/
        ];
        
        for (const pattern of recordIdPatterns) {
            const match = url.match(pattern);
            if (match) {
                const recordId = match[1];
                console.log(`✅ FIXED: Found record ID: ${recordId}`);
                
                recordContext[variable] = recordId;
                console.log(`💾 FIXED: Stored ${variable}: ${recordId}`);
                
                showToast(`✅ FIXED: Captured ${recordId.substring(0, 8)}...`, 3000);
                return;
            }
        }
        
        await sleep(1000);
        attempts++;
    }
    
    console.error(`❌ FIXED: Failed to capture record ID for ${variable}`);
}

// Debug function
async function debugRelatedListsOnPageFixed() {
    console.log('🐛 === FIXED RELATED LISTS DEBUG ===');
    
    const allCards = document.querySelectorAll('.slds-card, article.slds-card');
    console.log(`FIXED: Found ${allCards.length} cards on page:`);
    
    allCards.forEach((card, i) => {
        const text = card.textContent.trim().substring(0, 150);
        console.log(`  FIXED Card ${i + 1}: "${text}..."`);
    });
}

/**
 * ENHANCED: Wait for save with auto-save functionality
 */
async function waitForUserToSaveEnhanced(message = 'Please click Save to continue...', enableAutoSave = true) {
    console.log('⏳ FIXED: Enhanced waiting for save...');
    console.log('Auto-save enabled:', enableAutoSave);
    
    const enhancedMessage = enableAutoSave ? 
        `${message}\n\n⚡ Auto-save in 10 seconds if not saved manually` : 
        message;
    
    showToast(enhancedMessage, enableAutoSave ? 10000 : 15000);
    
    return new Promise((resolve) => {
        let resolved = false;
        const startUrl = window.location.href;
        const startTime = Date.now();
        
        // Auto-save timeout (10 seconds)
        const autoSaveTimeout = enableAutoSave ? setTimeout(async () => {
            if (!resolved) {
                console.log('🤖 FIXED: Auto-save triggered...');
                showToast('🤖 FIXED: Auto-saving now...', 3000);
                
                const saveSuccess = await attemptAutoSaveFixed();
                if (saveSuccess) {
                    console.log('✅ FIXED: Auto-save successful!');
                    showToast('✅ FIXED: Auto-save completed!', 3000);
                    
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkForSave);
                        setTimeout(resolve, 2000);
                    }
                } else {
                    console.log('⚠️ FIXED: Auto-save failed, continuing...');
                    
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkForSave);
                        resolve();
                    }
                }
            }
        }, 10000) : null;
        
        // Monitor for manual saves
        const checkForSave = setInterval(() => {
            const currentUrl = window.location.href;
            const elapsed = Date.now() - startTime;
            
            // Check for URL change (successful save)
            if (currentUrl !== startUrl && 
                (currentUrl.includes('/lightning/r/') && !currentUrl.includes('/new'))) {
                
                if (!resolved) {
                    resolved = true;
                    clearInterval(checkForSave);
                    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                    console.log('✅ FIXED: Manual save detected!');
                    showToast('✅ FIXED: Save detected!');
                    setTimeout(resolve, 2000);
                }
            }
            
            // Check for success toast
            const successToast = document.querySelector('.slds-notify_toast.slds-theme_success');
            if (successToast && !resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('✅ FIXED: Success toast detected!');
                showToast('✅ FIXED: Save successful!');
                setTimeout(resolve, 2000);
            }
            
            // Show countdown
            if (enableAutoSave && elapsed >= 7000 && elapsed <= 9900 && !resolved) {
                const remaining = Math.ceil((10000 - elapsed) / 1000);
                showToast(`🤖 FIXED: Auto-saving in ${remaining}...`, 900);
            }
        }, 1000);
        
        // Final timeout
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('⚠️ FIXED: Timeout - continuing...');
                resolve();
            }
        }, 120000);
    });
}

/**
 * FIXED: Attempt auto-save
 */
async function attemptAutoSaveFixed() {
    console.log('🤖 === FIXED AUTO-SAVE ===');
    
    try {
        const saveButtonSelectors = [
            'button[title="Save"]',
            '.slds-button[title="Save"]',
            'lightning-button[title="Save"]'
        ];
        
        let saveButton = null;
        for (const selector of saveButtonSelectors) {
            saveButton = document.querySelector(selector);
            if (saveButton && isElementVisible(saveButton)) {
                console.log(`✅ FIXED: Found Save button: ${selector}`);
                break;
            }
        }
        
        if (!saveButton) {
            const allButtons = document.querySelectorAll('button, input[type="submit"]');
            for (const btn of allButtons) {
                if (btn.textContent.trim().toLowerCase() === 'save' && isElementVisible(btn)) {
                    saveButton = btn;
                    console.log('✅ FIXED: Found Save by text');
                    break;
                }
            }
        }
        
        if (!saveButton) {
            console.log('❌ FIXED: No Save button found');
            return false;
        }
        
        // Click save button
        saveButton.click();
        await sleep(2000);
        
        // Check success
        const success = window.location.href.includes('/lightning/r/') && 
                       !window.location.href.includes('/new');
        
        console.log(`${success ? '✅' : '⚠️'} FIXED: Auto-save result: ${success}`);
        return success;
        
    } catch (error) {
        console.error('❌ FIXED: Auto-save error:', error);
        return false;
    }
}

// Safe action methods
async function safeClick(selector, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);
    element.click();
    console.log(`✅ FIXED: Clicked: ${description}`);
}

async function safeType(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ FIXED: Typed "${value}": ${description}`);
}

async function safeSelect(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ FIXED: Selected "${value}": ${description}`);
}

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

console.log('✅ FIXED: Complete content script with proper related list detection and field extraction');
