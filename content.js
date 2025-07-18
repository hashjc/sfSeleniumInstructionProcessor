/**
 * Enhanced record name capture with form value priority (UPDATED)
 */
async function captureRecordId(recordVariable) {
    console.log(`📝 Capturing record ID and name for variable: ${recordVariable}`);
    
    // FIRST: Try to capture name from form before navigation
    const formName = await captureRecordNameFromForm();
    console.log(`📋 Name from form before navigation: ${formName}`);
    
    // Wait for redirect to record detail page
    await waitForRecordDetailPage();
    
    // Extract record ID from URL
    const url = window.location.href;
    const recordIdMatch = url.match(/\/lightning\/r\/\w+\/(\w{15}|\w{18})/);
    
    if (recordIdMatch) {
        const recordId = recordIdMatch[1];
        
        // Store the record ID
        recordContext[recordVariable] = recordId;
        
        // Enhanced name capture with form priority
        try {
            let recordName = null;
            
            // Method 1: Use form name if we captured it (HIGHEST PRIORITY)
            if (formName && formName !== 'Recently Viewed' && formName !== 'Contacts') {
                recordName = formName;
                console.log(`✅ Using form name (highest priority): ${recordName}`);
            }
            
            // Method 2: Try to get from current page form fields (for fresh records)
            if (!recordName) {
                const nameInput = document.querySelector('input[name="Name"], input[id*="Name"]');
                if (nameInput && nameInput.value && nameInput.value.trim()) {
                    recordName = nameInput.value.trim();
                    console.log(`✅ Got name from current form input: ${recordName}`);
                }
            }
            
            // Method 3: Try API call if form methods didn't work
            if (!recordName || recordName === 'Recently Viewed') {
                try {
                    const apiName = await getRecordNameFromAPI(recordId);
                    if (apiName && apiName !== 'Recently Viewed' && apiName !== 'Contacts') {
                        recordName = apiName;
                        console.log(`✅ Got name from API: ${recordName}`);
                    }
                } catch (apiError) {
                    console.log('⚠️ API call failed, trying other methods');
                }
            }
            
            // Method 4: Try page context (with better filtering)
            if (!recordName || recordName === 'Recently Viewed') {
                const pageName = await getRecordNameFromCurrentPage(recordId);
                if (pageName && pageName !== 'Recently Viewed') {
                    recordName = pageName;
                    console.log(`✅ Got name from page context: ${recordName}`);
                }
            }
            
            // Method 5: Try constructed name
            if (!recordName || recordName === 'Recently Viewed') {
                const constructedName = await constructRecordName(recordId);
                if (constructedName) {
                    recordName = constructedName;
                    console.log(`✅ Got constructed name: ${recordName}`);
                }
            }
            
            // Method 6: Final fallback - use object type + ID
            if (!recordName || recordName === 'Recently Viewed') {
                const objectType = getObjectTypeFromId(recordId);
                recordName = `${objectType} ${recordId.substring(0, 8)}`;
                console.log(`⚠️ Using fallback name: ${recordName}`);
            }
            
            // Store the name
            if (recordName) {
                const nameVariable = recordVariable.replace('Id', 'Name');
                recordContext[nameVariable] = recordName;
                
                console.log(`✅ Captured ${recordVariable}: ${recordId}`);
                console.log(`✅ Captured ${nameVariable}: ${recordName}`);
                
                showToast(`Captured: ${recordName}`, 3000);
            } else {
                console.log(`✅ Captured ${recordVariable}: ${recordId}`);
                showToast(`Captured record: ${recordId.substring(0, 8)}...`, 2000);
            }
            
        } catch (error) {
            console.error('Error capturing record name:', error);
            console.log(`✅ Captured ${recordVariable}: ${recordId}`);
            showToast(`Captured record ID: ${recordId}`, 2000);
        }
        
    } else {
        throw new Error(`Could not capture record ID for ${recordVariable}`);
    }
}// content.js - Enhanced Content script with record relationship handling
console.log('Salesforce automation content script loaded');

// Store record IDs for relationship building
const recordContext = {};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeAutomation') {
        executeAutomationSteps(request.actionPlan).catch(console.error);
        return true;
    }
});

/**
 * Execute automation steps directly on the current page
 */
async function executeAutomationSteps(plan) {
    console.log(`🚀 Starting automation with ${plan.length} steps`);
    
    for (let i = 0; i < plan.length; i++) {
        const { action, details } = plan[i];
        console.log(`▶️ Step ${i+1}/${plan.length}:`, action, details);

        try {
            // 1) Perform the DOM action
            await executeStep(action, details);

            // 2) If we've just opened a New form, autofill it
            if ((action === 'app_launcher' || action === 'navigate' || action === 'clickNewInRelatedList') && isOnRecordCreationForm()) {
                await sleep(1500);
                await autoFillRecordForm();
                showToast('Autofill done, please review…', 2000);
            }

            // 3) If this step requires a manual save, run autofill again then pause
            if (action === 'waitForUserSave') {
                await autoFillRecordForm();
                showToast(details.message, 3000);
                
                // Wait for user to save and get confirmation
                const saveResult = await waitForUserToSave();
                console.log(`✅ Save completed for step ${i+1}:`, saveResult);
                showToast(`Step ${i+1} saved successfully!`, 2000);
                
                // Wait a bit more to ensure the save is fully processed
                await sleep(2000);
            } else {
                // 4) Otherwise just toast success
                showToast(`Step ${i+1} complete`, 1200);
            }

            // Short buffer between steps
            await sleep(800);
            
        } catch (error) {
            console.error(`❌ Error in step ${i+1}:`, error);
            showToast(`Error in step ${i+1}: ${error.message}`, 3000);
            
            // For non-critical errors, continue to next step
            if (!error.message.includes('not found') && !error.message.includes('timeout')) {
                continue;
            }
            
            // For critical errors, stop execution
            throw new Error(`Critical error in step ${i+1}: ${error.message}`);
        }
    }

    console.log('🎉 All automation steps completed successfully!');
    showToast('✅ All steps complete!', 3000);
    return { success: true, message: 'All steps completed successfully' };
}

/**
 * Execute a single automation step
 */
async function executeStep(action, d) {
    console.log(`🔄 Executing action: ${action}`, d);
    
    switch (action) {
        case 'navigate':
            window.location.href = d.url;
            await waitForPageLoad();
            break;
        case 'click':
            await clickElement(d.selector);
            break;
        case 'type':
            await typeInElement(d.selector, d.text);
            break;
        case 'selectByValue':
            await selectByValue(d.selector, d.value);
            break;
        case 'waitFor':
            await waitForElement(d.selector, d.timeout || 10000);
            break;
        case 'waitForVisible':
            await waitForElementVisible(d.selector, d.timeout || 10000);
            break;
        case 'app_launcher':
            await handleAppLauncher(d.objectName);
            break;
        case 'sleep':
            await sleep(d.ms || 1000);
            break;
        case 'waitForUserSave':
            console.log('⏳ Preparing for user save action');
            break;
        case 'captureRecordId':
            await captureRecordId(d.recordVariable);
            break;
        case 'navigateToRelatedList':
            await navigateToRelatedList(d.relatedListName, d.parentRecordVariable);
            break;
        case 'clickNewInRelatedList':
            await clickNewInRelatedList(d.relatedListName);
            break;
        default:
            console.warn('⚠️ Unknown action:', action);
    }
}

/**
 * Capture record ID and name after creation (enhanced)
 */
async function captureRecordId(recordVariable) {
    console.log(`📝 Capturing record ID and name for variable: ${recordVariable}`);
    
    // Wait for redirect to record detail page
    await waitForRecordDetailPage();
    
    // Extract record ID from URL
    const url = window.location.href;
    const recordIdMatch = url.match(/\/lightning\/r\/\w+\/(\w{15}|\w{18})/);
    
    if (recordIdMatch) {
        const recordId = recordIdMatch[1];
        
        // Store the record ID
        recordContext[recordVariable] = recordId;
        
        // Also try to capture and store the record name using multiple methods
        try {
            // Method 1: Try API first for most accurate name
            let recordName = await getRecordNameFromAPI(recordId);
            
            // Method 2: If API fails, try page context (with filtering)
            if (!recordName || recordName === 'Contacts' || recordName === 'Contact') {
                recordName = await getRecordNameFromContext(recordId);
            }
            
            // Method 3: If still no good name, try page elements
            if (!recordName || recordName === 'Contacts' || recordName === 'Contact') {
                recordName = await getRecordNameFromPage(recordId);
            }
            
            // Method 4: Final fallback - use a generic name based on object type
            if (!recordName || recordName === 'Contacts' || recordName === 'Contact') {
                const objectType = getObjectTypeFromId(recordId);
                recordName = `${objectType} (${recordId.substring(0, 8)})`;
            }
            
            // Store the name
            if (recordName) {
                const nameVariable = recordVariable.replace('Id', 'Name');
                recordContext[nameVariable] = recordName;
                
                console.log(`✅ Captured ${recordVariable}: ${recordId}`);
                console.log(`✅ Captured ${nameVariable}: ${recordName}`);
                
                showToast(`Captured: ${recordName}`, 3000);
            } else {
                console.log(`✅ Captured ${recordVariable}: ${recordId}`);
                showToast(`Captured record: ${recordId.substring(0, 8)}...`, 2000);
            }
            
        } catch (error) {
            console.error('Error capturing record name:', error);
            console.log(`✅ Captured ${recordVariable}: ${recordId}`);
            showToast(`Captured record ID: ${recordId}`, 2000);
        }
        
    } else {
        throw new Error(`Could not capture record ID for ${recordVariable}`);
    }
}

/**
 * Navigate to related list (enhanced to use quick links)
 */
async function navigateToRelatedList(relatedListName, parentRecordVariable) {
    console.log(`🔗 Navigating to ${relatedListName} related list using quick links`);
    
    const parentRecordId = recordContext[parentRecordVariable];
    if (!parentRecordId) {
        throw new Error(`Parent record ID not found for variable: ${parentRecordVariable}`);
    }
    
    // First try to use Related List Quick Links (more reliable)
    const quickLinkSuccess = await tryQuickLinkNavigation(relatedListName);
    if (quickLinkSuccess) {
        console.log(`✅ Successfully used quick link for ${relatedListName}`);
        return;
    }
    
    // Fallback to traditional tab navigation
    console.log(`⚠️ Quick link failed, trying traditional tab navigation`);
    await tryTabNavigation(relatedListName);
}

/**
 * Try to use Related List Quick Links
 */
async function tryQuickLinkNavigation(relatedListName) {
    console.log(`🔗 Trying quick link navigation for ${relatedListName}`);
    
    try {
        // Look for Related List Quick Links section
        const quickLinksSection = document.querySelector('.relatedListQuickLinks, [data-aura-class*="relatedListQuickLinks"]');
        if (!quickLinksSection) {
            console.log('❌ Quick links section not found');
            return false;
        }
        
        // Map related list names to quick link patterns
        const quickLinkMappings = {
            'Contacts': ['contacts', 'contact'],
            'Opportunities': ['opportunities', 'opportunity'],
            'Cases': ['cases', 'case'],
            'Tasks': ['tasks', 'task'],
            'Events': ['events', 'event'],
            'Notes': ['notes', 'note'],
            'Attachments': ['attachments', 'attachment']
        };
        
        const searchTerms = quickLinkMappings[relatedListName] || [relatedListName.toLowerCase()];
        
        // Look for the quick link
        const quickLinks = quickLinksSection.querySelectorAll('a');
        for (const link of quickLinks) {
            const linkText = link.textContent.toLowerCase().trim();
            const linkHref = link.getAttribute('href') || '';
            
            // Check if link matches our search terms
            for (const term of searchTerms) {
                if (linkText.includes(term) || linkHref.includes(term)) {
                    console.log(`✅ Found quick link: ${linkText}`);
                    link.click();
                    await sleep(3000);
                    return true;
                }
            }
        }
        
        console.log('❌ No matching quick link found');
        return false;
        
    } catch (error) {
        console.error('Error in quick link navigation:', error);
        return false;
    }
}

/**
 * Try traditional tab navigation (fallback)
 */
async function tryTabNavigation(relatedListName) {
    console.log(`🔗 Trying traditional tab navigation for ${relatedListName}`);
    
    // Find and click the related list tab
    const relatedListSelectors = [
        `a[title="${relatedListName}"]`,
        `a[data-label="${relatedListName}"]`,
        `lightning-tab[title="${relatedListName}"] a`,
        `div[title="${relatedListName}"]`,
        `span[title="${relatedListName}"]`
    ];
    
    // First try to find the related list in the current page
    let relatedListElement = await findElementFromSelectors(relatedListSelectors, 3000);
    
    if (!relatedListElement) {
        // If not found, try scrolling to find more tabs
        await scrollToFindRelatedList(relatedListName);
        relatedListElement = await findElementFromSelectors(relatedListSelectors, 3000);
    }
    
    if (!relatedListElement) {
        // If still not found, look for "Show more" or similar button
        const showMoreSelectors = [
            'button[title="Show more tabs"]',
            'button[aria-label="Show more tabs"]',
            '.slds-tabs_default__overflow-button'
        ];
        
        const showMoreBtn = await findElementFromSelectors(showMoreSelectors, 2000);
        if (showMoreBtn) {
            showMoreBtn.click();
            await sleep(1000);
            relatedListElement = await findElementFromSelectors(relatedListSelectors, 3000);
        }
    }
    
    if (relatedListElement) {
        relatedListElement.click();
        await sleep(2000);
        console.log(`✅ Clicked on ${relatedListName} related list`);
    } else {
        throw new Error(`Could not find ${relatedListName} related list`);
    }
}

/**
 * Click New button in related list
 */
async function clickNewInRelatedList(relatedListName) {
    console.log(`➕ Clicking New button in ${relatedListName} related list`);
    
    // Wait for the related list to load
    await sleep(2000);
    
    // Look for New button in the related list
    const newButtonSelectors = [
        'button[title="New"]',
        'a[title="New"]',
        'lightning-button[title="New"]',
        '.slds-button[title="New"]',
        'button[name="New"]'
    ];
    
    const newButton = await findElementFromSelectors(newButtonSelectors, 5000);
    if (newButton) {
        newButton.click();
        await sleep(2000);
        console.log(`✅ Clicked New button in ${relatedListName} related list`);
    } else {
        throw new Error(`Could not find New button in ${relatedListName} related list`);
    }
}

/**
 * Wait for record detail page to load
 */
async function waitForRecordDetailPage() {
    const maxWait = 30000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
        const url = window.location.href;
        
        // Check if we're on a record detail page
        if (url.includes('/lightning/r/') && !url.includes('/new') && !url.includes('/edit')) {
            return true;
        }
        
        await sleep(1000);
    }
    
    throw new Error('Timeout waiting for record detail page');
}

/**
 * Scroll to find related list
 */
async function scrollToFindRelatedList(relatedListName) {
    // Try scrolling down to find the related list
    for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 300);
        await sleep(500);
        
        const relatedListSelectors = [
            `a[title="${relatedListName}"]`,
            `a[data-label="${relatedListName}"]`,
            `lightning-tab[title="${relatedListName}"] a`
        ];
        
        const element = await findElementFromSelectors(relatedListSelectors, 1000);
        if (element) {
            return element;
        }
    }
    
    return null;
}

function isOnRecordCreationForm() {
    const url = location.href;
    return url.includes('/lightning/o/') && url.includes('/new') &&
           document.querySelectorAll('[data-target-selection-name*="sfdc:RecordField."]').length;
}

/**
 * Capture account name right before save (MOST AGGRESSIVE APPROACH)
 */
async function captureNameBeforeSave() {
    console.log('🚨 CAPTURING NAME RIGHT BEFORE SAVE');
    
    // Method 1: Get current name input value (most reliable)
    const nameInputs = document.querySelectorAll('input[name="Name"], input[data-name="Name"], input[id*="Name"]');
    
    for (const input of nameInputs) {
        if (input.value && input.value.trim()) {
            const currentName = input.value.trim();
            console.log(`✅ CAPTURED NAME BEFORE SAVE: ${currentName}`);
            
            // Store it globally for immediate use
            window.capturedAccountName = currentName;
            
            // Also update the record context immediately
            if (window.location.href.includes('/lightning/o/Account/new')) {
                recordContext['accountName'] = currentName;
                console.log(`💾 Updated accountName in context: ${currentName}`);
            }
            
            return currentName;
        }
    }
    
    // Method 2: Check for any form data that might contain the name
    const formData = new FormData();
    const allInputs = document.querySelectorAll('input, textarea, select');
    
    for (const input of allInputs) {
        if (input.name && input.value) {
            formData.append(input.name, input.value);
            if (input.name.toLowerCase().includes('name') && input.value.trim()) {
                console.log(`✅ Found name in form data: ${input.name} = ${input.value}`);
                window.capturedAccountName = input.value.trim();
                return input.value.trim();
            }
        }
    }
    
    console.log('❌ Could not capture name before save');
    return null;
}

/**
 * Enhanced waitForUserToSave with name capture
 */
async function waitForUserToSave() {
    return new Promise((resolve, reject) => {
        let done = false;
        let saveDetected = false;
        
        const saveSel = [
            'button[name="SaveEdit"]',
            'button[title="Save"]',
            '.slds-button_brand',
            'lightning-button[data-element-id="saveButton"]',
            'button[data-aura-class="uiButton--brand"]'
        ];
        
        console.log('⏳ Waiting for user to click Save button...');
        showToast('Click Save to continue automation...', 5000);

        function attachSaveListeners() {
            saveSel.forEach(sel => {
                document.querySelectorAll(sel).forEach(btn => {
                    if (!btn.dataset.sfListener && btn.textContent.toLowerCase().includes('save')) {
                        btn.dataset.sfListener = 'true';
                        btn.addEventListener('click', handleSaveClick);
                    }
                });
            });
        }

        async function handleSaveClick() {
            if (done) return;
            
            console.log('💾 Save button clicked!');
            
            // IMMEDIATELY capture the name before any navigation
            const capturedName = await captureNameBeforeSave();
            console.log(`🚨 NAME CAPTURED BEFORE NAVIGATION: ${capturedName}`);
            
            saveDetected = true;
            showToast('Save detected! Waiting for completion...', 2000);
            
            // Wait for save to complete by checking for success indicators
            waitForSaveCompletion()
                .then(() => {
                    if (!done) {
                        done = true;
                        clearInterval(checker);
                        resolve({ success: true, message: 'Save completed successfully' });
                    }
                })
                .catch(error => {
                    if (!done) {
                        done = true;
                        clearInterval(checker);
                        // Even if we can't confirm save completion, continue automation
                        console.warn('Save completion check failed, but continuing:', error);
                        resolve({ success: true, message: 'Save initiated, continuing automation' });
                    }
                });
        }

        async function waitForSaveCompletion() {
            const maxWait = 30000; // 30 seconds max wait
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWait) {
                // Check for success toast/message
                const successToast = document.querySelector('.slds-notify_toast.slds-theme_success, .toastMessage.confirm');
                if (successToast) {
                    console.log('✅ Success toast found - save completed');
                    return true;
                }
                
                // Check if we're redirected to record detail page
                const url = window.location.href;
                if (url.includes('/lightning/r/') && !url.includes('/new')) {
                    console.log('✅ Redirected to record detail - save completed');
                    return true;
                }
                
                // Check for record ID in URL
                const recordIdMatch = url.match(/\/lightning\/r\/\w+\/(\w{15}|\w{18})/);
                if (recordIdMatch) {
                    console.log('✅ Record ID found in URL - save completed');
                    return true;
                }
                
                await sleep(1000);
            }
            
            throw new Error('Save completion timeout');
        }

        // Attach listeners initially and keep checking for new buttons
        attachSaveListeners();
        const checker = setInterval(() => {
            if (!done && !saveDetected) {
                attachSaveListeners();
            }
        }, 1000);

        // Fallback timeout - continue automation even if save not detected
        setTimeout(() => {
            if (!done) {
                done = true;
                clearInterval(checker);
                console.warn('⚠️ Save timeout reached - continuing automation');
                showToast('Save timeout - continuing automation...', 2000);
                resolve({ success: true, message: 'Save timeout - continuing automation' });
            }
        }, 180000); // 3 minutes timeout
    });
}

/**
 * ULTIMATE enhanced record name capture
 */
async function captureRecordId(recordVariable) {
    console.log(`📝 === ULTIMATE RECORD CAPTURE FOR ${recordVariable} ===`);
    
    // FIRST: Check if we captured the name during save
    const capturedName = window.capturedAccountName;
    console.log(`🚨 Name captured during save: ${capturedName}`);
    
    // Wait for redirect to record detail page
    await waitForRecordDetailPage();
    
    // Extract record ID from URL
    const url = window.location.href;
    const recordIdMatch = url.match(/\/lightning\/r\/\w+\/(\w{15}|\w{18})/);
    
    if (recordIdMatch) {
        const recordId = recordIdMatch[1];
        
        // Store the record ID
        recordContext[recordVariable] = recordId;
        
        // ENHANCED name capture with ULTIMATE priority
        try {
            let recordName = null;
            
            // ULTIMATE Method 1: Use name captured during save (HIGHEST PRIORITY)
            if (capturedName && capturedName !== 'Recently Viewed' && capturedName !== 'Contacts') {
                recordName = capturedName;
                console.log(`✅ USING CAPTURED NAME FROM SAVE: ${recordName}`);
            }
            
            // ULTIMATE Method 2: Try to get name from record detail page elements
            if (!recordName || recordName === 'Recently Viewed') {
                await sleep(2000); // Wait for page to fully load
                
                // Look for the record name in the page header after navigation
                const headerSelectors = [
                    'h1.slds-page-header__title',
                    '.slds-page-header__title',
                    'h1[data-aura-class="uiOutputText"]',
                    'lightning-formatted-text'
                ];
                
                for (const selector of headerSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const text = element.textContent.trim();
                        
                        // Only accept if it's not a navigation element
                        if (text && 
                            text !== 'Recently Viewed' && 
                            text !== 'Contacts' && 
                            text !== 'Account' && 
                            text !== 'New' && 
                            text !== 'Edit' &&
                            text.length > 2) {
                            
                            recordName = text;
                            console.log(`✅ Got name from record detail header: ${recordName}`);
                            break;
                        }
                    }
                }
            }
            
            // ULTIMATE Method 3: Try API call as last resort
            if (!recordName || recordName === 'Recently Viewed') {
                try {
                    const apiName = await getRecordNameFromAPI(recordId);
                    if (apiName && apiName !== 'Recently Viewed' && apiName !== 'Contacts') {
                        recordName = apiName;
                        console.log(`✅ Got name from API: ${recordName}`);
                    }
                } catch (apiError) {
                    console.log('⚠️ API call failed');
                }
            }
            
            // ULTIMATE Method 4: Final fallback
            if (!recordName || recordName === 'Recently Viewed') {
                const objectType = getObjectTypeFromId(recordId);
                recordName = `${objectType} ${recordId.substring(0, 8)}`;
                console.log(`⚠️ Using fallback name: ${recordName}`);
            }
            
            // Store the final name
            if (recordName) {
                const nameVariable = recordVariable.replace('Id', 'Name');
                recordContext[nameVariable] = recordName;
                
                console.log(`✅ FINAL CAPTURED ${recordVariable}: ${recordId}`);
                console.log(`✅ FINAL CAPTURED ${nameVariable}: ${recordName}`);
                
                showToast(`Captured: ${recordName}`, 3000);
                
                // Clear the captured name to avoid reuse
                window.capturedAccountName = null;
            }
            
        } catch (error) {
            console.error('Error in ultimate record capture:', error);
            showToast(`Captured record: ${recordId}`, 2000);
        }
        
    } else {
        throw new Error(`Could not capture record ID for ${recordVariable}`);
    }
}

/**
 * Toast utility
 */
function showToast(msg, ms=2000) {
    let t = document.getElementById('sf-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'sf-toast';
        Object.assign(t.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            padding: '8px 12px', background: 'rgba(0,0,0,0.75)',
            color: '#fff', borderRadius: '4px',
            fontFamily: 'sans-serif', fontSize: '13px', zIndex: 99999,
            transition: 'opacity 0.3s'
        });
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(() => t.style.opacity = '0', ms);
}

/**
 * Click an element using CSS selector or XPath
 */
async function clickElement(selector) {
    const element = await findElement(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);

    try {
        element.click();
    } catch (e) {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    console.log(`Clicked element: ${selector}`);
}

async function typeInElement(selector, text) {
    const element = await findElement(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }

    element.focus();
    await sleep(200);
    element.value = '';
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`Typed "${text}" into element: ${selector}`);
}

async function selectByValue(selector, value) {
    const select = await findElement(selector);
    if (!select) {
        throw new Error(`Select element not found: ${selector}`);
    }

    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`Selected value "${value}" in: ${selector}`);
}

/**
 * Handle App Launcher navigation
 */
async function handleAppLauncher(objectName = 'Accounts') {
    try {
        console.log(`Opening App Launcher for: ${objectName}`);

        const appLauncherSelectors = [
            "button[title='App Launcher']",
            ".slds-icon-waffle_container button",
            "button[aria-label='App Launcher']",
            ".appLauncher button"
        ];

        const appLauncherBtn = await findElementFromSelectors(appLauncherSelectors);
        if (!appLauncherBtn) {
            throw new Error('App Launcher button not found');
        }

        appLauncherBtn.click();
        console.log('App Launcher clicked');
        await sleep(2000);

        const searchSelectors = [
            "input[placeholder*='Search apps']",
            "input[type='search']",
            "lightning-input input",
            ".al-search input"
        ];

        const searchInput = await findElementFromSelectors(searchSelectors);
        if (!searchInput) {
            throw new Error('Search input not found');
        }

        searchInput.value = '';
        searchInput.value = objectName;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        console.log(`Searched for: ${objectName}`);
        await sleep(3000);

        const objectLinkSelectors = [
            `a[data-label='${objectName}']`,
            `a[title='${objectName}']`,
            `one-app-launcher-menu-item a[data-label='${objectName}']`
        ];

        const objectLink = await findElementFromSelectors(objectLinkSelectors);
        if (!objectLink) {
            const allLinks = document.querySelectorAll('one-app-launcher-menu-item a, .al-menu-dropdown-list a');
            for (const link of allLinks) {
                if (link.textContent.trim() === objectName) {
                    link.click();
                    console.log(`Clicked on ${objectName} link`);
                    await sleep(5000);
                    await handleNewButton();
                    return;
                }
            }
            throw new Error(`${objectName} link not found`);
        }

        objectLink.click();
        console.log(`Clicked on ${objectName}`);
        await sleep(5000);
        await handleNewButton();

    } catch (error) {
        console.error('Error in app launcher:', error);
        throw error;
    }
}

async function handleNewButton() {
    try {
        const newButtonSelectors = [
            "a[title='New']",
            "button[title='New']",
            ".slds-button[title='New']",
            "lightning-button-menu button[title='New']"
        ];

        let newBtn = await findElementFromSelectors(newButtonSelectors, 3000);

        if (newBtn) {
            newBtn.click();
            console.log('Clicked direct New button');
            return;
        }

        const dropdownSelectors = [
            "lightning-button-menu button",
            "button[aria-haspopup='true']",
            ".slds-button_neutral",
            ".slds-button_icon-border-filled"
        ];

        const dropdownBtn = await findElementFromSelectors(dropdownSelectors);
        if (dropdownBtn) {
            dropdownBtn.click();
            await sleep(1000);

            const dropdownNewSelectors = [
                "a[title='New'][role='menuitem']",
                "lightning-menu-item a[title='New']",
                "div[role='menu'] a:contains('New')"
            ];

            const dropdownNewBtn = await findElementFromSelectors(dropdownNewSelectors);
            if (dropdownNewBtn) {
                dropdownNewBtn.click();
                console.log('Clicked New from dropdown');
                return;
            }
        }

        throw new Error('New button not found');

    } catch (error) {
        console.error('Error clicking New button:', error);
        throw error;
    }
}

async function findElement(selector, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        let element;

        if (selector.startsWith('//') || selector.startsWith('(')) {
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            element = result.singleNodeValue;
        } else {
            element = document.querySelector(selector);
        }

        if (element) {
            return element;
        }

        await sleep(500);
    }

    return null;
}

async function findElementFromSelectors(selectors, timeout = 10000) {
    for (const selector of selectors) {
        const element = await findElement(selector, timeout / selectors.length);
        if (element) {
            return element;
        }
    }
    return null;
}

async function waitForElement(selector, timeout = 10000) {
    const element = await findElement(selector, timeout);
    if (!element) {
        throw new Error(`Element not found within timeout: ${selector}`);
    }
    return element;
}

async function waitForElementVisible(selector, timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = await findElement(selector, 1000);
        if (element && element.offsetParent !== null) {
            return element;
        }
        await sleep(500);
    }

    throw new Error(`Element not visible within timeout: ${selector}`);
}

async function waitForPageLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced name capture that monitors real-time form changes
 */
async function captureRecordNameFromForm() {
    console.log('📝 Capturing record name from current form with real-time monitoring');
    
    // Method 1: Get current values from name fields (captures user changes)
    const nameInputSelectors = [
        'input[name="Name"]',
        'input[id*="Name"]',
        '[data-target-selection-name*=".Name"] input',
        '[data-target-selection-name*="Account.Name"] input',
        '[data-target-selection-name*="Contact.Name"] input'
    ];
    
    for (const selector of nameInputSelectors) {
        const nameInput = document.querySelector(selector);
        if (nameInput && nameInput.value && nameInput.value.trim()) {
            const currentValue = nameInput.value.trim();
            console.log(`✅ Found current name from input (${selector}): ${currentValue}`);
            return currentValue;
        }
    }
    
    // Method 2: Check stored form values (fallback)
    const formValues = window.currentFormValues || {};
    console.log('📋 Available stored form values:', formValues);
    
    const nameFields = ['Account.Name', 'Contact.Name', 'Opportunity.Name', 'Case.Subject'];
    
    for (const fieldName of nameFields) {
        if (formValues[fieldName]) {
            console.log(`✅ Found name from stored form: ${fieldName} = ${formValues[fieldName]}`);
            return formValues[fieldName];
        }
    }
    
    // Method 3: Try compound name fields (for Contact names)
    const firstNameInput = document.querySelector('input[name="firstName"]');
    const lastNameInput = document.querySelector('input[name="lastName"]');
    
    if (firstNameInput && lastNameInput) {
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        if (firstName || lastName) {
            const fullName = `${firstName} ${lastName}`.trim();
            console.log(`✅ Found compound name: ${fullName}`);
            return fullName;
        }
    }
    
    console.log('❌ No name found in form');
    return null;
}

/**
 * Monitor form changes in real-time
 */
function setupFormChangeMonitoring() {
    console.log('🔄 Setting up real-time form change monitoring');
    
    // Monitor all name-related inputs for changes
    const nameInputSelectors = [
        'input[name="Name"]',
        'input[id*="Name"]',
        '[data-target-selection-name*=".Name"] input',
        'input[name="firstName"]',
        'input[name="lastName"]'
    ];
    
    nameInputSelectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector);
        inputs.forEach(input => {
            if (!input.dataset.monitored) {
                input.dataset.monitored = 'true';
                
                // Monitor input changes
                input.addEventListener('input', (e) => {
                    const value = e.target.value.trim();
                    console.log(`📝 Real-time name change detected: ${selector} = ${value}`);
                    
                    // Update the global form values
                    if (!window.currentFormValues) {
                        window.currentFormValues = {};
                    }
                    
                    // Determine field name based on selector
                    let fieldName = 'Name';
                    if (selector.includes('firstName')) {
                        fieldName = 'firstName';
                    } else if (selector.includes('lastName')) {
                        fieldName = 'lastName';
                    } else if (selector.includes('Account.Name')) {
                        fieldName = 'Account.Name';
                    } else if (selector.includes('Contact.Name')) {
                        fieldName = 'Contact.Name';
                    }
                    
                    window.currentFormValues[fieldName] = value;
                    console.log(`💾 Updated form value: ${fieldName} = ${value}`);
                });
                
                // Also monitor blur events (when user finishes editing)
                input.addEventListener('blur', (e) => {
                    const value = e.target.value.trim();
                    if (value) {
                        console.log(`✅ Final name value captured: ${value}`);
                        window.finalNameValue = value;
                    }
                });
            }
        });
    });
}

/**
 * Enhanced autofill function with real-time monitoring
 */
async function autoFillRecordForm() {
    console.log('🚀 === STARTING AUTOFILL WITH REAL-TIME MONITORING ===');
    console.log('🗂️ Current record context:', JSON.stringify(recordContext, null, 2));
    console.log('🌐 Current URL:', window.location.href);
    
    // Set up real-time form monitoring
    setupFormChangeMonitoring();
    
    // Check if we're in a Contact creation form
    const isContactForm = window.location.href.includes('/lightning/o/Contact/new') || 
                         document.querySelector('[data-target-selection-name*="Contact"]');
    console.log('👤 Is Contact form?', isContactForm);
    
    if (isContactForm) {
        console.log('🔍 CONTACT FORM DETECTED - Checking for Account lookup fields');
        
        // Find Account lookup fields specifically
        const accountLookupSelectors = [
            'input[placeholder*="Account"]',
            'input[aria-label*="Account"]',
            '[data-target-selection-name*="Account"] input',
            '[data-target-selection-name*="AccountId"] input',
            'lightning-lookup-desktop input[role="combobox"]'
        ];
        
        for (const selector of accountLookupSelectors) {
            const accountField = document.querySelector(selector);
            if (accountField) {
                console.log('✅ Found Account lookup field:', selector);
                console.log('📝 Field element:', accountField);
                
                // Get the Account ID and name from context
                const accountId = recordContext['accountId'];
                const accountName = recordContext['accountName'];
                
                console.log('🔗 Account ID from context:', accountId);
                console.log('🏷️ Account name from context:', accountName);
                
                if (accountId) {
                    console.log('⚡ ATTEMPTING TO POPULATE ACCOUNT FIELD');
                    await populateAccountFieldDirectly(accountField, accountId, accountName);
                } else {
                    console.log('❌ No Account ID found in context');
                }
                
                break;
            }
        }
    }
    
    // Store the current form values before AI generation (for name capture)
    const currentFormValues = {};
    
    // Continue with regular autofill
    let inputs = document.querySelectorAll('input.slds-input, input, .textarea, .slds-textarea');
    let fieldNames = [];
    let picklistFields = [];
    let picklistFieldWithValues = {};
    
    console.log(`📊 Found ${inputs.length} total input fields`);
    
    inputs.forEach((input, index) => {
        let parent = input.closest('[data-target-selection-name]');
        let apiField = parent ? parent.getAttribute('data-target-selection-name') : null;
        let name = input.name || input.id;

        if (apiField) {
            let apiName = apiField.replace(/^sfdc:RecordField\./, '');
            let type = getSalesforceFieldType(apiName);
            
            console.log(`📋 Field ${index}: ${apiName} (type: ${type})`);
            
            // Capture current value, especially for Name fields
            if (apiName.includes('Name') && input.value) {
                currentFormValues[apiName] = input.value;
                console.log(`💾 Captured current value for ${apiName}: ${input.value}`);
            }

            if (type === "lookup") {
                console.log(`🔍 Lookup field detected: ${apiName}`);
                
                // Check if it's already populated
                if (!isLookupPopulated(input)) {
                    console.log(`📝 Lookup field ${apiName} not populated, attempting to populate...`);
                    
                    // Special handling for Account fields
                    if (apiName.toLowerCase().includes('account') && recordContext['accountId']) {
                        console.log('🎯 This is an Account lookup field, using direct population');
                        populateAccountFieldDirectly(input, recordContext['accountId'], recordContext['accountName']);
                    } else {
                        handleLookupField(apiName, input);
                    }
                } else {
                    console.log(`✅ Lookup field ${apiName} already populated`);
                }
                return; 
            }

            const item = fieldNames.find((field) => field.apiName === apiName);
            if (item) {
                item.containsMultipleFields = true;
                fieldNames.push({ 'name': name, 'id': input?.id ?? null, 'apiName': apiName, element: input, "type": type, "containsMultipleFields": true });
            } else {
                fieldNames.push({ 'name': name, 'id': input?.id ?? null, 'apiName': apiName, element: input, "type": type, "containsMultipleFields": false });
            }
        }
    });
    
    console.log("📋 Final field names:", fieldNames);
    console.log("💾 Current form values:", currentFormValues);
    
    // Store the form values in global context for later use
    window.currentFormValues = currentFormValues;
    
    // Rest of the autofill logic...
    try {
        chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching data from Gemini, please wait..." });
        let data = captureFieldValuesFromUi();
        
        picklistFields = await getAllPicklistOptions();
        
        for (key in picklistFields) {
            let currentVal = getPicklistValue(key);
            const item = fieldNames.find((field) => field.apiName === key);
            if (!item) {
                fieldNames.push({ 'name': key, 'apiName': key, 'options': picklistFields[key]?.options ?? [], 'type': 'picklist' });
                picklistFieldWithValues[key] = currentVal;
            }
        }
        
        data = { ...data, ...picklistFieldWithValues };
        
        const generatedValues = await fetchGeminiData(fieldNames);
        console.log("🤖 Generated values:", generatedValues);
        
        populateRecordFields(fieldNames, generatedValues, data);
        chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching completed" });

    } catch (error) {
        console.error("[Content Script] ERROR fetching Gemini response:", error);
        chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching Failed: " + error });
    }
}

/**
 * Enhanced method to populate lookup fields with proper dropdown selection
 */
async function populateAccountFieldDirectly(accountField, accountId, accountName) {
    console.log('🎯 === DIRECT ACCOUNT FIELD POPULATION WITH DROPDOWN SELECTION ===');
    console.log('📋 Account Field:', accountField);
    console.log('🆔 Account ID:', accountId);
    console.log('🏷️ Account Name:', accountName);
    
    if (!accountField) {
        console.log('❌ No account field provided');
        return;
    }
    
    if (!accountId) {
        console.log('❌ No account ID provided');
        return;
    }
    
    try {
        // Get the best account name to use
        const nameToUse = accountName || accountId;
        console.log(`📝 Using name for lookup: ${nameToUse}`);
        
        // Enhanced Method 1: Populate with dropdown selection
        const success1 = await populateWithDropdownSelection(accountField, accountId, nameToUse);
        if (success1) {
            console.log('✅ Successfully populated with dropdown selection');
            showToast(`✅ Linked to: ${nameToUse}`, 3000);
            return;
        }
        
        // Enhanced Method 2: Lightning lookup component with selection
        const success2 = await populateLightningLookupWithSelection(accountField, accountId, nameToUse);
        if (success2) {
            console.log('✅ Successfully populated Lightning lookup with selection');
            showToast(`✅ Linked to: ${nameToUse}`, 3000);
            return;
        }
        
        // Enhanced Method 3: Combobox with selection
        const success3 = await populateComboboxWithSelection(accountField, accountId, nameToUse);
        if (success3) {
            console.log('✅ Successfully populated combobox with selection');
            showToast(`✅ Linked to: ${nameToUse}`, 3000);
            return;
        }
        
        // Enhanced Method 4: Force selection approach
        const success4 = await forceDropdownSelection(accountField, accountId, nameToUse);
        if (success4) {
            console.log('✅ Successfully forced dropdown selection');
            showToast(`✅ Linked to: ${nameToUse}`, 3000);
            return;
        }
        
        console.log('❌ All dropdown selection methods failed');
        showToast('Warning: Could not select from dropdown', 3000);
        
    } catch (error) {
        console.error('❌ Error in account field population:', error);
        showToast('Error: Could not populate Account field', 3000);
    }
}

/**
 * Method 1: Populate with proper dropdown selection
 */
async function populateWithDropdownSelection(field, recordId, recordName) {
    console.log(`🔧 Method 1: Populate with dropdown selection - ${recordName}`);
    
    try {
        // Step 1: Clear and focus the field
        field.focus();
        await sleep(300);
        
        // Step 2: Clear existing value
        field.value = '';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(500);
        
        // Step 3: Type the record name to trigger search
        field.value = recordName;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        console.log(`📝 Typed in field: ${recordName}`);
        await sleep(1500); // Wait for dropdown to appear
        
        // Step 4: Look for dropdown and select the matching option
        const dropdownSelectors = [
            '.slds-listbox',
            '.slds-dropdown',
            '.slds-combobox__listbox',
            '[role="listbox"]',
            '.lookup__menu'
        ];
        
        for (const selector of dropdownSelectors) {
            const dropdown = document.querySelector(selector);
            if (dropdown && dropdown.offsetParent !== null) {
                console.log(`✅ Found dropdown: ${selector}`);
                
                // Look for matching options
                const options = dropdown.querySelectorAll('[role="option"], .slds-listbox__option, .lookup__item');
                console.log(`🔍 Found ${options.length} options in dropdown`);
                
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                    
                    console.log(`🔍 Checking option: "${optionText}" (ID: ${optionId})`);
                    
                    // Match by record ID (most reliable) or by name
                    if (optionId === recordId || optionText === recordName || optionText.includes(recordName)) {
                        console.log(`✅ Found matching option: ${optionText}`);
                        
                        // Click the option to select it
                        option.click();
                        await sleep(500);
                        
                        // Verify selection worked
                        if (isLookupPopulated(field)) {
                            console.log(`✅ Option successfully selected: ${optionText}`);
                            return true;
                        }
                    }
                }
                
                // If exact match not found, try first option that contains the name
                console.log('⚠️ No exact match, trying partial match...');
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    if (optionText.toLowerCase().includes(recordName.toLowerCase()) && 
                        optionText !== 'Contacts' && 
                        optionText !== 'Recently Viewed') {
                        
                        console.log(`✅ Found partial match: ${optionText}`);
                        option.click();
                        await sleep(500);
                        
                        if (isLookupPopulated(field)) {
                            console.log(`✅ Partial match selected: ${optionText}`);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log('❌ No dropdown found or no matching option');
        return false;
        
    } catch (error) {
        console.error('Error in populateWithDropdownSelection:', error);
        return false;
    }
}

/**
 * Method 2: Lightning lookup component with selection
 */
async function populateLightningLookupWithSelection(field, recordId, recordName) {
    console.log(`🔧 Method 2: Lightning lookup with selection - ${recordName}`);
    
    try {
        // Find the lightning-lookup-desktop component
        const lookupContainer = field.closest('lightning-lookup-desktop') || 
                              field.closest('[data-target-selection-name]');
        
        if (!lookupContainer) {
            console.log('❌ No Lightning lookup container found');
            return false;
        }
        
        const comboboxInput = lookupContainer.querySelector('input[role="combobox"]') || field;
        
        // Clear and type
        comboboxInput.focus();
        await sleep(300);
        comboboxInput.value = '';
        comboboxInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(300);
        
        comboboxInput.value = recordName;
        comboboxInput.dispatchEvent(new Event('input', { bubbles: true }));
        comboboxInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        console.log(`📝 Typed in Lightning lookup: ${recordName}`);
        await sleep(1500);
        
        // Look for Lightning-specific dropdown
        const lightningDropdown = lookupContainer.querySelector('.slds-listbox, [role="listbox"]');
        if (lightningDropdown) {
            console.log('✅ Found Lightning dropdown');
            
            const options = lightningDropdown.querySelectorAll('[role="option"]');
            console.log(`🔍 Found ${options.length} Lightning options`);
            
            for (const option of options) {
                const optionText = option.textContent.trim();
                const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                
                console.log(`🔍 Lightning option: "${optionText}" (ID: ${optionId})`);
                
                if (optionId === recordId || optionText === recordName || optionText.includes(recordName)) {
                    console.log(`✅ Found matching Lightning option: ${optionText}`);
                    
                    // Scroll option into view if needed
                    option.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    await sleep(200);
                    
                    // Click the option
                    option.click();
                    await sleep(500);
                    
                    // Verify selection
                    if (isLookupPopulated(comboboxInput)) {
                        console.log(`✅ Lightning option selected: ${optionText}`);
                        return true;
                    }
                }
            }
        }
        
        console.log('❌ No Lightning dropdown or matching option found');
        return false;
        
    } catch (error) {
        console.error('Error in populateLightningLookupWithSelection:', error);
        return false;
    }
}

/**
 * Method 3: Combobox with selection
 */
async function populateComboboxWithSelection(field, recordId, recordName) {
    console.log(`🔧 Method 3: Combobox with selection - ${recordName}`);
    
    try {
        const container = field.closest('[data-target-selection-name]') || field.parentElement;
        
        // Look for combobox button
        const comboboxButton = container.querySelector('button[aria-expanded], button[aria-haspopup]');
        if (comboboxButton) {
            console.log('✅ Found combobox button');
            
            // Click to open dropdown
            comboboxButton.click();
            await sleep(1000);
            
            // Look for search input
            const searchInput = container.querySelector('input[type="search"], input[placeholder*="Search"]');
            if (searchInput) {
                console.log('✅ Found search input in combobox');
                
                searchInput.focus();
                searchInput.value = recordName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(1000);
                
                // Look for options
                const options = container.querySelectorAll('[role="option"]');
                console.log(`🔍 Found ${options.length} combobox options`);
                
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                    
                    console.log(`🔍 Combobox option: "${optionText}" (ID: ${optionId})`);
                    
                    if (optionId === recordId || optionText === recordName || optionText.includes(recordName)) {
                        console.log(`✅ Found matching combobox option: ${optionText}`);
                        
                        option.click();
                        await sleep(500);
                        
                        if (isLookupPopulated(field)) {
                            console.log(`✅ Combobox option selected: ${optionText}`);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log('❌ No combobox button or matching option found');
        return false;
        
    } catch (error) {
        console.error('Error in populateComboboxWithSelection:', error);
        return false;
    }
}

/**
 * Method 4: Force dropdown selection (aggressive approach)
 */
async function forceDropdownSelection(field, recordId, recordName) {
    console.log(`🔧 Method 4: Force dropdown selection - ${recordName}`);
    
    try {
        // Type the name with various triggers
        field.focus();
        await sleep(200);
        
        // Clear field
        field.value = '';
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(300);
        
        // Type character by character to trigger search
        for (let i = 0; i < recordName.length; i++) {
            field.value = recordName.substring(0, i + 1);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('keyup', { bubbles: true }));
            await sleep(50);
        }
        
        console.log(`📝 Typed character by character: ${recordName}`);
        await sleep(1000);
        
        // Try various keyboard events to trigger dropdown
        const keyEvents = ['ArrowDown', 'Enter', 'Tab'];
        
        for (const key of keyEvents) {
            field.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
            await sleep(500);
            
            // Check if dropdown appeared
            const dropdown = document.querySelector('.slds-listbox:not([style*="display: none"]), .slds-dropdown:not([style*="display: none"]), [role="listbox"]:not([style*="display: none"])');
            if (dropdown) {
                console.log(`✅ Dropdown appeared after ${key} key`);
                
                const options = dropdown.querySelectorAll('[role="option"]');
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    if (optionText === recordName || optionText.includes(recordName)) {
                        console.log(`✅ Found option with ${key}: ${optionText}`);
                        option.click();
                        await sleep(500);
                        
                        if (isLookupPopulated(field)) {
                            console.log(`✅ Option selected with ${key}: ${optionText}`);
                            return true;
                        }
                    }
                }
            }
        }
        
        console.log('❌ Force selection failed');
        return false;
        
    } catch (error) {
        console.error('Error in forceDropdownSelection:', error);
        return false;
    }
}

/**
 * Enhanced check if lookup field is populated (includes dropdown selection)
 */
function isLookupPopulated(inputElement) {
    if (!inputElement) return false;
    
    // Check if input has value
    if (inputElement.value && inputElement.value.trim() !== '') {
        console.log(`✅ Input has value: ${inputElement.value}`);
        return true;
    }
    
    // Check for selected pill/token
    const container = inputElement.closest('[data-target-selection-name]') || inputElement.parentElement;
    if (container) {
        const pill = container.querySelector('.slds-pill, .lookup__pill, .pillText');
        if (pill && pill.textContent.trim() !== '') {
            console.log(`✅ Found pill: ${pill.textContent.trim()}`);
            return true;
        }
        
        // Check for hidden selected value
        const hiddenInput = container.querySelector('input[type="hidden"]');
        if (hiddenInput && hiddenInput.value) {
            console.log(`✅ Found hidden value: ${hiddenInput.value}`);
            return true;
        }
        
        // Check for data attributes indicating selection
        if (inputElement.getAttribute('data-recordid') || inputElement.getAttribute('data-value')) {
            console.log(`✅ Found data attribute selection`);
            return true;
        }
    }
    
    console.log(`❌ Field not populated`);
    return false;
}

/**
 * Populate field with account name
 */
async function populateFieldWithName(field, name) {
    console.log(`📝 Populating field with name: ${name}`);
    
    // Clear field first
    field.focus();
    await sleep(200);
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
    
    // Type the name
    field.value = name;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    await sleep(1000);
    
    // Look for dropdown and select option
    const dropdowns = document.querySelectorAll('.slds-listbox, .slds-dropdown, [role="listbox"]');
    for (const dropdown of dropdowns) {
        if (dropdown.offsetParent !== null) {
            console.log('🔍 Found dropdown, looking for matching option');
            const options = dropdown.querySelectorAll('[role="option"]');
            
            for (const option of options) {
                const optionText = option.textContent.trim();
                console.log(`🔍 Option text: ${optionText}`);
                
                if (optionText.includes(name) && optionText !== 'Contacts') {
                    console.log(`✅ Found matching option: ${optionText}`);
                    option.click();
                    await sleep(500);
                    return;
                }
            }
        }
    }
    
    // Try pressing Enter if no dropdown
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await sleep(500);
}

/**
 * Populate field with account ID
 */
async function populateFieldWithId(field, id) {
    console.log(`🆔 Populating field with ID: ${id}`);
    
    // Clear field first
    field.focus();
    await sleep(200);
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(300);
    
    // Type the ID
    field.value = id;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    await sleep(1000);
    
    // Press Enter to accept
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await sleep(500);
}

/**
 * Handle lookup fields specifically for related list contexts
 */
async function handleRelatedListLookupFields() {
    console.log('🔗 Handling related list lookup fields');
    
    // Check if we're in a related list context by examining the URL
    const url = window.location.href;
    const relatedListMatch = url.match(/\/lightning\/r\/(\w+)\/(\w{15}|\w{18})\/related\/(\w+)\/view/);
    
    if (relatedListMatch) {
        const parentObjectType = relatedListMatch[1];
        const parentRecordId = relatedListMatch[2];
        const relatedListName = relatedListMatch[3];
        
        console.log(`📝 Detected related list context: ${relatedListName} on ${parentObjectType} (${parentRecordId})`);
        
        // Store the parent record ID in context if not already there
        const parentVariable = `${parentObjectType.toLowerCase()}Id`;
        if (!recordContext[parentVariable]) {
            recordContext[parentVariable] = parentRecordId;
            console.log(`💾 Stored parent record ID: ${parentVariable} = ${parentRecordId}`);
        }
        
        // Find and populate lookup fields
        await populateRelatedListLookupFields(parentObjectType, parentRecordId, relatedListName);
    }
    
    // Also check for new record forms that might be in related list context
    await handleNewRecordFormLookups();
}

/**
 * Handle lookup fields in new record forms
 */
async function handleNewRecordFormLookups() {
    console.log('🔍 Checking for new record form lookups');
    
    // Check if we're on a new record form
    const url = window.location.href;
    const newRecordMatch = url.match(/\/lightning\/o\/(\w+)\/new/);
    
    if (newRecordMatch) {
        const objectType = newRecordMatch[1];
        console.log(`📝 Detected new ${objectType} form`);
        
        // Wait for form to load
        await sleep(2000);
        
        // Find all lookup fields and populate them with appropriate parent records
        await populateNewRecordLookupFields(objectType);
    }
}

/**
 * Populate lookup fields in new record forms
 */
async function populateNewRecordLookupFields(objectType) {
    console.log(`🔗 Populating lookup fields for new ${objectType} record`);
    
    // Define relationship mappings
    const relationshipMappings = {
        'Contact': {
            'AccountId': 'accountId',
            'Account': 'accountId',
            'ParentId': 'accountId'
        },
        'Opportunity': {
            'AccountId': 'accountId',
            'Account': 'accountId'
        },
        'Case': {
            'AccountId': 'accountId',
            'Account': 'accountId',
            'ContactId': 'contactId',
            'Contact': 'contactId'
        },
        'Task': {
            'WhatId': 'accountId',
            'WhoId': 'contactId'
        },
        'Event': {
            'WhatId': 'accountId',
            'WhoId': 'contactId'
        }
    };
    
    const mappings = relationshipMappings[objectType];
    if (!mappings) {
        console.log(`No lookup mappings defined for ${objectType}`);
        return;
    }
    
    // Find all lookup fields
    const lookupFields = document.querySelectorAll('input[class*="lookup"], input[data-lookup], lightning-input[data-lookup]');
    
    for (const lookupField of lookupFields) {
        const parent = lookupField.closest('[data-target-selection-name]');
        if (parent) {
            const apiField = parent.getAttribute('data-target-selection-name');
            const apiName = apiField.replace(/^sfdc:RecordField\./, '');
            
            console.log(`🔍 Found lookup field: ${apiName}`);
            
            // Check if this field should be populated
            const parentVariable = mappings[apiName];
            if (parentVariable && recordContext[parentVariable]) {
                const parentRecordId = recordContext[parentVariable];
                console.log(`✅ Populating ${apiName} with ${parentVariable}: ${parentRecordId}`);
                
                // Add a delay to ensure form is ready
                await sleep(1000);
                await populateLookupField(apiName, lookupField, parentRecordId);
            }
        }
    }
    
    // Also check for lightning-lookup-desktop components
    const lightningLookups = document.querySelectorAll('lightning-lookup-desktop');
    for (const lookup of lightningLookups) {
        const input = lookup.querySelector('input[role="combobox"]');
        if (input) {
            // Try to get field name from various attributes
            const fieldName = lookup.getAttribute('data-field-name') || 
                             lookup.getAttribute('data-target-selection-name') ||
                             lookup.closest('[data-target-selection-name]')?.getAttribute('data-target-selection-name')?.replace(/^sfdc:RecordField\./, '') ||
                             'AccountId';
            
            console.log(`🔍 Found Lightning lookup field: ${fieldName}`);
            
            const parentVariable = mappings[fieldName];
            if (parentVariable && recordContext[parentVariable]) {
                const parentRecordId = recordContext[parentVariable];
                console.log(`✅ Populating Lightning lookup ${fieldName} with ${parentVariable}: ${parentRecordId}`);
                
                await sleep(1000);
                await populateLookupField(fieldName, input, parentRecordId);
            }
        }
    }
}

/**
 * Populate lookup fields when in related list context
 */
async function populateRelatedListLookupFields(parentObjectType, parentRecordId, relatedListName) {
    console.log(`🔗 Populating lookup fields for ${relatedListName} related to ${parentObjectType}`);
    
    // Wait for form to be ready
    await sleep(2000);
    
    // Get the parent record name if we have it
    const parentNameVariable = `${parentObjectType.toLowerCase()}Name`;
    let parentRecordName = recordContext[parentNameVariable];
    
    if (!parentRecordName) {
        // Try to get the parent record name
        parentRecordName = await getRecordName(parentRecordId);
        recordContext[parentNameVariable] = parentRecordName;
    }
    
    console.log(`🏷️ Parent record name: ${parentRecordName}`);
    
    // Define which fields should be populated based on the relationship
    const relationshipFields = getRelationshipFields(parentObjectType, relatedListName);
    
    // Find all lookup fields
    const allInputs = document.querySelectorAll('input, lightning-input');
    
    for (const input of allInputs) {
        const parent = input.closest('[data-target-selection-name]');
        if (parent) {
            const apiField = parent.getAttribute('data-target-selection-name');
            const apiName = apiField.replace(/^sfdc:RecordField\./, '');
            
            console.log(`🔍 Checking field: ${apiName}`);
            
            // Check if this field should be populated with the parent record
            if (relationshipFields.includes(apiName)) {
                console.log(`✅ Field ${apiName} should be populated with parent ${parentObjectType}: ${parentRecordName}`);
                
                // Clear any existing value first
                await clearLookupField(input);
                await sleep(500);
                
                // Populate with parent record
                await populateLookupField(apiName, input, parentRecordId);
            }
        }
    }
    
    // Also check for lightning-lookup-desktop components
    const lightningLookups = document.querySelectorAll('lightning-lookup-desktop');
    for (const lookup of lightningLookups) {
        const input = lookup.querySelector('input[role="combobox"]');
        if (input) {
            const container = lookup.closest('[data-target-selection-name]');
            if (container) {
                const apiField = container.getAttribute('data-target-selection-name');
                const apiName = apiField.replace(/^sfdc:RecordField\./, '');
                
                console.log(`🔍 Checking Lightning lookup field: ${apiName}`);
                
                if (relationshipFields.includes(apiName)) {
                    console.log(`✅ Lightning field ${apiName} should be populated with parent ${parentObjectType}: ${parentRecordName}`);
                    
                    await clearLookupField(input);
                    await sleep(500);
                    await populateLookupField(apiName, input, parentRecordId);
                }
            }
        }
    }
}

/**
 * Get relationship fields based on parent object and related list
 */
function getRelationshipFields(parentObjectType, relatedListName) {
    const relationships = {
        'Account': {
            'Contacts': ['AccountId', 'Account', 'ParentId'],
            'Opportunities': ['AccountId', 'Account'],
            'Cases': ['AccountId', 'Account'],
            'Tasks': ['WhatId'],
            'Events': ['WhatId']
        },
        'Contact': {
            'Opportunities': ['ContactId', 'Contact'],
            'Cases': ['ContactId', 'Contact'],
            'Tasks': ['WhoId'],
            'Events': ['WhoId']
        },
        'Opportunity': {
            'Quotes': ['OpportunityId', 'Opportunity'],
            'Tasks': ['WhatId'],
            'Events': ['WhatId']
        }
    };
    
    return relationships[parentObjectType]?.[relatedListName] || [];
}

/**
 * Clear lookup field before populating
 */
async function clearLookupField(inputElement) {
    console.log('🧹 Clearing lookup field');
    
    try {
        // Focus and clear
        inputElement.focus();
        await sleep(100);
        
        // Select all and delete
        inputElement.select();
        await sleep(100);
        
        // Clear value
        inputElement.value = '';
        
        // Trigger events
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        await sleep(200);
        
        // Also check for any pills/tokens that need to be removed
        const container = inputElement.closest('[data-target-selection-name]');
        if (container) {
            const pills = container.querySelectorAll('.slds-pill, .lookup__pill');
            for (const pill of pills) {
                const removeButton = pill.querySelector('button, .slds-pill__remove');
                if (removeButton) {
                    removeButton.click();
                    await sleep(100);
                }
            }
        }
        
    } catch (error) {
        console.error('Error clearing lookup field:', error);
    }
}

/**
 * Handle lookup fields by checking for related record IDs
 */
function handleLookupField(apiName, inputElement) {
    console.log(`🔍 Handling lookup field: ${apiName}`);
    
    // Log current record context for debugging
    console.log(`🗂️ Current record context:`, recordContext);
    
    // Check if we have a related record ID in context
    for (const [variable, recordId] of Object.entries(recordContext)) {
        if (shouldPopulateLookupField(apiName, variable)) {
            console.log(`✅ Found matching record for ${apiName}: ${variable} = ${recordId}`);
            populateLookupField(apiName, inputElement, recordId);
            return; // Exit after first match
        }
    }
    
    console.log(`⚠️ No matching record found for lookup field: ${apiName}`);
}

/**
 * Enhanced lookup field matching with better logic
 */
function shouldPopulateLookupField(lookupFieldName, recordVariable) {
    console.log(`🔍 Checking if ${lookupFieldName} should be populated with ${recordVariable}`);
    
    // Primary lookup mappings
    const lookupMappings = {
        'AccountId': 'accountId',
        'Account': 'accountId',
        'ContactId': 'contactId',
        'Contact': 'contactId',
        'OpportunityId': 'opportunityId',
        'Opportunity': 'opportunityId',
        'ParentId': 'accountId', // For Contact's Account lookup
        'WhatId': 'accountId', // For Task/Event - prefer Account over Contact
        'WhoId': 'contactId',    // For Task/Event
        // Additional mappings for different field variations
        'Account__c': 'accountId',
        'Contact__c': 'contactId',
        'Opportunity__c': 'opportunityId'
    };
    
    // Check exact mapping first
    if (lookupMappings[lookupFieldName] === recordVariable) {
        console.log(`✅ Exact mapping found: ${lookupFieldName} -> ${recordVariable}`);
        return true;
    }
    
    // Check for partial matches (case-insensitive)
    const fieldNameLower = lookupFieldName.toLowerCase();
    
    // Account field matching
    if (fieldNameLower.includes('account') && recordVariable === 'accountId') {
        console.log(`✅ Account field match: ${lookupFieldName} -> ${recordVariable}`);
        return true;
    }
    
    // Contact field matching
    if (fieldNameLower.includes('contact') && recordVariable === 'contactId') {
        console.log(`✅ Contact field match: ${lookupFieldName} -> ${recordVariable}`);
        return true;
    }
    
    // Opportunity field matching
    if (fieldNameLower.includes('opportunity') && recordVariable === 'opportunityId') {
        console.log(`✅ Opportunity field match: ${lookupFieldName} -> ${recordVariable}`);
        return true;
    }
    
    // Special case: ParentId for Contact should use Account
    if (lookupFieldName === 'ParentId' && recordVariable === 'accountId') {
        console.log(`✅ ParentId -> Account match: ${lookupFieldName} -> ${recordVariable}`);
        return true;
    }
    
    console.log(`❌ No match found for ${lookupFieldName} with ${recordVariable}`);
    return false;
}

/**
 * Populate lookup field with record ID
 */
async function populateLookupField(fieldName, inputElement, recordId) {
    console.log(`🔗 Populating lookup field ${fieldName} with record ID: ${recordId}`);
    
    try {
        // Get the record name/label for the lookup
        const recordName = await getRecordName(recordId);
        
        // Method 1: Try direct input population
        await populateLookupMethod1(inputElement, recordId, recordName);
        
        // Wait and check if it worked
        await sleep(1000);
        
        // Method 2: Try Lightning lookup component
        if (!isLookupPopulated(inputElement)) {
            await populateLookupMethod2(fieldName, recordId, recordName);
        }
        
        // Method 3: Try combobox approach
        await sleep(1000);
        if (!isLookupPopulated(inputElement)) {
            await populateLookupMethod3(fieldName, recordId, recordName);
        }
        
        console.log(`✅ Attempted to populate lookup field ${fieldName} with ${recordId}`);
        showToast(`Linking to parent record: ${recordName}`, 3000);
        
    } catch (error) {
        console.error(`❌ Error populating lookup field ${fieldName}:`, error);
        showToast(`Warning: Could not auto-link to parent record`, 3000);
    }
}

/**
 * Method 1: Direct input population with record name (improved validation)
 */
async function populateLookupMethod1(inputElement, recordId, recordName) {
    console.log(`🔧 Method 1: Direct input population with name: ${recordName}`);
    
    // Validate record name before using it
    if (!recordName || recordName === 'Contacts' || recordName === 'Contact' || 
        recordName === 'New' || recordName === 'Edit' || recordName.length < 2) {
        console.log(`⚠️ Invalid record name for Method 1: ${recordName}`);
        return false;
    }
    
    try {
        // Focus the lookup input
        inputElement.focus();
        await sleep(300);
        
        // Clear existing value
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(200);
        
        // Type the record name (not ID)
        inputElement.value = recordName;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(1000);
        
        // Look for dropdown options that appear after typing
        const dropdownSelectors = [
            '.slds-listbox',
            '.slds-dropdown',
            '.lookup__menu',
            '.slds-combobox__listbox',
            '[role="listbox"]'
        ];
        
        for (const selector of dropdownSelectors) {
            const dropdown = document.querySelector(selector);
            if (dropdown && dropdown.offsetParent !== null) {
                // Look for exact match by record name or ID
                const options = dropdown.querySelectorAll('[role="option"], .slds-listbox__option, .lookup__item');
                
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                    
                    // Match by record name or ID, but avoid "Contacts" matches
                    if ((optionText.includes(recordName) && optionText !== 'Contacts') || optionId === recordId) {
                        console.log(`✅ Found matching option: ${optionText}`);
                        option.click();
                        await sleep(500);
                        return true;
                    }
                }
                
                // If no exact match, try first option that's not empty and not "Contacts"
                const firstOption = dropdown.querySelector('[role="option"], .slds-listbox__option, .lookup__item');
                if (firstOption && firstOption.textContent.trim() && 
                    firstOption.textContent.trim() !== 'Contacts' &&
                    firstOption.textContent.trim() !== 'Contact') {
                    console.log(`⚠️ Using first available option: ${firstOption.textContent.trim()}`);
                    firstOption.click();
                    await sleep(500);
                    return true;
                }
            }
        }
        
        // If no dropdown appeared, try pressing Enter
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await sleep(500);
        
        // Check if value was accepted and is not "Contacts"
        const finalValue = inputElement.value.trim();
        if (finalValue === recordName || (isLookupPopulated(inputElement) && finalValue !== 'Contacts')) {
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Error in populateLookupMethod1:', error);
        return false;
    }
}

/**
 * Method 2: Lightning lookup component with record name
 */
async function populateLookupMethod2(fieldName, recordId, recordName) {
    console.log(`🔧 Method 2: Lightning lookup component with name: ${recordName}`);
    
    try {
        const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${fieldName}"]`);
        if (!container) return false;
        
        // Find lightning-lookup-desktop component
        const lookupComponent = container.querySelector('lightning-lookup-desktop');
        if (lookupComponent) {
            const input = lookupComponent.querySelector('input[role="combobox"]');
            if (input) {
                input.focus();
                await sleep(300);
                
                // Clear and type record name
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(200);
                
                input.value = recordName;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(1500);
                
                // Look for suggestions
                const suggestions = lookupComponent.querySelector('.slds-listbox');
                if (suggestions) {
                    const options = suggestions.querySelectorAll('[role="option"]');
                    
                    for (const option of options) {
                        const optionText = option.textContent.trim();
                        const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                        
                        if (optionText.includes(recordName) || optionId === recordId) {
                            console.log(`✅ Found matching Lightning option: ${optionText}`);
                            option.click();
                            await sleep(500);
                            return true;
                        }
                    }
                    
                    // Try first option if available
                    const firstOption = suggestions.querySelector('[role="option"]');
                    if (firstOption && firstOption.textContent.trim()) {
                        console.log(`⚠️ Using first Lightning option: ${firstOption.textContent.trim()}`);
                        firstOption.click();
                        await sleep(500);
                        return true;
                    }
                }
                
                // Try pressing Enter
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                await sleep(500);
                
                return input.value.trim() === recordName;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error in populateLookupMethod2:', error);
        return false;
    }
}

/**
 * Method 3: Combobox approach with record name
 */
async function populateLookupMethod3(fieldName, recordId, recordName) {
    console.log(`🔧 Method 3: Combobox approach with name: ${recordName}`);
    
    try {
        const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${fieldName}"]`);
        if (!container) return false;
        
        // Find combobox button
        const comboboxButton = container.querySelector('button[aria-expanded]');
        if (comboboxButton) {
            comboboxButton.click();
            await sleep(1000);
            
            // Look for search input in dropdown
            const searchInput = container.querySelector('input[type="search"], input[placeholder*="Search"]');
            if (searchInput) {
                searchInput.focus();
                await sleep(200);
                
                searchInput.value = recordName;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(1500);
                
                // Look for matching option
                const options = container.querySelectorAll('[role="option"]');
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    const optionId = option.getAttribute('data-recordid') || option.getAttribute('data-value');
                    
                    if (optionText.includes(recordName) || optionId === recordId) {
                        console.log(`✅ Found matching combobox option: ${optionText}`);
                        option.click();
                        await sleep(500);
                        return true;
                    }
                }
                
                // Try first option if available
                if (options.length > 0 && options[0].textContent.trim()) {
                    console.log(`⚠️ Using first combobox option: ${options[0].textContent.trim()}`);
                    options[0].click();
                    await sleep(500);
                    return true;
                }
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error in populateLookupMethod3:', error);
        return false;
    }
}

/**
 * Method 4: Search-based lookup population
 */
async function populateLookupBySearch(fieldName, recordName) {
    console.log(`🔧 Method 4: Search-based lookup with name: ${recordName}`);
    
    try {
        const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${fieldName}"]`);
        if (!container) return false;
        
        // Find all possible input elements
        const inputs = container.querySelectorAll('input[type="text"], input[role="combobox"], input[class*="lookup"]');
        
        for (const input of inputs) {
            try {
                // Clear and focus
                input.focus();
                await sleep(200);
                
                // Select all text and replace
                input.select();
                await sleep(100);
                
                // Use document.execCommand to insert text (works better with some components)
                document.execCommand('insertText', false, recordName);
                await sleep(100);
                
                // Also set value directly
                input.value = recordName;
                
                // Trigger multiple events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('keyup', { bubbles: true }));
                
                await sleep(1000);
                
                // Check for any dropdowns or suggestions
                const dropdowns = document.querySelectorAll('.slds-listbox, .slds-dropdown, [role="listbox"]');
                for (const dropdown of dropdowns) {
                    if (dropdown.offsetParent !== null) {
                        const options = dropdown.querySelectorAll('[role="option"]');
                        for (const option of options) {
                            if (option.textContent.includes(recordName)) {
                                option.click();
                                await sleep(500);
                                return true;
                            }
                        }
                    }
                }
                
                // Try pressing Tab to accept
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
                await sleep(500);
                
                // Check if it worked
                if (input.value.includes(recordName) || isLookupPopulated(input)) {
                    return true;
                }
                
            } catch (error) {
                console.error('Error in search method for input:', error);
                continue;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error in populateLookupBySearch:', error);
        return false;
    }
}

/**
 * Check if lookup field is populated
 */
function isLookupPopulated(inputElement) {
    if (!inputElement) return false;
    
    // Check if input has value
    if (inputElement.value && inputElement.value.trim() !== '') {
        return true;
    }
    
    // Check for selected pill/token
    const container = inputElement.closest('[data-target-selection-name]');
    if (container) {
        const pill = container.querySelector('.slds-pill, .lookup__pill, .pillText');
        if (pill && pill.textContent.trim() !== '') {
            return true;
        }
    }
    
    return false;
}

/**
 * Get record name by ID using Salesforce REST API
 */
async function getRecordName(recordId) {
    console.log(`🔍 Fetching record name for ID: ${recordId}`);
    
    try {
        // Method 1: Try to get from current page context first
        const contextName = await getRecordNameFromContext(recordId);
        if (contextName) {
            console.log(`✅ Found record name from context: ${contextName}`);
            return contextName;
        }
        
        // Method 2: Use Salesforce REST API to get record details
        const apiName = await getRecordNameFromAPI(recordId);
        if (apiName) {
            console.log(`✅ Found record name from API: ${apiName}`);
            return apiName;
        }
        
        // Method 3: Try to extract from page elements
        const pageName = await getRecordNameFromPage(recordId);
        if (pageName) {
            console.log(`✅ Found record name from page: ${pageName}`);
            return pageName;
        }
        
        // Fallback: Use record ID
        console.warn(`⚠️ Could not find record name for ${recordId}, using ID`);
        return recordId;
        
    } catch (error) {
        console.error(`❌ Error getting record name for ${recordId}:`, error);
        return recordId;
    }
}

/**
 * Get record name from current page context (improved to avoid "Contacts")
 */
async function getRecordNameFromContext(recordId) {
    try {
        // Check if we're currently on the record page
        const currentUrl = window.location.href;
        if (currentUrl.includes(recordId)) {
            // Try to get the record name from page title or header
            const pageTitle = document.title;
            if (pageTitle && !pageTitle.includes('Salesforce') && !pageTitle.includes('Lightning')) {
                const titleParts = pageTitle.split(' | ');
                if (titleParts.length > 0) {
                    const recordName = titleParts[0].trim();
                    // Filter out common page elements that aren't record names
                    if (recordName && recordName !== 'New' && recordName !== 'Edit' && 
                        recordName !== 'Contacts' && recordName !== 'Contact' &&
                        recordName !== 'Opportunities' && recordName !== 'Cases' &&
                        recordName.length > 1) {
                        return recordName;
                    }
                }
            }
            
            // Try to get from page header elements, avoiding navigation elements
            const headerSelectors = [
                'h1.slds-page-header__title',
                '.slds-page-header__title',
                'h1[data-aura-class="uiOutputText"]',
                '.uiOutputText[data-aura-class="uiOutputText"]',
                'lightning-formatted-text[data-output]',
                'span.uiOutputText'
            ];
            
            for (const selector of headerSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent.trim();
                    // More strict filtering to avoid page navigation elements
                    if (text && text !== 'New' && text !== 'Edit' && 
                        text !== 'Contacts' && text !== 'Contact' &&
                        text !== 'Opportunities' && text !== 'Cases' &&
                        text !== 'Accounts' && text !== 'Leads' &&
                        text.length > 1 && !text.includes('Related List')) {
                        return text;
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting record name from context:', error);
        return null;
    }
}

/**
 * Get record name using Salesforce REST API
 */
async function getRecordNameFromAPI(recordId) {
    try {
        // Determine object type from record ID
        const objectType = getObjectTypeFromId(recordId);
        if (!objectType) {
            console.warn(`Could not determine object type for ID: ${recordId}`);
            return null;
        }
        
        // Get session ID from page
        const sessionId = await getSessionId();
        if (!sessionId) {
            console.warn('Could not get session ID for API call');
            return null;
        }
        
        // Get instance URL
        const instanceUrl = window.location.origin;
        
        // Determine the Name field for the object
        const nameField = getNameFieldForObject(objectType);
        
        // Make REST API call
        const apiUrl = `${instanceUrl}/services/data/v58.0/sobjects/${objectType}/${recordId}?fields=${nameField}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionId}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const recordName = data[nameField];
            if (recordName) {
                return recordName;
            }
        } else {
            console.warn(`API call failed with status: ${response.status}`);
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting record name from API:', error);
        return null;
    }
}

/**
 * Get record name from page elements (for recently viewed records)
 */
async function getRecordNameFromPage(recordId) {
    try {
        // Look for the record in recent items or breadcrumbs
        const breadcrumbSelectors = [
            '.slds-breadcrumb li:last-child',
            '.slds-breadcrumb__item:last-child',
            'nav[role="navigation"] li:last-child'
        ];
        
        for (const selector of breadcrumbSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                if (text && text !== 'New' && text !== 'Edit') {
                    return text;
                }
            }
        }
        
        // Try to find in recent items or global search
        const recentItems = document.querySelectorAll('a[href*="' + recordId + '"]');
        for (const item of recentItems) {
            const text = item.textContent.trim();
            if (text && text !== recordId && text.length > 1) {
                return text;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting record name from page:', error);
        return null;
    }
}

/**
 * Get Salesforce session ID from page
 */
async function getSessionId() {
    try {
        // Method 1: Try to get from window object
        if (window.SFDCSessionId) {
            return window.SFDCSessionId;
        }
        
        // Method 2: Try to extract from page source
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent;
            if (content.includes('sessionId')) {
                const match = content.match(/sessionId["']?\s*:\s*["']([^"']+)["']/);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        
        // Method 3: Try to get from meta tags
        const sessionMeta = document.querySelector('meta[name="salesforce-session"]');
        if (sessionMeta) {
            return sessionMeta.content;
        }
        
        // Method 4: Try to extract from cookies or localStorage
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            if (cookie.includes('sid=')) {
                const sessionId = cookie.split('sid=')[1].split(';')[0];
                if (sessionId) {
                    return sessionId;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting session ID:', error);
        return null;
    }
}

/**
 * Get object type from 15 or 18 character Salesforce ID
 */
function getObjectTypeFromId(recordId) {
    const objectPrefixes = {
        '001': 'Account',
        '003': 'Contact',
        '006': 'Opportunity',
        '500': 'Case',
        '00Q': 'Lead',
        '0Q0': 'Quote',
        '01t': 'Product2',
        '01u': 'Pricebook2',
        '01s': 'PricebookEntry',
        '00k': 'Task',
        '00U': 'Event',
        '00G': 'User',
        '00D': 'Organization',
        '00N': 'CustomField__c',
        '01I': 'Campaign',
        '701': 'CampaignMember',
        '02s': 'Solution',
        '02i': 'Contract'
    };
    
    if (recordId && recordId.length >= 15) {
        const prefix = recordId.substring(0, 3);
        return objectPrefixes[prefix] || null;
    }
    
    return null;
}

/**
 * Get the Name field for different object types
 */
function getNameFieldForObject(objectType) {
    const nameFields = {
        'Account': 'Name',
        'Contact': 'Name',
        'Opportunity': 'Name',
        'Case': 'Subject',
        'Lead': 'Name',
        'Quote': 'Name',
        'Product2': 'Name',
        'Pricebook2': 'Name',
        'Task': 'Subject',
        'Event': 'Subject',
        'User': 'Name',
        'Campaign': 'Name',
        'Solution': 'SolutionName',
        'Contract': 'ContractNumber'
    };
    
    return nameFields[objectType] || 'Name';
}

/**
 * Enhanced method to populate lookup fields with proper Account detection
 */
async function populateLookupFieldEnhanced(fieldName, inputElement, recordId) {
    console.log(`🔗 Enhanced lookup population for ${fieldName} with record ID: ${recordId}`);
    
    try {
        // Get the record name using multiple methods
        const recordName = await getRecordNameEnhanced(recordId);
        console.log(`📝 Retrieved record name: ${recordName}`);
        
        // Validate the record name
        if (!recordName || recordName === 'Contacts' || recordName === 'Contact' || recordName.length < 2) {
            console.warn(`⚠️ Invalid record name: ${recordName}, trying alternative methods`);
            
            // Try to get from stored context
            const objectType = getObjectTypeFromId(recordId);
            const storedName = recordContext[`${objectType.toLowerCase()}Name`];
            if (storedName && storedName !== 'Contacts') {
                console.log(`✅ Using stored name: ${storedName}`);
                await populateWithRecordName(inputElement, recordId, storedName);
                return;
            }
            
            // Final fallback - use object type + ID
            const fallbackName = `${objectType} ${recordId.substring(0, 8)}`;
            console.log(`⚠️ Using fallback name: ${fallbackName}`);
            await populateWithRecordName(inputElement, recordId, fallbackName);
            return;
        }
        
        // Use the valid record name
        await populateWithRecordName(inputElement, recordId, recordName);
        
    } catch (error) {
        console.error(`❌ Error in enhanced lookup population:`, error);
        showToast('Warning: Could not auto-populate lookup field', 2000);
    }
}

/**
 * Enhanced record name retrieval
 */
async function getRecordNameEnhanced(recordId) {
    console.log(`🔍 Enhanced record name retrieval for: ${recordId}`);
    
    try {
        // Method 1: Check if we have it in context already
        const objectType = getObjectTypeFromId(recordId);
        const contextName = recordContext[`${objectType.toLowerCase()}Name`];
        if (contextName && contextName !== 'Contacts' && contextName !== 'Contact') {
            console.log(`✅ Found in context: ${contextName}`);
            return contextName;
        }
        
        // Method 2: Try to get from current page if we're on the record
        const currentUrl = window.location.href;
        if (currentUrl.includes(recordId)) {
            const pageName = await getRecordNameFromCurrentPage(recordId);
            if (pageName) {
                console.log(`✅ Found from current page: ${pageName}`);
                return pageName;
            }
        }
        
        // Method 3: Try API call
        const apiName = await getRecordNameFromAPI(recordId);
        if (apiName && apiName !== 'Contacts') {
            console.log(`✅ Found from API: ${apiName}`);
            return apiName;
        }
        
        // Method 4: Try to construct from available data
        const constructedName = await constructRecordName(recordId);
        if (constructedName) {
            console.log(`✅ Constructed name: ${constructedName}`);
            return constructedName;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error in enhanced record name retrieval:', error);
        return null;
    }
}

/**
 * Get record name from current page with better filtering
 */
async function getRecordNameFromCurrentPage(recordId) {
    try {
        // Look for the account name in the page header
        const headerSelectors = [
            'h1.slds-page-header__title',
            '.slds-page-header__title',
            'h1[data-aura-class="uiOutputText"]',
            'lightning-formatted-text'
        ];
        
        for (const selector of headerSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                
                // Filter out common page elements
                if (text && text !== 'New' && text !== 'Edit' && 
                    text !== 'Contacts' && text !== 'Contact' &&
                    text !== 'Opportunities' && text !== 'Cases' &&
                    text !== 'Accounts' && text !== 'Account' &&
                    text.length > 2 && !text.includes('(0)')) {
                    
                    // Remove any trailing identifiers like "test76"
                    const cleanName = text.replace(/\s+test\d+$/, '').trim();
                    return cleanName || text;
                }
            }
        }
        
        // Try to get from page title
        const pageTitle = document.title;
        if (pageTitle && !pageTitle.includes('Salesforce')) {
            const titleParts = pageTitle.split(' | ');
            if (titleParts.length > 0) {
                const recordName = titleParts[0].trim();
                if (recordName && recordName !== 'Contacts' && recordName !== 'Account') {
                    return recordName;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting record name from current page:', error);
        return null;
    }
}

/**
 * Construct record name from available data
 */
async function constructRecordName(recordId) {
    try {
        const objectType = getObjectTypeFromId(recordId);
        
        // For accounts, try to find the name in the current page
        if (objectType === 'Account') {
            // Look for account name in detail fields
            const nameFields = document.querySelectorAll('[data-target-selection-name*="Name"], .slds-form-element__static');
            
            for (const field of nameFields) {
                const text = field.textContent.trim();
                if (text && text.length > 2 && text !== 'Name' && 
                    text !== 'Account Name' && text !== 'Contacts') {
                    return text;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Error constructing record name:', error);
        return null;
    }
}

/**
 * Populate lookup field with validated record name
 */
async function populateWithRecordName(inputElement, recordId, recordName) {
    console.log(`🔧 Populating lookup field with: ${recordName}`);
    
    try {
        // Clear the field first
        await clearLookupField(inputElement);
        await sleep(500);
        
        // Focus and type the record name
        inputElement.focus();
        await sleep(300);
        
        // Type the record name
        inputElement.value = recordName;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        await sleep(1000);
        
        // Look for and select matching dropdown option
        const dropdowns = document.querySelectorAll('.slds-listbox, .slds-dropdown, [role="listbox"]');
        
        for (const dropdown of dropdowns) {
            if (dropdown.offsetParent !== null) {
                const options = dropdown.querySelectorAll('[role="option"]');
                
                for (const option of options) {
                    const optionText = option.textContent.trim();
                    const optionId = option.getAttribute('data-recordid');
                    
                    // Match by ID or name, but avoid "Contacts"
                    if ((optionId === recordId) || 
                        (optionText.includes(recordName) && optionText !== 'Contacts')) {
                        
                        console.log(`✅ Selecting option: ${optionText}`);
                        option.click();
                        await sleep(500);
                        showToast(`Linked to: ${recordName}`, 2000);
                        return;
                    }
                }
            }
        }
        
        // If no dropdown, try pressing Enter
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await sleep(500);
        
        // Check if it worked
        if (inputElement.value.trim() === recordName) {
            showToast(`Linked to: ${recordName}`, 2000);
        } else {
            showToast(`Attempted to link to: ${recordName}`, 2000);
        }
        
    } catch (error) {
        console.error('Error populating with record name:', error);
        showToast('Warning: Could not populate lookup field', 2000);
    }
}

/**
 * Override the original populateLookupField to use enhanced version
 */
async function populateLookupField(fieldName, inputElement, recordId) {
    return await populateLookupFieldEnhanced(fieldName, inputElement, recordId);
}

function isRichTextInput(apiFieldName) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    if (container) {
        const editableDiv = container.querySelector('input[type=file]');
        if (editableDiv) {
            return true;
        }
    } else {
        return false;
    }
}

function getTypeOfPicklistField(apiFieldName) {
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

function extractObjectApiName(url) {
    const match = url.match(/\/lightning\/o\/([^\/]+)\/new/);
    return match ? match[1] : '';
}

async function getAllPicklistOptions() {
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

            const options = await getPicklistOptionsForRecordField(fieldName, "anchor");
            results[apiName] = {
                'options': options
            }
        } else if (comboboxBtn !== null && comboboxBtn) {
            const isRichText = isRichTextInput(apiName);
            if (isRichText) continue;
            if (!fieldName) continue;
            const options = await getPicklistOptionsForRecordField(fieldName, "combobox");
            results[apiName] = {
                'options': options
            }
        }
    }

    return results;
}

function getPicklistOptionsForRecordField(apiFieldName, type) {
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

function getPicklistValue(apiFieldName) {
    const typeOfPicklistField = getTypeOfPicklistField(apiFieldName);
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
        let selectedValue = ''
        if (selectedButton) {
            selectedValue = selectedButton.getAttribute('data-value');
        }
        return selectedValue;
    }
    return '';
}

function setPicklistValue(apiFieldName, desiredValue) {
    const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
    const typeOfPicklistField = getTypeOfPicklistField(apiFieldName);
    
    if (typeOfPicklistField === "anchor") {
        return new Promise((resolve, reject) => {
            const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
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
    return Promise.resolve([]);
}

function getSalesforceFieldType(apiFieldName) {
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
        
        if (editableDiv) {
            return 'file';
        }
        
        if ((lightningDatetimePicker !== null && lightningDatetimePicker !== undefined) ||
            (fieldSetDtClasses.includes('uiInputDateTime'))) {
            return 'datetime'
        }
        
        if (lightningTimePicker) {
            return 'time'
        }
        
        if (lightningDatePicker || datePickerBtn) {
            return 'date';
        }

        // Enhanced lookup field detection
        if (inputElement) {
            // Check for various lookup field indicators
            if (inputElement.classList.contains('uiInput--lookup') ||
                inputElement.classList.contains('slds-combobox__input') ||
                inputElement.getAttribute('role') === 'combobox' ||
                inputElement.getAttribute('data-lookup') !== null) {
                return "lookup";
            }
            
            // Check parent containers for lookup indicators
            let parent = inputElement.closest('[data-lookup]');
            if (parent !== null) {
                return "lookup";
            }
            
            // Check for lightning-lookup-desktop component
            parent = inputElement.closest('lightning-lookup-desktop');
            if (parent !== null) {
                return "lookup";
            }
            
            // Check for lookup-specific classes in parent containers
            parent = inputElement.closest('[class*="lookup"]');
            if (parent !== null) {
                return "lookup";
            }
        }
        
        // Check for lightning-lookup-desktop components
        const lightningLookup = container.querySelector('lightning-lookup-desktop');
        if (lightningLookup) {
            return "lookup";
        }
        
        // Check for lookup-specific selectors
        const lookupSelectors = [
            '.slds-lookup',
            '.forceSearchInputLookupDesktop',
            'lightning-lookup',
            '[data-lookup]'
        ];
        
        for (const selector of lookupSelectors) {
            if (container.querySelector(selector)) {
                return "lookup";
            }
        }

        if (classList.includes('uiInputNumber')) {
            return 'number';
        } else if (classList.includes('uiInputCurrency')) {
            return 'currency';
        } else if (classList.includes('uiInputRichText')) {
            return 'richtext';
        } else if (classList.includes('uiInputCheckbox')) {
            return 'checkbox';
        } else if (classList.includes('uiInputSelect')) {
            return 'picklist';
        } else if (typeDiv && typeDiv.querySelector('a.select')) {
            return 'picklist-anchor';
        }
    }
    return null;
}

function populateRecordFields(allFieldNames, generatedValues, existingData) {
    let data = existingData;
    let fieldNames = allFieldNames;
    
    fieldNames.forEach(field => {
        console.log("Field ", field);
        
        if (field?.type === "picklist") {
            setPicklistValue(field?.apiName, generatedValues[field.apiName])
                .then(result => {
                    console.log('setPicklist success');
                })
                .catch(error => {
                    console.log('setPicklist error ', error);
                });
        } else {
            if (generatedValues[field.apiName] !== undefined && generatedValues[field.apiName] !== null) {
                let value = field?.containsMultipleFields === true ? generatedValues[field?.apiName] : generatedValues[field.apiName];
                let previousValue = data[field.apiName]
                
                if (typeof value === 'object') {
                    const section = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field.apiName}"]`);
                    if (!section) {
                        console.warn(`Fieldset not found for ${field.apiName}`);
                        return null;
                    }

                    const inputs = section.querySelectorAll('input, textarea');
                    let section_existing_value = {}
                    const values = {};

                    inputs.forEach(input => {
                        let name = input.name;
                        let nameLower = name.toLowerCase();
                        const existingValue = input.value;
                        section_existing_value[nameLower] = existingValue;
                    });
                    
                    for (key in value) {
                        let keyLower = key.toLowerCase();
                        value[keyLower] = value[key];
                    }
                    
                    inputs.forEach(input => {
                        let name = input.name;
                        let nameLower = name.toLowerCase();

                        if (nameLower in value) {
                            input.value = value[nameLower];
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });
                } else {
                    if (field?.type === "file") {
                        const rtaContainer = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field.apiName}"]`);
                        if (rtaContainer) {
                            const editableDiv = rtaContainer.querySelector('.ql-editor');
                            if (editableDiv) {
                                editableDiv.innerHTML = value;
                            }
                        }
                    } else {
                        if (previousValue === null || previousValue === undefined || previousValue === '' || previousValue === false) {
                            if (value === true || value === false) {
                                field.element.checked = value;
                            } else {
                                if (field?.type === "date") {
                                    const dateContainer = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field?.apiName}"]`);
                                    const datePicker = dateContainer?.querySelector('lightning-datepicker') ?? null;
                                    const dateInputElement = document.getElementById(field?.id);

                                    if (datePicker) {
                                        const userLocale = navigator.language || 'en-US';
                                        const formattedDate = new Date(value).toLocaleDateString(userLocale);
                                        dateInputElement.focus();
                                        dateInputElement.value = formattedDate;
                                        dateInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                                        dateInputElement.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                    
                                    if (dateInputElement) {
                                        const formattedDate = new Date(value).toISOString().split('T')[0];
                                        dateInputElement.focus();
                                        dateInputElement.value = formattedDate;
                                        dateInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                                        dateInputElement.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                } else if (field?.type === "datetime") {
                                    // Handle datetime fields
                                } else {
                                    field.element.value = value;
                                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                                    field.element.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

async function fetchGeminiData(fieldNames) {
    const API_KEY = "AIzaSyDJmSlrT7qztmzQ_Lov6tL25iWdlyIzHbI";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const compoundFieldsMap = {};
    const simpleFields = [];
    const fieldDescriptions = [];

    fieldNames.forEach(field => {
        if (field.containsMultipleFields) {
            if (!compoundFieldsMap[field.apiName]) {
                compoundFieldsMap[field.apiName] = new Set();
            }
            compoundFieldsMap[field.apiName].add(field.name);
        } else {
            simpleFields.push(field);
        }
    });

    for (const [apiName, partsSet] of Object.entries(compoundFieldsMap)) {
        const parts = Array.from(partsSet).join(', ');
        fieldDescriptions.push(`${apiName}: return an object with keys like {${parts}}`);
    }

    simpleFields.forEach(field => {
        if (field.type === 'picklist' && field.options?.length) {
            const validOptions = field.options.filter(opt => opt !== '--None--');
            fieldDescriptions.push(`${field.apiName} (picklist): Options = ${validOptions.join(', ')}`);
        } else if (field.type === 'time') {
            fieldDescriptions.push(`${field.apiName} (time)`);
        } else if (field.type === 'datetime') {
            fieldDescriptions.push(`${field.apiName} (datetime)`);
        } else {
            fieldDescriptions.push(`${field.apiName}`);
        }
    });
    
    const timeOptions = getTimeOptions();

    const userMessage = `
Make recommendations. Suggest realistic values for the following fields:

${fieldDescriptions.join('\n')}

Return output as a valid JSON object:
- Use API names as keys.
- For fields like BillingAddress or Name, return a nested object. Example:
  "BillingAddress": {
      "street": "123 Main St",
      "city": "Los Angeles",
      "state": "CA"
  }

Rules:
- For picklist fields, only return from the listed options.
- Do not include '--None--'.
- For datetime fields, use format {date: "yyyy-mm-dd", time: "2:00 AM"}.
- Use one of the following time options for time fields: ${timeOptions.join(', ')}.
- The structure for api names is as objecApiName.fieldApiName. For eg Account.Amount, Opportunity.StageName. Do NOT modify this.
- Return the JSON object.  For example Account {Account.Name: Acme Corp, Account.Amount: 5000}
- Do not include any explanation or text. Return only the JSON object.
`;

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: userMessage
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (response.status >= 200 && response.status < 300) {
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("FetchGeminiData: No AI response received.");
            }
            
            let rawResponse = data.candidates[0].content.parts[0].text;
            let jsonString = rawResponse.replace(/```json|```/g, "").trim();
            
            try {
                let parsedData = JSON.parse(jsonString);
                return parsedData;
            } catch (error) {
                throw new Error("FetchGeminiData: Failed to parse AI response.");
            }
        } else {
            throw new Error(`FetchGeminiData: HTTP Error: ${response.status} - ${response.statusText}`);
        }

    } catch (ex) {
        throw new Error("FetchGeminiData: Error while calling Gemini APIs ", ex?.message);
    }
}

function getTimeOptions() {
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

function captureFieldValuesFromUi() {
    const inputs = document.querySelectorAll('input.slds-input, input, .textarea');
    const data = {};
    
    inputs.forEach(input => {
        const name = input.name || input.id;
        let value = null;
        let parent = input.closest('[data-target-selection-name]');
        let apiField = parent ? parent.getAttribute('data-target-selection-name') : null;

        if (apiField) {
            let apiName = apiField.replace(/^sfdc:RecordField\./, '');
            
            if (input.classList.contains('uiInput--lookup')) {
                const pillTextEl = input.querySelector('.pillText');
                const displayValue = pillTextEl?.innerText?.trim() || null;
                value = displayValue;
            } else if (input.type === 'checkbox') {
                value = input.checked;
            } else {
                value = input.value;
            }

            data[apiName] = value;
        }
    });
    
    return data;
}
