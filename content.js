// content.js - Content script to execute automation on the current page
console.log('Salesforce automation content script loaded');


console.log('Salesforce automation content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeAutomation') {
        executeAutomationSteps(request.actionPlan)
            .then(result => {
                //sendResponse({ success: true, result: result });
                console.log("Then ");
            })
            .catch(error => {
                console.error('Automation error:', error);
                //sendResponse({ success: false, error: error.message });
            })
            .finally(() => {
                console.log("finally ");
                autoFillRecordForm();
            });
        return true; // Keep message channel open for async response
    }
});


function isOnRecordCreationForm() {
  const url = window.location.href;
  const isNew = url.includes('/lightning/o/') && url.includes('/new');
  const hasFields = document.querySelectorAll('[data-target-selection-name*="sfdc:RecordField."]').length > 0;
  return isNew && hasFields;
}

/**
 * Execute automation steps directly on the current page
 */
async function executeAutomationSteps(actionPlan, startIndex = 0) {
  console.log('Starting automation from step', startIndex+1);

  for (let i = startIndex; i < actionPlan.length; i++) {
    const step = actionPlan[i];
    console.log(`▶️ Step ${i+1}:`, step.action, step.details);

    // Persist state if you still want crash-recovery
    localStorage.setItem('sf_automation_state', JSON.stringify({ actionPlan, currentIndex: i }));

    // 1) perform the step
    await executeStep(step);

    // 2) autofill right after opening a New form
    if ((step.action === 'app_launcher' || step.action === 'navigate') && isOnRecordCreationForm()) {
      await sleep(1500);
      await autoFillRecordForm();
      showToast('Autofill complete, please review and click Save…', 3000);
    }

    // 3) toast for non-manual steps
    if (step.action !== 'waitForUserSave') {
      showToast(`Step ${i+1}: ${step.action} done`, 1500);
    }

    // 4) handle the manual-save pause
    if (step.action === 'waitForUserSave') {
        await autoFillRecordForm();
      // show instruction
      showToast(step.details.message, 3000);
      // WAIT for the user to click Save (in any form context)
      await waitForUserToSave();
      // notify before moving on
      showToast(`Step ${i+1} complete! Moving to next…`, 2000);
      // continue the loop immediately—no return
    }

    // small buffer
    await sleep(800);
  }

  // Cleanup & final toast
  localStorage.removeItem('sf_automation_state');
  showToast('All steps complete 🎉', 3000);
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
        
        case 'waitForUserSave':
            alert(details.message || 'Please click Save, then click OK here to continue.');
            break;

        default:
            console.warn(`Unknown action: ${action}`);
    }
}


/**
 * Wait until the user clicks a “Save” button on the form,
 * then resolve so the automation can resume.
 */
async function waitForUserToSave() {
  return new Promise(resolve => {
    let done = false;
    const saveSelectors = [
      'button[name="SaveEdit"]',
      'button[title="Save"]',
      '.slds-button_brand',
      'lightning-button[data-element-id="saveButton"]'
    ];

    showToast('Click Save to continue…', 3000);

    function attach() {
      saveSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(btn => {
          if (!btn.dataset.sfSaveListener) {
            btn.dataset.sfSaveListener = 'true';
            btn.addEventListener('click', () => {
              if (done) return;
              done = true;
              showToast('Save detected!', 2000);
              setTimeout(resolve, 1000);
            });
          }
        });
      });
    }

    attach();
    const checker = setInterval(attach, 1000);

    // Fallback in 2 minutes
    setTimeout(() => {
      if (!done) {
        done = true;
        clearInterval(checker);
        showToast('No Save detected—continuing.', 2000);
        resolve();
      }
    }, 120000);
  });
}

/**
 * Minimal toast utility (if you don't already have it).
 * Call showToast(msg, durationMs) to display a message.
 */
function showToast(msg, duration = 2000) {
  let t = document.getElementById('sf-autobot-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sf-autobot-toast';
    Object.assign(t.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      borderRadius: '4px',
      fontFamily: 'sans-serif',
      fontSize: '13px',
      zIndex: 99999,
      transition: 'opacity 0.3s'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._hideTimeout);
  t._hideTimeout = setTimeout(() => t.style.opacity = '0', duration);
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


async function autoFillRecordForm() {

    //if (request.action === "extractFields") {
        //Get All Input Elements
        let inputs = document.querySelectorAll('input.slds-input, input, .textarea, .slds-textarea');
        let fieldNames = [];
        let picklistFields = [];
        let picklistFieldWithValues = {};
        let count = 0;
        inputs.forEach(input => {
            count += 1;
            // Walk up the DOM tree to find a parent element with the `data-target-selection-name` attribute
            let parent = input.closest('[data-target-selection-name]');
            let apiField = parent ? parent.getAttribute('data-target-selection-name') : null;
            let name = input.name || input.id;

            if (apiField) {
                // Sanitize the name (strip prefix like "sfdc:RecordField.")
                let apiName = apiField.replace(/^sfdc:RecordField\./, '');
                //Check is a Rich text input
                let type = getSalesforceFieldType(apiName);

                //Skip lookup fields
                if (type === "lookup") {
                    return; // Skip this input
                }


                // Include only non-lookup fields: Check if the API name already exists
                const item = fieldNames.find((field) => field.apiName === apiName);
                //const typeOfInput = getTypeOfPicklistField(apiName);
                if (item) {
                    //console.log('');
                    item.containsMultipleFields = true;
                    fieldNames.push({ 'name': name, 'id': input?.id ?? null, 'apiName': apiName, element: input, "type": type, "containsMultipleFields": true });

                } else {
                    fieldNames.push({ 'name': name, 'id': input?.id ?? null, 'apiName': apiName, element: input, "type": type, "containsMultipleFields": false });
                }
            }
        });
        console.log("Fields ", fieldNames);
        //Get options for picklist fields
        picklistFields = await getAllPicklistOptions();

        //Tranform the picklists
        for (key in picklistFields) {
            let currentVal = getPicklistValue(key);
            //Unsafe code

            const item = fieldNames.find((field) => field.apiName === key);
            //const typeOfInput = getTypeOfPicklistField(apiName);
            if (!item) {
                fieldNames.push({ 'name': key, 'apiName': key, 'options': picklistFields[key]?.options ?? [], 'type': 'picklist' });
                picklistFieldWithValues[key] = currentVal;

            }
        }

        try {
            // When starting fetching
            chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching data from Gemini, please wait..." });
            let data = captureFieldValuesFromUi();
            data = { ...data, ...picklistFieldWithValues };
            //Bring Picklists
            // Step 1: Extract picklist fields and their options

            //Bring data from Gemini AI
            const generatedValues = await fetchGeminiData(fieldNames);
            console.log("Generated values => ", generatedValues);
            //Populate fields on record page
            populateRecordFields(fieldNames, generatedValues, data);
            // After fetching complete
            chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching completed" });


        } catch (error) {
            console.error("[Content Script] ERROR fetching Gemini response:", error);
            // Tell background and UI that fetching failed
            chrome.runtime.sendMessage({ type: "statusUpdate", message: "Fetching Failed: " + error });
        }

        //sendResponse({ status: "success", fields: fieldNames.map(f => f.name) });
    //}

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

    //Iterate on each field
    for (const container of allFields) {
        const childWithClass = container.querySelector('.uiInputSelect.forceInputPicklist');
        const fieldName = container.getAttribute('data-target-selection-name');
        const apiName = fieldName.replace(/^sfdc:RecordField\./, '');
        const comboboxBtn = container.querySelector('button.slds-combobox__input');
        //Extract picklist fields and their options
        if (childWithClass !== null && childWithClass !== undefined && childWithClass) {
            if (!fieldName) continue;

            const hasAnchor = container.querySelector('a.select');
            if (!hasAnchor) continue;

            //console.log(`⏳ Extracting options for: ${fieldName}`);
            const options = await getPicklistOptionsForRecordField(fieldName, "anchor"); // wait for one before the next
            results[apiName] = {
                'options': options
            }
        } else if (comboboxBtn !== null && comboboxBtn) {
            const isRichText = isRichTextInput(apiName);
            if (isRichText) continue;
            if (!fieldName) continue;
            const options = await getPicklistOptionsForRecordField(fieldName, "combobox"); // wait for one before the next
            results[apiName] = {
                'options': options
            }
        }
    }



    //console.log('✅ Final Picklist Options Map:', results);
    return results;
}

function getPicklistOptionsForRecordField(apiFieldName, type) {
    const selector = `[data-target-selection-name="${apiFieldName}"]`;
    const fieldContainer = document.querySelector(selector);
    if (type === "anchor") {
        if (!fieldContainer) return Promise.resolve([]);

        const dropdownAnchor = fieldContainer.querySelector('a.select');
        if (!dropdownAnchor) return Promise.resolve([]);

        // Click the field to open the dropdown
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
                    dropdownAnchor.click(); // close the dropdown
                    resolve(options);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve([]);
                }
            }, 200);
        });
    } else if (type === "combobox") {
        //console.log("Combobox methodd ");


        return new Promise((resolve) => {
            if (!fieldContainer) return resolve([]);
            const picklistButton = fieldContainer.querySelector('button.slds-combobox__input');
            if (!picklistButton) return resolve([]);

            // Open the dropdown
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
                    picklistButton.click(); // close it again
                    resolve(options);
                } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    picklistButton.click(); // just in case
                    resolve([]);
                }
            }, 200);
        });
    }
    return Promise.resolve([]);
}

function getPicklistValue(apiFieldName) {
    //const recordFieldName = ''
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
            //console.log('anchor set picklist value for ', apiFieldName, ' desired valu ', desiredValue);

            const container = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${apiFieldName}"]`);
            if (!container) return reject(`Field ${apiFieldName} not found`);


            const dropdownAnchor = container.querySelector('a.select');

            if (!dropdownAnchor) return reject(`No dropdown anchor found for ${apiFieldName}`);

            // Step 1: Open dropdown
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
            //console.log('combobox set picklist value for ', apiFieldName, ' desired valu ', desiredValue);
            const picklistButton = container.querySelector('button.slds-combobox__input');
            if (!picklistButton) return reject(`No combobox button found for ${apiFieldName}`);
            //Click Button
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
    //For Lookup elements
    const inputElement = container?.querySelector('input') ?? null;
    if (container) {

        const typeDiv = container.querySelector('[class*="uiInput"]');
        const classList = typeDiv?.className ?? '';
        //File type
        const editableDiv = container.querySelector('input[type=file]');
        //Check Datetime
        const lightningDatetimePicker = container.querySelector('lightning-datetimepicker');
        const fieldSetDatetime = container.querySelector('fieldset');
        const fieldSetDtClasses = fieldSetDatetime?.className ?? '';
        //Check Date
        const lightningDatePicker = container.querySelector('lightning-datepicker');
        const datePickerBtn = container.querySelector('a.datePicker-openIcon');
        //Check Time
        const lightningTimePicker = container.querySelector('lightning-timepicker');
        //Check Rich Text Descriptin or File
        if (editableDiv) {
            return 'file';
        }
        //Check Datetime
        if (
            (lightningDatetimePicker !== null && lightningDatetimePicker !== undefined) ||
            (fieldSetDtClasses.includes('uiInputDateTime'))
        ) {
            return 'datetime'
        }
        //Check Time
        else if (lightningTimePicker) {
            return 'time'
        }
        //Check Date
        else if (lightningDatePicker || datePickerBtn) {
            return 'date';
        }

        //Check Lookup
        if (inputElement && inputElement.classList.contains('uiInput--lookup')) {
            return "lookup";
        }
        else if (inputElement && inputElement.classList.contains('slds-combobox__input')) {
            let parent = inputElement.closest('[data-lookup]');
            if(parent !== null) {
                return "lookup";
            }
        }

        else if (classList.includes('uiInputNumber')) {
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
    } else {
        return null;
    }
    return null; // fallback
}


function populateRecordFields(allFieldNames, generatedValues, existingData) {
    let data = existingData;
    let fieldNames = allFieldNames;
    fieldNames.forEach(field => {
        console.log("Field ", field);
        //console.log('CP400 after fetching data ', field);
        if (field?.type === "picklist") {
            //Handle Picklists differently
            setPicklistValue(field?.apiName, generatedValues[field.apiName])
                .then(result => {
                    console.log('CA 104 setPicklist success ');
                })
                .catch(error => {
                    console.log('CA 104 setPicklist error ', error);
                });
        }
        else {
            if (generatedValues[field.apiName] !== undefined && generatedValues[field.apiName] !== null) {
                let value = field?.containsMultipleFields === true ? generatedValues[field?.apiName] : generatedValues[field.apiName];
                let previousValue = data[field.apiName]
                if (typeof value === 'object') {
                    //Handle complex field set like values
                    const section = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field.apiName}"]`);
                    if (!section) {
                        console.warn(`Fieldset not found for ${field.apiName}`);
                        return null;
                    }

                    // Find all input and textarea elements within the fieldset
                    const inputs = section.querySelectorAll('input, textarea');
                    let section_existing_value = {}
                    const values = {};

                    inputs.forEach(input => {
                        let name = input.name;
                        let nameLower = name.toLowerCase();
                        const existingValue = input.value;
                        section_existing_value[nameLower] = existingValue;

                    });
                    //Generated values lower case
                    for (key in value) {
                        let keyLower = key.toLowerCase();
                        value[keyLower] = value[key];
                    }
                    inputs.forEach(input => {
                        let name = input.name;
                        let nameLower = name.toLowerCase();

                        if (nameLower in value) {
                            input.value = value[nameLower];
                            // Simulate user input
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    });


                }
                else {
                    //Handle text, date, numbers, files etc.
                    if (field?.type === "file") {
                        const rtaContainer =  document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field.apiName}"]`);
                        if (rtaContainer) {
                            const editableDiv = rtaContainer.querySelector('.ql-editor');
                            if (editableDiv) {
                                editableDiv.innerHTML = value; //'Your desired <b>rich</b> text content';
                            }
                        }
                    }
                    else {
                        if (previousValue === null || previousValue === undefined || previousValue === '' || previousValue === false) {
                            if (value === true || value === false) {
                                field.element.checked = value;
                            } else {
                                if (field?.type === "date") {
                                    //Handle Dates
                                    const dateContainer = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field?.apiName}"]`);
                                    const datePicker = dateContainer?.querySelector('lightning-datepicker') ?? null;
                                    console.log('Ca date input for api name = ', field?.apiName);
                                    const dateInputElement = document.getElementById(field?.id);


                                    if (datePicker) {
                                         // Format the date based on user locale
                                        const userLocale = navigator.language || 'en-US'; // e.g., 'en-US'
                                        const formattedDate = new Date(value).toLocaleDateString(userLocale);
                                        dateInputElement.focus();
                                        dateInputElement.value = formattedDate;

                                        // Dispatch events to trigger LWC change handlers
                                        dateInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                                        dateInputElement.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                    if (dateInputElement) {
                                        const formattedDate = new Date(value).toISOString().split('T')[0]; // Ensures ISO format
                                        dateInputElement.focus(); // sometimes required to trigger internal formatting
                                        dateInputElement.value = formattedDate;
                                        // Dispatch events
                                        dateInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                                        dateInputElement.dispatchEvent(new Event('change', { bubbles: true }));
                                        //field.element.dispatchEvent(new Event('blur', { bubbles: true }));
                                    }
                                } else if (field?.type === "datetime") {
                                    //Populate Date

                                    //Populate Time
                                } else {
                                    field.element.value = value;
                                    // Simulate user input
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


/**
 * Fetch Gemini Data
 */
async function fetchGeminiData(fieldNames) {
    const API_KEY = "AIzaSyDJmSlrT7qztmzQ_Lov6tL25iWdlyIzHbI";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // Build a prompt that lists each field and its picklist options if available
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



    // Handle compound fields
    for (const [apiName, partsSet] of Object.entries(compoundFieldsMap)) {
        const parts = Array.from(partsSet).join(', ');
        fieldDescriptions.push(`${apiName}: return an object with keys like {${parts}}`);
    }

    // Handle simple fields
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
    //Create Time Options
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

/**
 * Get Time Options
 */
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


/**
 * Capture field values from UI
 */
function captureFieldValuesFromUi() {
    const inputs = document.querySelectorAll('input.slds-input, input, .textarea');
    const data = {};
    inputs.forEach(input => {
        const name = input.name || input.id;
        let value = null;
        // Walk up the DOM tree to find a parent element with the `data-target-selection-name` attribute
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

            // Include only non-lookup fields
            data[apiName] = value;

        }

    });
    return data;
}
