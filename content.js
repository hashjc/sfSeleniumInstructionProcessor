// content.js - Content script to execute automation on the current page
console.log('Salesforce automation content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeAutomation') {
        executeAutomationSteps(request.actionPlan)
            .then(result => {
                sendResponse({ success: true, result: result });
            })
            .catch(error => {
                console.error('Automation error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});

/**
 * Execute automation steps directly on the current page
 */
async function executeAutomationSteps(actionPlan) {
    console.log('Executing automation steps:', actionPlan);
    
    for (let i = 0; i < actionPlan.length; i++) {
        const step = actionPlan[i];
        console.log(`Executing step ${i + 1}:`, step);
        
        try {
            await executeStep(step);
            // Small delay between steps
            await sleep(1000);
        } catch (error) {
            console.error(`Error in step ${i + 1}:`, error);
            throw new Error(`Step ${i + 1} failed: ${error.message}`);
        }
    }
    
    return 'Automation completed successfully';
}

/**
 * Execute a single automation step
 */
async function executeStep(step) {
    const { action, details } = step;
    
    switch (action) {
        case 'navigate':
            window.location.href = details.url;
            await waitForPageLoad();
            break;
            
        case 'click':
            await clickElement(details.selector);
            break;
            
        case 'type':
            await typeInElement(details.selector, details.text);
            break;
            
        case 'selectByValue':
            await selectByValue(details.selector, details.value);
            break;
            
        case 'waitFor':
            await waitForElement(details.selector, details.timeout || 10000);
            break;
            
        case 'waitForVisible':
            await waitForElementVisible(details.selector, details.timeout || 10000);
            break;
            
        case 'app_launcher':
            await handleAppLauncher(details.objectName || 'Accounts');
            break;
            
        case 'sleep':
            await sleep(details.ms || 1000);
            break;
            
        default:
            console.warn(`Unknown action: ${action}`);
    }
}

/**
 * Click an element using CSS selector or XPath
 */
async function clickElement(selector) {
    const element = await findElement(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    
    // Scroll element into view
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
    
    // Focus the element
    element.focus();
    await sleep(200);
    
    // Clear existing text
    element.value = '';
    
    // Type the text
    element.value = text;
    
    // Trigger input events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`Typed "${text}" into element: ${selector}`);
}

/**
 * Select option by value
 */
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
        
        // Click App Launcher button
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
        
        // Wait for modal to appear
        await sleep(2000);
        
        // Find and use search input
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
        
        // Clear and search for object
        searchInput.value = '';
        searchInput.value = objectName;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log(`Searched for: ${objectName}`);
        
        // Wait for search results
        await sleep(3000);
        
        // Click on the object
        const objectLinkSelectors = [
            `a[data-label='${objectName}']`,
            `a[title='${objectName}']`,
            `a:contains('${objectName}')`,
            `one-app-launcher-menu-item a[data-label='${objectName}']`
        ];
        
        const objectLink = await findElementFromSelectors(objectLinkSelectors);
        if (!objectLink) {
            // Try fallback - find any link containing the object name
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
        
        // Wait for page to load
        await sleep(5000);
        
        // Now click New button
        await handleNewButton();
        
    } catch (error) {
        console.error('Error in app launcher:', error);
        throw error;
    }
}

/**
 * Handle clicking the New button
 */
async function handleNewButton() {
    try {
        // Look for New button (could be in dropdown or direct)
        const newButtonSelectors = [
            "a[title='New']",
            "button[title='New']",
            ".slds-button[title='New']",
            "lightning-button-menu button[title='New']"
        ];
        
        // First try direct New button
        let newBtn = await findElementFromSelectors(newButtonSelectors, 3000);
        
        if (newBtn) {
            newBtn.click();
            console.log('Clicked direct New button');
            return;
        }
        
        // If no direct button, look for dropdown trigger
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
            
            // Now look for New in dropdown
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

/**
 * Find element using CSS selector or XPath
 */
async function findElement(selector, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        let element;
        
        if (selector.startsWith('//') || selector.startsWith('(')) {
            // XPath selector
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            element = result.singleNodeValue;
        } else {
            // CSS selector
            element = document.querySelector(selector);
        }
        
        if (element) {
            return element;
        }
        
        await sleep(500);
    }
    
    return null;
}

/**
 * Find element from multiple selectors
 */
async function findElementFromSelectors(selectors, timeout = 10000) {
    for (const selector of selectors) {
        const element = await findElement(selector, timeout / selectors.length);
        if (element) {
            return element;
        }
    }
    return null;
}

/**
 * Wait for element to appear
 */
async function waitForElement(selector, timeout = 10000) {
    const element = await findElement(selector, timeout);
    if (!element) {
        throw new Error(`Element not found within timeout: ${selector}`);
    }
    return element;
}

/**
 * Wait for element to be visible
 */
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

/**
 * Wait for page to load
 */
async function waitForPageLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

/**
 * Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
