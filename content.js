// ENHANCED: Complete content.js with REAL-TIME PROGRESS UPDATES + Record Type handling + ALL original autofill functionality preserved

console.log('ENHANCED: Complete Salesforce automation with REAL-TIME PROGRESS UPDATES + AI autofill integration and Record Type handling');

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

    // PRESERVED: Original autofill extraction
    if (request.action === "extractFields") {
        handleAutofillExtraction().then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error('ENHANCED: Autofill extraction failed:', error);
            sendResponse({ status: "error", message: error.message });
        });
        return true;
    }
});

/**
 * ENHANCED: Execute automation steps with REAL-TIME PROGRESS UPDATES + Record Type handling + original autofill
 */
async function executeAutomationSteps(steps, originalInstruction) {
    console.log('🚀 ENHANCED: Executing automation steps with REAL-TIME PROGRESS UPDATES:', steps.length, 'steps');
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
        showToast(`🚀 ENHANCED: Starting automation: ${steps.length} steps`);
        
        await executeStepsSequentiallyWithProgress();
        
        // Send completion message to popup
        sendProgressUpdate('AUTOMATION_COMPLETE', {});
        
        showToast('✅ ENHANCED: Automation completed successfully!', 3000);
        
    } catch (error) {
        console.error('❌ ENHANCED: Automation failed:', error);
        sendProgressUpdate('STEP_ERROR', {
            stepIndex: currentStepIndex,
            error: error.message
        });
        showToast(`❌ ENHANCED: Automation failed: ${error.message}`, 3000);
    } finally {
        isExecuting = false;
        currentSteps = [];
        currentStepIndex = 0;
        isWaitingForRecordType = false;
    }
}

/**
 * ENHANCED: Execute steps sequentially with REAL-TIME progress updates
 */
async function executeStepsSequentiallyWithProgress() {
    for (currentStepIndex = 0; currentStepIndex < currentSteps.length; currentStepIndex++) {
        const step = currentSteps[currentStepIndex];
        console.log(`⚡ ENHANCED: Executing step ${currentStepIndex+1}/${currentSteps.length}:`, step);
        
        // Send "step started" update to popup
        sendProgressUpdate('STEP_PROGRESS', {
            stepIndex: currentStepIndex,
            stepDescription: step.description || step.action,
            status: 'started'
        });
        
        showToast(`ENHANCED Step ${currentStepIndex+1}/${currentSteps.length}: ${step.description || step.action}`, 2000);
        
        try {
            await executeStepMerged(step);
            
            // Send "step completed" update to popup
            sendProgressUpdate('STEP_PROGRESS', {
                stepIndex: currentStepIndex,
                stepDescription: step.description || step.action,
                status: 'completed'
            });
            
            await sleep(step.delay || 1000);
            
        } catch (stepError) {
            console.error(`❌ ENHANCED Step ${currentStepIndex+1} failed:`, stepError);
            
            // Send error update to popup
            sendProgressUpdate('STEP_ERROR', {
                stepIndex: currentStepIndex,
                error: stepError.message
            });
            
            showToast(`❌ ENHANCED Step ${currentStepIndex+1} failed: ${stepError.message}`, 4000);
            
            if (!stepError.message.includes('critical')) {
                continue;
            }
            break;
        }
    }
}

/**
 * NEW: Send progress updates to popup
 */
function sendProgressUpdate(type, data) {
    try {
        chrome.runtime.sendMessage({
            type: type,
            data: data
        });
        console.log(`📡 ENHANCED: Sent progress update - ${type}:`, data);
    } catch (error) {
        console.warn('Failed to send progress update:', error);
    }
}

/**
 * PRESERVED: Original executeStepMerged with Record Type enhancements
 */
async function executeStepMerged(step) {
    console.log('🔥 ENHANCED: Executing step:', step.action);
    
    switch (step.action) {
        case 'navigate_app_launcher':
            console.log('🔥 ENHANCED: Navigating to App Launcher for:', step.objectName);
            await navigateViaAppLauncherMerged(step.objectName);
            break;
            
        case 'click':
            console.log('🔥 ENHANCED: Clicking:', step.selector);
            await safeClick(step.selector, step.description);
            break;
            
        case 'type':
            console.log('🔥 ENHANCED: Typing:', step.value);
            await safeType(step.selector, step.value, step.description);
            break;
            
        case 'select':
            console.log('🔥 ENHANCED: Selecting:', step.value);
            await safeSelect(step.selector, step.value, step.description);
            break;
            
        case 'wait':
            console.log('🔥 ENHANCED: Waiting:', step.duration);
            await sleep(step.duration || 1000);
            break;
            
        case 'wait_for_element':
            console.log('🔥 ENHANCED: Waiting for element:', step.selector);
            await waitForElement(step.selector, step.timeout || 10000);
            break;
            
        case 'toast':
            console.log('🔥 ENHANCED: Showing toast:', step.message);
            showToast(step.message, step.duration || 2000);
            break;
            
        case 'fill_form':
            console.log('🔥 ENHANCED: Filling form with AI autofill');
            await fillFormWithAIAutofillMerged(step.fields);
            break;
            
        case 'wait_for_save':
            console.log('🔥 ENHANCED: Waiting for save with auto-save:', step.autoSave);
            await waitForUserToSaveEnhanced(step.message, step.autoSave !== false);
            break;
            
        case 'capture_record_id':
            console.log('🔥 ENHANCED: Capturing record ID for:', step.variable);
            await captureRecordIdMerged(step.variable);
            break;
            
        case 'navigate_to_related_tab':
            console.log('🔥 ENHANCED: Navigating to Related tab');
            await navigateToRelatedTabMerged();
            break;
            
        case 'click_related_list_new':
            console.log('🔥 ENHANCED: Clicking New in related list:', step.relatedListName, 'for object:', step.targetObject);
            await clickRelatedListNewMerged(step.relatedListName, step.targetObject, step.parentRecordVariable);
            break;
            
        case 'fill_related_form':
            console.log('🔥 ENHANCED: Filling related form for:', step.objectType);
            await fillRelatedFormWithAIMerged(step.objectType, step.originalInstruction);
            break;
            
        default:
            console.warn('❌ ENHANCED: Unknown step action:', step.action);
    }
}

/**
 * PRESERVED: Original fillFormWithAIAutofillMerged - COMPLETE with all original functionality
 */
async function fillFormWithAIAutofillMerged(predefinedFields = []) {
    console.log('🤖 === ENHANCED AI AUTOFILL INTEGRATION (PRESERVED ORIGINAL) ===');
    
    showToast('🤖 ENHANCED: Starting AI autofill...', 3000);
    updateStatus('ENHANCED: Analyzing form fields...');
    
    await sleep(3000);
    
    try {
        console.log('📋 ENHANCED: Extracting form fields...');
        const fieldData = await extractFormFieldsMerged();
        
        if (fieldData.fields.length === 0) {
            console.log('⚠️ ENHANCED: No fields found - using predefined fields');
            if (predefinedFields.length > 0) {
                await fillFormIntelligentlyFixed(predefinedFields);
                return;
            }
            throw new Error('No form fields found');
        }
        
        console.log(`📊 ENHANCED: Found ${fieldData.fields.length} fields to fill`);
        showToast(`📊 ENHANCED: Analyzing ${fieldData.fields.length} fields...`, 3000);
        
        updateStatus('ENHANCED: Getting AI suggestions...');
        console.log('🧠 ENHANCED: Fetching AI suggestions...');
        
        const aiSuggestions = await fetchGeminiDataMerged(fieldData.fields);
        console.log('✅ ENHANCED: AI suggestions received:', Object.keys(aiSuggestions).length, 'values');
        
        updateStatus('ENHANCED: Filling form fields...');
        showToast('🤖 ENHANCED: AI filling form fields...', 5000);
        
        await populateRecordFieldsMerged(fieldData.fields, aiSuggestions, fieldData.currentValues);
        
        console.log('⏳ ENHANCED: Waiting for all fields to be populated...');
        showToast('⏳ ENHANCED: Waiting for field population...', 3000);
        await sleep(5000);
        
        const verifyAttempts = 3;
        for (let i = 0; i < verifyAttempts; i++) {
            const populatedCount = await countPopulatedFieldsMerged();
            console.log(`🔍 ENHANCED: Verification ${i+1}/${verifyAttempts}: ${populatedCount} fields populated`);
            
            if (populatedCount >= fieldData.fields.length * 0.8) {
                console.log('✅ ENHANCED: Field population verified!');
                break;
            }
            
            if (i < verifyAttempts - 1) {
                console.log('⏳ ENHANCED: Waiting for more fields...');
                await sleep(2000);
            }
        }
        
        console.log('⏰ ENHANCED: Final 10-second wait before continuing...');
        showToast('⏰ ENHANCED: Waiting 10 seconds before continuing...', 10000);
        await sleep(10000);
        
        updateStatus('ENHANCED: Autofill completed successfully!');
        showToast('✅ ENHANCED: AI autofill completed!', 3000);
        
    } catch (error) {
        console.error('❌ ENHANCED: AI autofill failed:', error);
        updateStatus(`ENHANCED: Autofill failed: ${error.message}`);
        showToast(`❌ ENHANCED: AI autofill failed: ${error.message}`, 5000);
        
        if (predefinedFields && predefinedFields.length > 0) {
            console.log('🔄 ENHANCED: Falling back to predefined fields...');
            showToast('🔄 ENHANCED: Using fallback field values...', 3000);
            await fillFormIntelligentlyFixed(predefinedFields);
        }
    }
}

/**
 * PRESERVED: Original extractFormFieldsMerged - COMPLETE
 */
async function extractFormFieldsMerged() {
    console.log('📋 ENHANCED: Extracting form fields...');
    
    let inputs = document.querySelectorAll('input.slds-input, input, .textarea, .slds-textarea');
    let fieldNames = [];
    let currentValues = {};
    
    inputs.forEach(input => {
        let parent = input.closest('[data-target-selection-name]');
        let apiField = parent ? parent.getAttribute('data-target-selection-name') : null;
        
        if (apiField) {
            let apiName = apiField.replace(/^sfdc:RecordField\./, '');
            let type = getSalesforceFieldTypeMerged(apiName);
            
            if (type === "lookup") {
                return;
            }
            
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
    
    const picklistFields = await getAllPicklistOptionsMerged();
    
    for (let key in picklistFields) {
        let currentVal = getPicklistValueMerged(key);
        
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
    
    console.log(`✅ ENHANCED: Extracted ${fieldNames.length} fields`);
    return {
        fields: fieldNames,
        currentValues: currentValues
    };
}

/**
 * PRESERVED: Original fetchGeminiDataMerged - COMPLETE
 */
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

    const userMessage = `Generate realistic Salesforce field values for:
${fieldDescriptions.join('\n')}

Requirements:
- Return as JSON object with field API names as keys
- For picklist fields, only use provided options (not '--None--')
- For date fields, use format: DD/MM/YYYY (with slashes only, not hyphens)
- For datetime fields, return object: {date: "31/12/2025", time: "2:00 AM"} (use DD/MM/YYYY format with slashes only)
- For time fields, use options: ${timeOptions.slice(0, 10).join(', ')}...
- For number fields (like currency or int), keep values within the specified range
- Use unique, non-generic values (avoid "Test", "Acme", etc.)
- Return only valid JSON, no explanation

Example format:
{
  "Name": "Visionary Dynamics 9382",
  "Email": "sales9382@visionarytech.com",
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
        console.log('🌐 ENHANCED: Calling Gemini API...');
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

        // 🔁 ENHANCED: Make key fields unique
        const randomSuffix = `${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        if (parsedData.Name) {
            parsedData.Name += ` ${randomSuffix}`;
        }
        if (parsedData.Email && parsedData.Email.includes('@')) {
            const [local, domain] = parsedData.Email.split('@');
            parsedData.Email = `${local.replace(/\W/g, '')}${randomSuffix}@${domain}`;
        }
        if (parsedData.Phone) {
            parsedData.Phone = parsedData.Phone.replace(/\D/g, '').slice(0, 7) + randomSuffix;
        }

        // ✅ AI Validation: fix date formats and number ranges
        for (const field of fieldNames) {
            const value = parsedData[field.apiName];

            // Fix date format: MM-DD-YYYY ➜ DD/MM/YYYY
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

/**
 * PRESERVED: Original populateRecordFieldsMerged - COMPLETE
 */
async function populateRecordFieldsMerged(allFieldNames, generatedValues, existingData) {
    console.log('📝 ENHANCED: Populating fields with AI data...');
    
    const totalFields = allFieldNames.length;
    let processedFields = 0;
    
    for (const field of allFieldNames) {
        try {
            processedFields++;
            console.log(`📝 ENHANCED: Processing field ${processedFields}/${totalFields}: ${field.apiName}`);
            
            showToast(`📝 ENHANCED: Filling ${field.apiName} (${processedFields}/${totalFields})`, 1500);
            
            if (field?.type === "picklist") {
                if (generatedValues[field.apiName] !== undefined) {
                    await setPicklistValueMerged(field?.apiName, generatedValues[field.apiName]);
                    console.log(`✅ ENHANCED: Set picklist ${field.apiName} = ${generatedValues[field.apiName]}`);
                }
            } else {
                if (generatedValues[field.apiName] !== undefined && generatedValues[field.apiName] !== null) {
                    await fillFieldWithValueMerged(field, generatedValues[field.apiName], existingData);
                }
            }
            
            await sleep(300);
            
        } catch (error) {
            console.warn(`⚠️ ENHANCED: Failed to fill field ${field.apiName}:`, error);
        }
    }
    
    console.log(`✅ ENHANCED: Field population completed (${processedFields}/${totalFields})`);
}

/**
 * PRESERVED: Original fillFieldWithValueMerged - COMPLETE
 */
async function fillFieldWithValueMerged(field, value, existingData) {
    const previousValue = existingData[field.apiName];
    
    if (previousValue && previousValue !== '' && previousValue !== false) {
        console.log(`⏭️ ENHANCED: Skipping ${field.apiName} - already has value: ${previousValue}`);
        return;
    }
    
    if (typeof value === 'object') {
        await fillComplexFieldMerged(field, value);
    } else {
        await fillSimpleFieldMerged(field, value);
    }
}

/**
 * PRESERVED: Original fillSimpleFieldMerged - COMPLETE
 */
async function fillSimpleFieldMerged(field, value) {
    try {
        if (field?.type === "file") {
            const rtaContainer = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field.apiName}"]`);
            if (rtaContainer) {
                const editableDiv = rtaContainer.querySelector('.ql-editor');
                if (editableDiv) {
                    editableDiv.innerHTML = value;
                }
            }
        } else if (field?.type === "date") {
            await fillDateFieldMerged(field, value);
        } else if (field?.type === "datetime") {
            await fillDateTimeFieldMerged(field, value);
        } else {
            if (field.element) {
                if (typeof value === 'boolean') {
                    field.element.checked = value;
                } else {
                    field.element.focus();
                    field.element.value = value;
                    
                    field.element.dispatchEvent(new Event('input', { bubbles: true }));
                    field.element.dispatchEvent(new Event('change', { bubbles: true }));
                    field.element.dispatchEvent(new Event('blur', { bubbles: true }));
                }
                
                console.log(`✅ ENHANCED: Filled ${field.apiName} = ${value}`);
            }
        }
    } catch (error) {
        console.warn(`⚠️ ENHANCED: Error filling ${field.apiName}:`, error);
    }
}

/**
 * PRESERVED: Original fillDateFieldMerged - COMPLETE
 */
async function fillDateFieldMerged(field, value) {
    const dateContainer = document.querySelector(`[data-target-selection-name="sfdc:RecordField.${field?.apiName}"]`);
    const dateInputElement = document.getElementById(field?.id);
    
    if (dateInputElement) {
        try {
            const formattedDate = new Date(value).toISOString().split('T')[0];
            
            dateInputElement.focus();
            dateInputElement.value = formattedDate;
            
            dateInputElement.dispatchEvent(new Event('input', { bubbles: true }));
            dateInputElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log(`✅ ENHANCED: Filled date ${field.apiName} = ${formattedDate}`);
        } catch (error) {
            console.warn(`⚠️ ENHANCED: Date formatting error for ${field.apiName}:`, error);
        }
    }
}

/**
 * PRESERVED: Original fillComplexFieldMerged placeholder
 */
async function fillComplexFieldMerged(field, value) {
    // Handle complex field types (datetime, etc.)
    console.log(`📝 ENHANCED: Filling complex field ${field.apiName} with:`, value);
}

/**
 * PRESERVED: Original fillDateTimeFieldMerged placeholder
 */
async function fillDateTimeFieldMerged(field, value) {
    console.log(`📅 ENHANCED: Filling datetime field ${field.apiName} with:`, value);
}

/**
 * PRESERVED: Original countPopulatedFieldsMerged - COMPLETE
 */
async function countPopulatedFieldsMerged() {
    const inputs = document.querySelectorAll('input.slds-input, input, .textarea, .slds-textarea');
    let populatedCount = 0;
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            populatedCount++;
        }
    });
    
    return populatedCount;
}

/**
 * PRESERVED: Original getSalesforceFieldTypeMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original getAllPicklistOptionsMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original getPicklistOptionsForFieldMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original setPicklistValueMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original getTypeOfPicklistFieldMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original getPicklistValueMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original isRichTextInputMerged - COMPLETE
 */
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

/**
 * PRESERVED: Original getTimeOptionsMerged - COMPLETE
 */
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

/**
 * ENHANCED: Navigate via App Launcher with Record Type handling
 */
async function navigateViaAppLauncherMerged(objectName) {
    console.log('🔍 ENHANCED: Navigating to', objectName, 'via App Launcher with Record Type support');
    
    try {
        const appLauncherSelectors = [
            "button[title='App Launcher']",
            ".slds-icon-waffle_container button",
            "button[aria-label='App Launcher']"
        ];
        
        let appLauncherBtn = null;
        for (const selector of appLauncherSelectors) {
            appLauncherBtn = document.querySelector(selector);
            if (appLauncherBtn && isElementVisible(appLauncherBtn)) {
                console.log(`✅ ENHANCED: Found App Launcher: ${selector}`);
                break;
            }
        }
        
        if (!appLauncherBtn) {
            throw new Error('ENHANCED: App Launcher button not found');
        }
        
        appLauncherBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        appLauncherBtn.click();
        console.log('✅ ENHANCED: Clicked App Launcher');
        await sleep(3000);
        
        const searchSelectors = [
            "input[placeholder*='Search apps']",
            "input[placeholder*='Search']",
            "input[type='search']"
        ];
        
        let searchInput = null;
        for (const selector of searchSelectors) {
            searchInput = document.querySelector(selector);
            if (searchInput && isElementVisible(searchInput)) {
                console.log(`✅ ENHANCED: Found search input: ${selector}`);
                break;
            }
        }
        
        if (!searchInput) {
            throw new Error('ENHANCED: Search input not found');
        }
        
        searchInput.focus();
        searchInput.value = '';
        searchInput.value = objectName;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        
        console.log(`✅ ENHANCED: Searched for: ${objectName}`);
        await sleep(3000);
        
        const objectLink = await findObjectLinkMerged(objectName);
        if (!objectLink) {
            throw new Error(`ENHANCED: ${objectName} link not found`);
        }
        
        objectLink.click();
        console.log(`✅ ENHANCED: Clicked ${objectName} link`);
        await sleep(4000);
        
        // ENHANCED: Handle New button with Record Type detection
        await handleNewButtonWithRecordType();
        
    } catch (error) {
        console.error('❌ ENHANCED: App Launcher navigation failed:', error);
        throw error;
    }
}

/**
 * NEW: Handle New button with Record Type detection
 */
async function handleNewButtonWithRecordType() {
    console.log('🔍 === ENHANCED NEW BUTTON WITH RECORD TYPE DETECTION ===');
    
    await sleep(3000);
    
    const directSelectors = [
        "a[title='New']",
        "button[title='New']",
        ".slds-button[title='New']",
        "lightning-button[title='New']"
    ];
    
    let newButtonClicked = false;
    
    for (const selector of directSelectors) {
        const button = document.querySelector(selector);
        if (button && isElementVisible(button)) {
            console.log(`✅ ENHANCED: Found direct New button: ${selector}`);
            button.click();
            newButtonClicked = true;
            break;
        }
    }
    
    if (!newButtonClicked) {
        const dropdownTriggers = document.querySelectorAll("lightning-button-menu button, button[aria-haspopup='true']");
        for (const trigger of dropdownTriggers) {
            if (isElementVisible(trigger)) {
                console.log(`✅ ENHANCED: Found dropdown trigger`);
                trigger.click();
                await sleep(1500);
                
                const dropdownNew = document.querySelector("a[title='New'][role='menuitem']");
                if (dropdownNew && isElementVisible(dropdownNew)) {
                    dropdownNew.click();
                    newButtonClicked = true;
                    break;
                }
            }
        }
    }
    
    if (!newButtonClicked) {
        throw new Error('ENHANCED: New button not found');
    }
    
    // NEW: Wait and check for Record Type modal
    await sleep(3000);
    await checkAndHandleRecordTypeModal();
}

/**
 * NEW: Check and handle Record Type modal
 */
async function checkAndHandleRecordTypeModal() {
    console.log('📋 === ENHANCED RECORD TYPE MODAL DETECTION ===');
    
    const recordTypeModalSelectors = [
        '.slds-modal[aria-labelledby*="recordType"]',
        '.slds-modal[aria-labelledby*="Record Type"]',
        '.forceRecordTypeSelectionModal',
        '[data-aura-class*="forceRecordTypeSelection"]',
        '.modal-container .recordTypeSelection',
        '.slds-modal .recordTypeOptions'
    ];
    
    let recordTypeModal = null;
    
    for (const selector of recordTypeModalSelectors) {
        try {
            recordTypeModal = document.querySelector(selector);
            if (recordTypeModal && isElementVisible(recordTypeModal)) {
                console.log(`✅ ENHANCED: Found Record Type modal: ${selector}`);
                break;
            }
        } catch (error) {
            continue;
        }
    }
    
    if (!recordTypeModal) {
        const allModals = document.querySelectorAll('.slds-modal, .modal, [role="dialog"]');
        for (const modal of allModals) {
            if (isElementVisible(modal)) {
                const modalText = modal.textContent.toLowerCase();
                if (modalText.includes('record type') || modalText.includes('select a record type')) {
                    console.log('✅ ENHANCED: Found Record Type modal by text content');
                    recordTypeModal = modal;
                    break;
                }
            }
        }
    }
    
    if (recordTypeModal) {
        console.log('🎯 ENHANCED: Record Type modal detected - waiting for user interaction');
        await handleRecordTypeSelection(recordTypeModal);
    } else {
        console.log('✅ ENHANCED: No Record Type modal - proceeding to form');
    }
}

/**
 * NEW: Handle Record Type selection and wait for user interaction
 */
async function handleRecordTypeSelection(modal) {
    console.log('⏳ === ENHANCED RECORD TYPE SELECTION HANDLER ===');

    isWaitingForRecordType = true;

    showToast('📋 ENHANCED: Record Type detected!\n\n1. Select your Record Type\n2. Click "Next" to continue\n3. Click "Cancel" to stop', 8000);

    highlightRecordTypeModal(modal);

    return new Promise((resolve, reject) => {
        let resolved = false;

        const nextButtonSelectors = [
            'button[title="Next"]',
            'button[name="next"]',
            'lightning-button[title="Next"]',
            'input[value="Next"]'
        ];

        const cancelButtonSelectors = [
            'button[title="Cancel"]',
            'button[name="cancel"]',
            'lightning-button[title="Cancel"]',
            'input[value="Cancel"]'
        ];

        // Reduced timeout to 60 seconds
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkInterval);
                isWaitingForRecordType = false;
                console.log('⚠️ ENHANCED: Record Type selection timeout - continuing anyway');
                showToast('⚠️ ENHANCED: Timeout - continuing automation...', 3000);
                resolve();
            }
        }, 60000); // Reduced from 120000 (2 minutes) to 60000 (1 minute)

        const checkInterval = setInterval(() => {
            if (resolved) return;

            // ENHANCED: Check for Next button clicks with IMMEDIATE continuation
            for (const selector of nextButtonSelectors) {
                const nextBtn = modal.querySelector(selector) || document.querySelector(selector);
                if (nextBtn && isElementVisible(nextBtn)) {
                    if (!nextBtn.hasAttribute('data-enhanced-listener')) {
                        nextBtn.setAttribute('data-enhanced-listener', 'true');
                        nextBtn.addEventListener('click', () => {
                            if (!resolved) {
                                resolved = true;
                                clearInterval(checkInterval);
                                clearTimeout(timeoutId);
                                isWaitingForRecordType = false;

                                console.log('✅ ENHANCED: Next button clicked - IMMEDIATELY resuming automation');
                                showToast('✅ ENHANCED: Record Type selected - continuing NOW...', 2000);
                                
                                // CRITICAL FIX: Resolve immediately without any delay
                                resolve();
                            }
                        });
                    }
                }
            }

            // ENHANCED: Check for Cancel button clicks
            for (const selector of cancelButtonSelectors) {
                const cancelBtn = modal.querySelector(selector) || document.querySelector(selector);
                if (cancelBtn && isElementVisible(cancelBtn)) {
                    if (!cancelBtn.hasAttribute('data-enhanced-listener')) {
                        cancelBtn.setAttribute('data-enhanced-listener', 'true');
                        cancelBtn.addEventListener('click', () => {
                            if (!resolved) {
                                resolved = true;
                                clearInterval(checkInterval);
                                clearTimeout(timeoutId);
                                isWaitingForRecordType = false;
                                isExecuting = false;
                                console.log('❌ ENHANCED: Cancel button clicked - stopping automation');
                                showToast('❌ ENHANCED: Automation cancelled by user', 3000);
                                reject(new Error('User cancelled automation at Record Type selection'));
                            }
                        });
                    }
                }
            }

            // FALLBACK: If modal disappears naturally (but with shorter delay)
            if (!isElementVisible(modal) || !document.contains(modal)) {
                resolved = true;
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                isWaitingForRecordType = false;
                console.log('✅ ENHANCED: Record Type modal closed - resuming automation');
                showToast('✅ ENHANCED: Record Type selected - continuing automation...', 3000);
                
                // REDUCED DELAY: From 2000ms to 500ms for modal disappearance
                setTimeout(resolve, 500);
                return;
            }
        }, 250); // Check more frequently (every 250ms instead of 500ms)
    });
}




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

/**
 * PRESERVED: Original navigateToRelatedTabMerged - COMPLETE
 */
async function navigateToRelatedTabMerged() {
    console.log('🔗 === ENHANCED RELATED TAB NAVIGATION ===');
    
    await sleep(2000);
    
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
    
    for (const selector of relatedTabSelectors) {
        try {
            relatedTab = document.querySelector(selector);
            if (relatedTab && isElementVisible(relatedTab)) {
                console.log(`✅ ENHANCED: Found Related tab: ${selector}`);
                break;
            }
        } catch (error) {
            continue;
        }
    }
    
    if (!relatedTab) {
        const allTabs = document.querySelectorAll('a[role="tab"], lightning-tab a, .slds-tabs_default__item a');
        
        for (const tab of allTabs) {
            const text = tab.textContent.trim().toLowerCase();
            if (text === 'related' && isElementVisible(tab)) {
                console.log('✅ ENHANCED: Found Related tab by text');
                relatedTab = tab;
                break;
            }
        }
    }
    
    if (!relatedTab) {
        console.log('⚠️ ENHANCED: Related tab not found - may already be active');
        showToast('⚠️ ENHANCED: Related tab not found - continuing', 3000);
        return;
    }
    
    try {
        const isActive = relatedTab.getAttribute('aria-selected') === 'true' ||
                         relatedTab.classList.contains('slds-is-active') ||
                         relatedTab.parentElement?.classList.contains('slds-is-active');
        
        if (isActive) {
            console.log('✅ ENHANCED: Related tab already active');
            showToast('✅ ENHANCED: Already on Related tab', 2000);
            return;
        }
        
        relatedTab.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);
        
        const originalBorder = relatedTab.style.border;
        relatedTab.style.border = '3px solid red';
        await sleep(1000);
        relatedTab.style.border = originalBorder;
        
        relatedTab.click();
        console.log('✅ ENHANCED: Clicked Related tab');
        showToast('✅ ENHANCED: Switched to Related tab', 2000);
        
        await sleep(3000);
        
    } catch (error) {
        console.error('❌ ENHANCED: Error clicking Related tab:', error);
        try {
            relatedTab.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await sleep(3000);
        } catch (altError) {
            console.error('❌ ENHANCED: Alternative click failed:', altError);
        }
    }
}

/**
 * ENHANCED: Click Related List New with Record Type support
 */
async function clickRelatedListNewMerged(relatedListName, targetObject, parentRecordVariable) {
    console.log(`🆕 === ENHANCED RELATED LIST NEW WITH RECORD TYPE SUPPORT ===`);
    console.log(`ENHANCED: Target List: ${relatedListName}`);
    console.log(`ENHANCED: Target Object: ${targetObject}`);
    console.log(`ENHANCED: Parent Variable: ${parentRecordVariable}`);
    
    await sleep(4000);
    
    const strategies = [
        {
            name: "ENHANCED: Exact Related List Section Match",
            method: () => findExactRelatedListSectionMerged(relatedListName, targetObject)
        },
        {
            name: "ENHANCED: Header-Based Section Detection",
            method: () => findByHeaderTextMerged(relatedListName, targetObject)
        },
        {
            name: "ENHANCED: Quick Links Precise Match",
            method: () => findInQuickLinksMerged(relatedListName, targetObject)
        },
        {
            name: "ENHANCED: Card Content Analysis",
            method: () => findByCardContentMerged(relatedListName, targetObject)
        },
        {
            name: "ENHANCED: Fallback New Button",
            method: () => tryAnyNewButtonMerged(targetObject)
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`🔧 ENHANCED Strategy ${i + 1}: ${strategy.name}`);
        
        try {
            const success = await strategy.method();
            if (success) {
                console.log(`✅ ENHANCED Strategy ${i + 1} successful for ${targetObject}!`);
                showToast(`✅ ENHANCED: ${targetObject} New button found`, 3000);
                
                // ENHANCED: Check for Record Type modal after clicking New
                await sleep(3000);
                await checkAndHandleRecordTypeModal();
                return true;
            }
        } catch (error) {
            console.warn(`ENHANCED Strategy ${i + 1} failed:`, error);
        }
    }
    
    console.error(`❌ ENHANCED: All strategies failed for ${targetObject}`);
    showToast(`⚠️ ENHANCED: ${targetObject} New button not found - please click manually`, 5000);
    return false;
}

/**
 * PRESERVED: All original related list finding functions
 */
async function findExactRelatedListSectionMerged(relatedListName, targetObject) {
    console.log(`🔍 ENHANCED: Exact section search for ${targetObject} in ${relatedListName}`);

    const cardSelectors = [
        '.slds-card',
        'article.slds-card',
        '[data-aura-class*="relatedList"]',
        '.forceRelatedListSingleContainer',
        '.related-list-container',
        '[data-component-id*="relatedList"]'
    ];

    const allCards = document.querySelectorAll(cardSelectors.join(', '));
    console.log(`ENHANCED: Found ${allCards.length} potential cards`);

    for (const card of allCards) {
        const header = card.querySelector('.slds-card__header, .slds-card__header-title, h2, h3, h4');
        if (!header) continue;

        const headerText = header.textContent.trim();

        if (headerText.startsWith(relatedListName)) {
            console.log(`✅ ENHANCED: Matched card header "${headerText}" with related list "${relatedListName}"`);

            const newButton = card.querySelector('button, a[title="New"]');
            if (newButton) {
                console.log(`✅ ENHANCED: Clicking "New" button inside correct card for "${relatedListName}"`);
                newButton.click();
                return true;
            }
        }
    }

    console.log(`❌ ENHANCED: No exact section found for "${relatedListName}"`);
    return false;
}

async function findByHeaderTextMerged(relatedListName, targetObject) {
    console.log(`🔍 ENHANCED: Header-based search for ${targetObject}`);

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
                console.log(`✅ ENHANCED: Found header matching "${relatedListName}"`);

                const section = header.closest('.slds-card') || 
                                header.closest('article') ||
                                header.closest('[data-aura-class*="relatedList"]');

                if (section) {
                    const newButton = section.querySelector('button, a[title="New"]');
                    if (newButton) {
                        console.log(`✅ ENHANCED: Clicking "New" button in section "${relatedListName}"`);
                        newButton.click();
                        return true;
                    }
                }
            }
        }
    }

    console.log(`❌ ENHANCED: No header match found for ${relatedListName}`);
    return false;
}

async function findInQuickLinksMerged(relatedListName, targetObject) {
    console.log(`🔍 ENHANCED: Quick Links search for ${targetObject}`);
    
    const quickLinksSelectors = [
        '.relatedListQuickLinks',
        '[data-aura-class*="relatedListQuickLinks"]',
        '.slds-card__body .slds-grid'
    ];
    
    let quickLinksSection = null;
    for (const selector of quickLinksSelectors) {
        quickLinksSection = document.querySelector(selector);
        if (quickLinksSection) {
            console.log(`✅ ENHANCED: Found Quick Links: ${selector}`);
            break;
        }
    }
    
    if (!quickLinksSection) {
        console.log('❌ ENHANCED: No Quick Links section found');
        return false;
    }
    
    const allLinks = quickLinksSection.querySelectorAll('a, span[role="button"], div[role="button"]');
    
    for (const link of allLinks) {
        const linkText = link.textContent.trim().toLowerCase();
        
        if (linkText.includes(targetObject.toLowerCase()) || linkText.includes(relatedListName.toLowerCase())) {
            console.log(`✅ ENHANCED: Found Quick Link match "${linkText}"`);
            
            link.click();
            await sleep(4000);
            
            const newBtn = document.querySelector('button[title="New"], a[title="New"]');
            if (newBtn && isElementVisible(newBtn)) {
                newBtn.click();
                return true;
            }
        }
    }
    
    console.log(`❌ ENHANCED: No Quick Link found for ${targetObject}`);
    return false;
}

async function findByCardContentMerged(relatedListName, targetObject) {
    console.log(`🔍 ENHANCED: Card content analysis for ${targetObject}`);
    
    const allCards = document.querySelectorAll('.slds-card, article.slds-card');
    
    for (const card of allCards) {
        const cardText = card.textContent.toLowerCase();
        
        if (cardText.includes(relatedListName.toLowerCase()) || cardText.includes(targetObject.toLowerCase())) {
            console.log(`✅ ENHANCED: Found card with content match for ${targetObject}`);
            
            const newButton = card.querySelector('button[title="New"], a[title="New"]');
            if (newButton && isElementVisible(newButton)) {
                console.log(`✅ ENHANCED: Clicking New button in matched card`);
                newButton.click();
                return true;
            }
        }
    }
    
    console.log(`❌ ENHANCED: No card content match for ${targetObject}`);
    return false;
}

async function tryAnyNewButtonMerged(targetObject) {
    console.log(`🔍 ENHANCED: Fallback - looking for any New button for ${targetObject}`);
    
    const allNewButtons = document.querySelectorAll('button[title="New"], a[title="New"]');
    const visibleButtons = Array.from(allNewButtons).filter(btn => isElementVisible(btn));
    
    console.log(`ENHANCED: Found ${visibleButtons.length} visible New buttons`);
    
    if (visibleButtons.length > 0) {
        console.log(`✅ ENHANCED: Using first available New button for ${targetObject}`);
        visibleButtons[0].click();
        return true;
    }
    
    return false;
}

/**
 * PRESERVED: Original findObjectLinkMerged - COMPLETE
 */
async function findObjectLinkMerged(objectName) {
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
            console.log(`✅ ENHANCED: Found ${objectName} link`);
            return link;
        }
    }
    
    return null;
}

/**
 * PRESERVED: Original fillRelatedFormWithAIMerged - COMPLETE
 */
async function fillRelatedFormWithAIMerged(objectType, originalInstruction) {
    console.log(`📝 === ENHANCED FILLING ${objectType} RELATED FORM WITH AI ===`);
    console.log('ENHANCED: Original instruction:', originalInstruction);
    
    await sleep(4000);
    
    try {
        await fillFormWithAIAutofillMerged([]);
        
        showToast(`✅ ENHANCED: ${objectType} form filled with AI!\n\nAuto-linked to parent record.\nPlease review and save.`, 5000);
        
    } catch (error) {
        console.error(`❌ ENHANCED: AI fill failed for ${objectType}:`, error);
        
        const formFields = getFormFieldsForObjectTypeMerged(objectType, originalInstruction);
        
        if (formFields.length === 0) {
            console.log(`⚠️ ENHANCED: No predefined fields for ${objectType} - form opened for manual entry`);
            showToast(`✅ ENHANCED: ${objectType} form opened\n\nAuto-linked to parent record.\nPlease fill manually.`, 5000);
            return;
        }
        
        console.log(`📝 ENHANCED: Filling ${formFields.length} predefined fields for ${objectType}`);
        await fillFormIntelligentlyFixed(formFields);
        
        showToast(`✅ ENHANCED: ${objectType} form filled!\n\nAuto-linked to parent record.\nPlease review and save.`, 5000);
    }
}

/**
 * PRESERVED: Original getFormFieldsForObjectTypeMerged - COMPLETE
 */
function getFormFieldsForObjectTypeMerged(objectType, originalInstruction) {
    console.log(`🎯 ENHANCED: Getting fields for ${objectType} with instruction: ${originalInstruction}`);
    
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
 * PRESERVED: Original captureRecordIdMerged - COMPLETE
 */
async function captureRecordIdMerged(variable) {
    console.log('📝 === ENHANCED RECORD CAPTURE ===');
    console.log(`ENHANCED: Capturing record ID for: ${variable}`);
    
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
                console.log(`✅ ENHANCED: Found record ID: ${recordId}`);
                
                recordContext[variable] = recordId;
                console.log(`💾 ENHANCED: Stored ${variable}: ${recordId}`);
                
                showToast(`✅ ENHANCED: Captured ${recordId.substring(0, 8)}...`, 3000);
                return;
            }
        }
        
        await sleep(1000);
        attempts++;
    }
    
    console.error(`❌ ENHANCED: Failed to capture record ID for ${variable}`);
}

/**
 * PRESERVED: Original fillFormIntelligentlyFixed - COMPLETE
 */
async function fillFormIntelligentlyFixed(fields) {
    console.log('📝 ENHANCED: Filling form with', fields.length, 'predefined fields');

    await sleep(2000);

    for (const field of fields) {
        console.log(`🔍 ENHANCED: Processing predefined field: ${field.label}`);

        try {
            const element = await findFieldElementFixed(field);
            if (!element) {
                console.warn(`⚠️ ENHANCED: Field not found: ${field.label}`);
                const altElement = await findFieldByLabelFixed(field.label);
                if (altElement) {
                    await fillFieldElementFixed(altElement, field);
                }
                continue;
            }
            await fillFieldElementFixed(element, field);
            await sleep(500);
        } catch (error) {
            console.warn(`⚠️ ENHANCED: Failed to fill field ${field.label}:`, error);
        }
    }

    console.log('✅ ENHANCED: Predefined form filling completed');
}

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

    console.log(`✅ ENHANCED: Filled ${field.label} = ${finalValue}`);
}

/**
 * PRESERVED: Original updateStatus - COMPLETE
 */
function updateStatus(message) {
    console.log('📢 ENHANCED: Status update:', message);
    chrome.runtime.sendMessage({ type: "statusUpdate", message: message });
}

/**
 * PRESERVED: Original handleAutofillExtraction - COMPLETE
 */
async function handleAutofillExtraction() {
    try {
        updateStatus("ENHANCED: Extracting fields for autofill...");
        
        const fieldData = await extractFormFieldsMerged();
        const aiSuggestions = await fetchGeminiDataMerged(fieldData.fields);
        
        await populateRecordFieldsMerged(fieldData.fields, aiSuggestions, fieldData.currentValues);
        
        updateStatus("ENHANCED: Autofill completed successfully");
        
        return {
            status: "success",
            fields: fieldData.fields.map(f => f.name),
            populated: Object.keys(aiSuggestions).length
        };
        
    } catch (error) {
        updateStatus(`ENHANCED: Autofill failed: ${error.message}`);
        throw error;
    }
}

/**
 * PRESERVED: Enhanced wait for save with auto-save functionality
 */
async function waitForUserToSaveEnhanced(message = 'Please click Save to continue...', enableAutoSave = true) {
    console.log('⏳ ENHANCED: Enhanced waiting for save...');
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
                console.log('🤖 ENHANCED: Auto-save triggered...');
                showToast('🤖 ENHANCED: Auto-saving now...', 3000);
                
                const saveSuccess = await attemptAutoSaveMerged();
                if (saveSuccess) {
                    console.log('✅ ENHANCED: Auto-save successful!');
                    showToast('✅ ENHANCED: Auto-save completed!', 3000);
                    
                    if (!resolved) {
                        resolved = true;
                        clearInterval(checkForSave);
                        setTimeout(resolve, 2000);
                    }
                } else {
                    console.log('⚠️ ENHANCED: Auto-save failed, continuing...');
                    
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
                    console.log('✅ ENHANCED: Manual save detected!');
                    showToast('✅ ENHANCED: Save detected!');
                    setTimeout(resolve, 2000);
                }
            }
            
            const successToast = document.querySelector('.slds-notify_toast.slds-theme_success');
            if (successToast && !resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('✅ ENHANCED: Success toast detected!');
                showToast('✅ ENHANCED: Save successful!');
                setTimeout(resolve, 2000);
            }
            
            if (enableAutoSave && elapsed >= 7000 && elapsed <= 9900 && !resolved) {
                const remaining = Math.ceil((10000 - elapsed) / 1000);
                showToast(`🤖 ENHANCED: Auto-saving in ${remaining}...`, 900);
            }
        }, 1000);
        
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                clearInterval(checkForSave);
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                console.log('⚠️ ENHANCED: Timeout - continuing...');
                resolve();
            }
        }, 120000);
    });
}

async function attemptAutoSaveMerged() {
    console.log('🤖 === ENHANCED AUTO-SAVE ===');
    
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
                console.log(`✅ ENHANCED: Found Save button: ${selector}`);
                break;
            }
        }
        
        if (!saveButton) {
            const allButtons = document.querySelectorAll('button, input[type="submit"]');
            for (const btn of allButtons) {
                if (btn.textContent.trim().toLowerCase() === 'save' && isElementVisible(btn)) {
                    saveButton = btn;
                    console.log('✅ ENHANCED: Found Save by text');
                    break;
                }
            }
        }
        
        if (!saveButton) {
            console.log('❌ ENHANCED: No Save button found');
            return false;
        }
        
        saveButton.click();
        await sleep(2000);
        
        const success = window.location.href.includes('/lightning/r/') && 
                       !window.location.href.includes('/new');
        
        console.log(`${success ? '✅' : '⚠️'} ENHANCED: Auto-save result: ${success}`);
        return success;
        
    } catch (error) {
        console.error('❌ ENHANCED: Auto-save error:', error);
        return false;
    }
}

// PRESERVED: All original safe action methods
async function safeClick(selector, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);
    element.click();
    console.log(`✅ ENHANCED: Clicked: ${description}`);
}

async function safeType(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ ENHANCED: Typed "${value}": ${description}`);
}

async function safeSelect(selector, value, description) {
    const element = await waitForElement(selector, 5000);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.value = value;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✅ ENHANCED: Selected "${value}": ${description}`);
}

// PRESERVED: All original utility functions
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

console.log('✅ ENHANCED: Complete content script with REAL-TIME PROGRESS UPDATES + ALL original autofill functionality preserved + Record Type handling loaded successfully');
