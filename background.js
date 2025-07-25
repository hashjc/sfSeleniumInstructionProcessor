// FIXED: Complete background.js with proper field value extraction and related list detection

let latestStatus = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateAutomationSteps') {
    handleEnhancedStepGeneration(request.data)
      .then((response) => {
        console.log('Generated automation steps successfully');
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Step generation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (request.type === "statusUpdate") {
    console.log("[Background] Status update:", request.message);
    latestStatus = request.message;
  } else if (request.type === "getStatus") {
    sendResponse({ message: latestStatus });
    return true;
  }
});

/**
 * FIXED: Enhanced step generation with proper field value extraction
 */
async function handleEnhancedStepGeneration(requestData) {
  const { instruction, pageContext, tabId } = requestData;

  console.log('🔄 FIXED: Processing instruction with field value extraction:', instruction);
  console.log('📄 Page context:', pageContext);

  try {
    // FIXED: Parse sequential steps with proper field extraction
    const sequentialSteps = parseSequentialInstructionFixed(instruction);
    
    if (sequentialSteps.length > 1) {
      console.log(`✅ Found ${sequentialSteps.length} sequential steps:`, sequentialSteps);
      
      const allAutomationSteps = await generateSequentialAutomationFixed(sequentialSteps, pageContext);
      await executeSteps(tabId, allAutomationSteps, instruction);
      
      return {
        success: true,
        message: `FIXED Sequential automation with ${sequentialSteps.length} steps`,
        stepCount: allAutomationSteps.length,
        template: 'sequential-fixed',
        sequentialSteps: sequentialSteps
      };
    }
    
    // FIXED: Single step processing with field value extraction
    const templateSteps = matchInstructionToTemplateFixed(instruction);
    
    if (templateSteps) {
      console.log('✅ Matched FIXED template:', templateSteps.name);
      await executeSteps(tabId, templateSteps.steps, instruction);
      
      return {
        success: true,
        message: `FIXED Template: ${templateSteps.name}`,
        stepCount: templateSteps.steps.length,
        template: templateSteps.name
      };
    }
    
    // FIXED: Use Gemini with proper field extraction
    console.log('🤖 Using FIXED Gemini with field value extraction...');
    const geminiSteps = await generateStepsWithFieldExtractionPrompt(instruction, pageContext);
    
    await executeSteps(tabId, geminiSteps, instruction);
    
    return {
      success: true,
      message: 'FIXED AI-generated with field extraction',
      stepCount: geminiSteps.length,
      template: 'gemini-fixed'
    };

  } catch (error) {
    console.error('FIXED step generation failed:', error);
    throw new Error(`FIXED Automation failed: ${error.message}`);
  }
}

/**
 * FIXED: Parse sequential instruction with field value extraction
 */
function parseSequentialInstructionFixed(instruction) {
  console.log('📝 FIXED: Parsing sequential instruction with field extraction:', instruction);
  
  const steps = [];
  
  // FIXED: Enhanced patterns for sequential steps
  const patterns = [
    /step\s*(\d+)\.?\s*([^,\n]+)/gi,
    /step\s*(\d+):\s*([^,\n]+)/gi,
    /(\d+)\.?\s*([^,\n]+)/gi,
    // NEW: Handle line breaks and natural separators
    /^([^.\n]+)$/gm
  ];
  
  // First try numbered steps
  for (const pattern of patterns.slice(0, 3)) {
    let match;
    const tempSteps = [];
    
    while ((match = pattern.exec(instruction)) !== null) {
      const stepNumber = parseInt(match[1]);
      const stepAction = match[2].trim();
      
      if (stepAction.length > 5 && !stepAction.match(/^\d+[-\s]\d+/)) {
        tempSteps.push({
          number: stepNumber,
          action: stepAction,
          raw: match[0].trim()
        });
      }
    }
    
    if (tempSteps.length > 1) {
      steps.push(...tempSteps);
      break;
    }
  }
  
  // FIXED: Fallback - split by line breaks and separators
  if (steps.length <= 1) {
    console.log('🔍 FIXED: Using line-based parsing...');
    
    // Split by line breaks first
    let parts = instruction.split(/\n+/).filter(part => part.trim().length > 0);
    
    // If no line breaks, try other separators
    if (parts.length <= 1) {
      const separators = [',', 'then', 'and then', 'next', 'after that', ';'];
      
      for (const separator of separators) {
        if (instruction.toLowerCase().includes(separator)) {
          parts = instruction.split(new RegExp(separator, 'i'));
          break;
        }
      }
    }
    
    if (parts.length > 1) {
      parts.forEach((part, index) => {
        const cleanPart = part.trim().replace(/^(step\s*\d+\.?\s*)?/i, '');
        if (cleanPart.length > 3) {
          steps.push({
            number: index + 1,
            action: cleanPart,
            raw: part.trim()
          });
        }
      });
    }
  }
  
  steps.sort((a, b) => a.number - b.number);
  console.log('📋 FIXED: Parsed sequential steps:', steps);
  return steps;
}

/**
 * FIXED: Generate sequential automation with proper related detection
 */
async function generateSequentialAutomationFixed(sequentialSteps, pageContext) {
  console.log('🎯 FIXED: Generating sequential automation...');
  
  const allSteps = [];
  let parentRecordVariable = null;
  let parentRecordType = null;
  
  allSteps.push({
    action: 'toast',
    message: `🚀 FIXED Sequential Automation: ${sequentialSteps.length} steps`,
    duration: 4000
  });
  
  for (let i = 0; i < sequentialSteps.length; i++) {
    const step = sequentialSteps[i];
    
    allSteps.push({
      action: 'toast',
      message: `📋 FIXED Step ${step.number}: ${step.action}`,
      duration: 3000
    });
    
    // FIXED: Enhanced related record detection
    const relatedAnalysis = analyzeForRelatedCreationFixed(step.action, parentRecordType, parentRecordVariable, pageContext);
    
    if (relatedAnalysis.isRelated && parentRecordVariable) {
      console.log('🔗 FIXED: Using related workflow for:', relatedAnalysis.targetObject);
      
      // Generate FIXED Related List steps
      const relatedSteps = generateFixedRelatedListSteps(
        step.action, 
        relatedAnalysis.targetObject,
        relatedAnalysis.relatedListName,
        parentRecordVariable, 
        parentRecordType
      );
      allSteps.push(...relatedSteps);
    } else {
      // Use FIXED Gemini for regular creation
      try {
        const stepAutomation = await generateStepsWithFieldExtractionPrompt(step.action, pageContext);
        allSteps.push(...stepAutomation);
        
        const createsParent = detectParentRecordCreationFixed(step.action);
        if (createsParent) {
          parentRecordType = createsParent.objectType;
          parentRecordVariable = createsParent.variable;
          console.log(`✅ FIXED: Detected parent record: ${parentRecordType} (${parentRecordVariable})`);
        }
      } catch (error) {
        console.error(`❌ FIXED: Gemini failed for step ${step.number}:`, error);
        const fallbackSteps = generateFixedFallback(step.action, pageContext);
        allSteps.push(...fallbackSteps);
      }
    }
  }
  
  allSteps.push({
    action: 'toast',
    message: `🎉 FIXED: All ${sequentialSteps.length} steps completed!`,
    duration: 5000
  });
  
  return allSteps;
}

/**
 * FIXED: Analyze for related record creation with better detection
 */
function analyzeForRelatedCreationFixed(stepAction, parentRecordType, parentRecordVariable, pageContext) {
  console.log(`🎯 FIXED ANALYSIS: "${stepAction}"`);
  console.log(`   Parent context: ${parentRecordType} (${parentRecordVariable})`);
  console.log(`   Page context: ${pageContext.currentObject} page`);
  
  if (!parentRecordType || !parentRecordVariable) {
    console.log('   ❌ No parent context available');
    return { isRelated: false };
  }
  
  const lowerAction = stepAction.toLowerCase();
  
  // FIXED: More flexible related detection
  const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the', 'under that', 'under the'];
  const hasRelatedKeyword = relatedKeywords.some(keyword => lowerAction.includes(keyword));
  
  // FIXED: Also check if we're on a record page (not Home) and different object type
  const isOnRecordPage = pageContext.currentObject && pageContext.currentObject !== 'Home';
  const isDifferentObjectType = pageContext.currentObject && 
                               !lowerAction.includes(pageContext.currentObject.toLowerCase());
  
  console.log('   Has related keyword:', hasRelatedKeyword);
  console.log('   Is on record page:', isOnRecordPage);
  console.log('   Is different object type:', isDifferentObjectType);
  
  if (!hasRelatedKeyword && !isDifferentObjectType) {
    console.log('   ❌ Not a related creation - will use App Launcher');
    return { isRelated: false };
  }
  
  console.log('   ✅ This appears to be related creation - analyzing object type...');
  
  // FIXED: Enhanced detection patterns with specific object mapping
  const objectPatterns = [
    { keywords: ['contact'], object: 'Contact', list: 'Contacts' },
    { keywords: ['opportunity', 'opp'], object: 'Opportunity', list: 'Opportunities' },
    { keywords: ['case'], object: 'Case', list: 'Cases' },
    { keywords: ['task'], object: 'Task', list: 'Tasks' },
    { keywords: ['event'], object: 'Event', list: 'Events' },
    { keywords: ['lead'], object: 'Lead', list: 'Leads' },
    { keywords: ['note'], object: 'Note', list: 'Notes & Attachments' },
    { keywords: ['attachment'], object: 'Attachment', list: 'Notes & Attachments' },
    { keywords: ['partner'], object: 'Partner', list: 'Partners' },
    { keywords: ['contract'], object: 'Contract', list: 'Contracts' }
  ];
  
  // Check each pattern
  for (const pattern of objectPatterns) {
    for (const keyword of pattern.keywords) {
      if (lowerAction.includes(keyword)) {
        console.log(`   ✅ FIXED MATCH: ${pattern.object} via keyword: ${keyword}`);
        return {
          isRelated: true,
          targetObject: pattern.object,
          relatedListName: pattern.list,
          confidence: 'high',
          reason: `Found "${keyword}" with related context`
        };
      }
    }
  }
  
  console.log('   ❌ Could not determine specific object type for related creation');
  return { isRelated: false };
}

/**
 * FIXED: Generate related list steps with proper targeting
 */
function generateFixedRelatedListSteps(stepAction, targetObject, relatedListName, parentRecordVariable, parentRecordType) {
  console.log(`🔗 FIXED: Generating related steps for ${targetObject} in ${relatedListName}`);
  
  return [
    {
      action: 'toast',
      message: `🔗 FIXED: Creating related ${targetObject} via Related tab`,
      duration: 3000
    },
    {
      action: 'navigate_to_related_tab',
      description: 'FIXED: Navigate to Related tab'
    },
    {
      action: 'wait',
      duration: 4000,
      description: 'FIXED: Wait for Related tab to load'
    },
    {
      action: 'click_related_list_new',
      relatedListName: relatedListName,
      targetObject: targetObject,
      parentRecordVariable: parentRecordVariable,
      description: `FIXED: Click New in ${relatedListName} list`
    },
    {
      action: 'wait',
      duration: 3000,
      description: 'FIXED: Wait for form to load'
    },
    {
      action: 'fill_related_form',
      objectType: targetObject,
      originalInstruction: stepAction,
      description: `FIXED: Fill ${targetObject} form`
    },
    {
      action: 'wait_for_save',
      message: `FIXED: Please save the ${targetObject} record (auto-save in 10 seconds)`,
      autoSave: true
    },
    {
      action: 'toast',
      message: `✅ FIXED: ${targetObject} created and linked to ${parentRecordType}!`,
      duration: 4000
    }
  ];
}

/**
 * FIXED: Detect parent record creation
 */
function detectParentRecordCreationFixed(stepAction) {
  const lowerAction = stepAction.toLowerCase();
  
  const objectMappings = {
    'account': { objectType: 'Account', variable: 'accountId' },
    'contact': { objectType: 'Contact', variable: 'contactId' },
    'opportunity': { objectType: 'Opportunity', variable: 'opportunityId' },
    'case': { objectType: 'Case', variable: 'caseId' },
    'lead': { objectType: 'Lead', variable: 'leadId' }
  };
  
  for (const [keyword, mapping] of Object.entries(objectMappings)) {
    if (lowerAction.includes(keyword) && 
        (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('make'))) {
      
      // FIXED: Make sure it's not a "related" creation
      const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the'];
      const isRelated = relatedKeywords.some(rel => lowerAction.includes(rel));
      
      if (!isRelated) {
        console.log(`✅ FIXED: Detected parent record creation: ${mapping.objectType}`);
        return mapping;
      }
    }
  }
  
  return null;
}

/**
 * FIXED: Gemini prompt with field value extraction
 */
async function generateStepsWithFieldExtractionPrompt(instruction, pageContext) {
  const API_KEY = "AIzaSyAWpSq4nTD377qg4J4n7bxWiTifvz43IDU";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const geminiPrompt = `
You are an expert Salesforce automation specialist with ADVANCED FIELD VALUE EXTRACTION. Generate automation steps for: "${instruction}"

🎯 CRITICAL FIELD VALUE EXTRACTION:
ALWAYS extract specific values mentioned in the instruction and use them in forms!

Examples of field extraction:
- "Create account name TestAyush28" → Use "TestAyush28" as Account Name
- "Add contact John Smith" → Use "John" as firstName, "Smith" as lastName  
- "Make opportunity for $50000" → Use "50000" as Amount
- "Create case subject Login Issue" → Use "Login Issue" as Subject

🔄 WORKFLOW DECISION (FIXED):
IF instruction mentions "related", "to that", "to the", "for that" OR user is on record page with different object → Use Related List workflow
ELSE → Use App Launcher workflow

🧠 VALUE EXTRACTION RULES:
1. Look for specific names, amounts, subjects, emails, phone numbers in instruction
2. Extract company names, person names, monetary values, dates, descriptions
3. Use extracted values in the appropriate form fields
4. If no specific value mentioned, use realistic sample data

RELATED LIST WORKFLOW (when creating related records):
[
  {"action": "toast", "message": "🔗 Creating related [OBJECT]", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "[OBJECT]s", "targetObject": "[OBJECT]"},
  {"action": "fill_related_form", "objectType": "[OBJECT]", "originalInstruction": "${instruction}"},
  {"action": "wait_for_save", "message": "Please save the [OBJECT]", "autoSave": true}
]

APP LAUNCHER WORKFLOW (when creating new records):
[
  {"action": "toast", "message": "🚀 Creating [OBJECT]", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "[OBJECT]s"},
  {"action": "fill_form", "fields": [
    {"selector": "input[name='Name']", "value": "[EXTRACTED_VALUE]", "label": "Name"}
  ]},
  {"action": "wait_for_save", "message": "Please save the [OBJECT]", "autoSave": true},
  {"action": "capture_record_id", "variable": "[object]Id"}
]

🎯 SPECIFIC EXAMPLES WITH VALUE EXTRACTION:

Instruction: "Create account name TestAyush28"
[
  {"action": "toast", "message": "🚀 Creating Account with name TestAyush28", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "Accounts"},
  {"action": "fill_form", "fields": [
    {"selector": "input[name='Name']", "value": "TestAyush28", "label": "Account Name"}
  ]},
  {"action": "wait_for_save", "message": "Please save the Account", "autoSave": true},
  {"action": "capture_record_id", "variable": "accountId"}
]

Instruction: "Create related contact to that account"
[
  {"action": "toast", "message": "🔗 Creating related Contact", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "Contacts", "targetObject": "Contact"},
  {"action": "fill_related_form", "objectType": "Contact", "originalInstruction": "Create related contact to that account"},
  {"action": "wait_for_save", "message": "Please save the Contact", "autoSave": true}
]

🚨 CRITICAL REQUIREMENTS:
1. ALWAYS extract specific values from instruction (names, amounts, subjects, etc.)
2. Use extracted values in form fields, NOT generic samples
3. If creating related record, use "navigate_to_related_tab" workflow
4. Always include "wait_for_save" with autoSave: true
5. Always include "capture_record_id" for parent records

Current Context:
- Instruction: "${instruction}"
- Page URL: ${pageContext.url}
- Current Object: ${pageContext.currentObject || 'Home'}
- Is Record Page: ${pageContext.url && pageContext.url.includes('/lightning/r/') ? 'YES' : 'NO'}

Generate automation steps as JSON array with EXTRACTED FIELD VALUES:
`;

  const requestBody = {
    contents: [
      {
        role: "user", 
        parts: [{ text: geminiPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096,
    }
  };

  try {
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    let rawResponse = data.candidates[0].content.parts[0].text;
    console.log('FIXED Gemini raw response:', rawResponse);
    
    // Clean and parse JSON
    let jsonString = rawResponse.replace(/```json|```/g, "").trim();
    
    // Extract JSON array
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const steps = JSON.parse(jsonString);
    
    if (!Array.isArray(steps)) {
      throw new Error('Generated steps must be an array');
    }

    // FIXED: Enhance steps with field extraction
    const enhancedSteps = enhanceStepsWithFieldExtraction(steps, instruction, pageContext);

    console.log('✅ FIXED: Generated', enhancedSteps.length, 'steps with field extraction');
    return enhancedSteps;

  } catch (error) {
    console.error('❌ FIXED: Gemini failed:', error);
    
    // FIXED fallback with field extraction
    return generateFixedFallback(instruction, pageContext);
  }
}

/**
 * FIXED: Enhance steps with field extraction
 */
function enhanceStepsWithFieldExtraction(steps, instruction, pageContext) {
  const enhancedSteps = [];
  let hasWaitForSave = false;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // FIXED: Extract values from instruction for form fields
    if (step.action === 'fill_form' && step.fields) {
      step.fields = step.fields.map(field => {
        // FIXED: Try to extract actual values from instruction
        if (field.selector === 'input[name="Name"]' || field.label === 'Account Name') {
          const extractedName = extractNameFromInstruction(instruction);
          if (extractedName) {
            console.log(`✅ FIXED: Extracted name "${extractedName}" from instruction`);
            field.value = extractedName;
          }
        }
        return field;
      });
    }
    
    // Ensure wait_for_save has autoSave enabled
    if (step.action === 'wait_for_save') {
      step.autoSave = true;
      hasWaitForSave = true;
    }
    
    // Add missing wait_for_save after form filling
    if (step.action === 'fill_form' || step.action === 'fill_related_form') {
      enhancedSteps.push(step);
      
      // Check if next step is already wait_for_save
      const nextStep = steps[i + 1];
      if (!nextStep || nextStep.action !== 'wait_for_save') {
        enhancedSteps.push({
          action: 'wait_for_save',
          message: 'FIXED: Please save the record to continue',
          autoSave: true
        });
        hasWaitForSave = true;
      }
    } else {
      enhancedSteps.push(step);
    }
  }
  
  // Add capture_record_id for parent records
  if (hasWaitForSave) {
    const objectType = detectPrimaryObjectFixed(instruction);
    if (objectType && !instruction.toLowerCase().includes('related')) {
      enhancedSteps.push({
        action: 'capture_record_id',
        variable: `${objectType.toLowerCase()}Id`,
        description: `FIXED: Capturing ${objectType} ID`
      });
    }
  }
  
  return enhancedSteps;
}

/**
 * FIXED: Extract name from instruction
 */
function extractNameFromInstruction(instruction) {
  console.log('🎯 FIXED: Extracting name from:', instruction);
  
  // Patterns to extract names
  const namePatterns = [
    /name\s+([A-Za-z0-9_\-\s]+)/i,
    /called\s+([A-Za-z0-9_\-\s]+)/i,
    /account\s+([A-Za-z0-9_\-\s]+)/i,
    /create\s+([A-Za-z0-9_\-\s]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      const extractedName = match[1].trim();
      // Remove common words that aren't part of the name
      const cleanName = extractedName.replace(/\b(account|contact|opportunity|case|for|with|and|the|a|an)\b/gi, '').trim();
      if (cleanName.length > 0) {
        console.log(`✅ FIXED: Extracted name: "${cleanName}"`);
        return cleanName;
      }
    }
  }
  
  console.log('❌ FIXED: No specific name found in instruction');
  return null;
}

/**
 * FIXED: Detect primary object
 */
function detectPrimaryObjectFixed(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes('account')) return 'Account';
  if (lowerInstruction.includes('contact')) return 'Contact';
  if (lowerInstruction.includes('opportunity')) return 'Opportunity';
  if (lowerInstruction.includes('case')) return 'Case';
  if (lowerInstruction.includes('lead')) return 'Lead';
  
  return null;
}

/**
 * FIXED: Fallback with field extraction
 */
function generateFixedFallback(instruction, pageContext) {
  console.log('🧠 FIXED: Generating fallback with field extraction for:', instruction);
  
  const lowerInstruction = instruction.toLowerCase();
  const steps = [];
  
  // Add intro toast
  steps.push({
    action: 'toast',
    message: `🤖 FIXED fallback processing: "${instruction}"`,
    duration: 3000
  });
  
  // FIXED: Check if this should be related workflow
  const relatedAnalysis = analyzeForRelatedCreationFixed(instruction, pageContext.currentObject, 'accountId', pageContext);
  
  if (relatedAnalysis.isRelated) {
    console.log('🔗 FIXED: Using related workflow in fallback');
    const relatedSteps = generateFixedRelatedListSteps(
      instruction,
      relatedAnalysis.targetObject,
      relatedAnalysis.relatedListName,
      'accountId',
      'Account'
    );
    steps.push(...relatedSteps);
    return steps;
  }
  
  // FIXED: Regular object creation with field extraction
  if (lowerInstruction.includes('account')) {
    const extractedName = extractNameFromInstruction(instruction);
    
    steps.push({
      action: 'navigate_app_launcher',
      objectName: 'Accounts'
    });
    steps.push({
      action: 'fill_form',
      fields: [{
        selector: 'input[name="Name"]',
        value: extractedName || 'Sample Account',
        label: 'Account Name'
      }]
    });
    steps.push({
      action: 'wait_for_save',
      message: 'FIXED: Please save the Account record',
      autoSave: true
    });
    steps.push({
      action: 'capture_record_id',
      variable: 'accountId'
    });
  }
  else if (lowerInstruction.includes('contact')) {
    steps.push({
      action: 'navigate_app_launcher',
      objectName: 'Contacts'
    });
    steps.push({
      action: 'fill_form',
      fields: [
        {
          selector: 'input[name="firstName"]',
          value: 'John',
          label: 'First Name'
        },
        {
          selector: 'input[name="lastName"]',
          value: 'Smith',
          label: 'Last Name'
        }
      ]
    });
    steps.push({
      action: 'wait_for_save',
      message: 'FIXED: Please save the Contact record',
      autoSave: true
    });
  }
  
  return steps;
}

/**
 * FIXED: Match instruction to template with field extraction
 */
function matchInstructionToTemplateFixed(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  // FIXED: Extract name for account template
  if (lowerInstruction.includes('account')) {
    const template = JSON.parse(JSON.stringify(AUTOMATION_TEMPLATES.create_account)); // Deep copy
    const extractedName = extractNameFromInstruction(instruction);
    
    if (extractedName) {
      template.steps.forEach(step => {
        if (step.action === 'fill_form' && step.fields) {
          step.fields.forEach(field => {
            if (field.selector === 'input[name="Name"]') {
              field.value = extractedName;
              console.log(`✅ FIXED: Using extracted name "${extractedName}" in template`);
            }
          });
        }
      });
    }
    
    return template;
  }
  
  if (lowerInstruction.includes('contact')) {
    return AUTOMATION_TEMPLATES.create_contact;
  }
  
  if (lowerInstruction.includes('opportunity')) {
    return AUTOMATION_TEMPLATES.create_opportunity;
  }
  
  return null;
}

/**
 * FIXED: Predefined automation templates
 */
const AUTOMATION_TEMPLATES = {
  'create_account': {
    name: 'FIXED Create Account',
    steps: [
      { action: 'toast', message: '🚀 FIXED: Starting Account creation...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Accounts', description: 'Opening Accounts' },
      { action: 'fill_form', description: 'FIXED: Filling Account form', fields: [
        { selector: 'input[name="Name"]', value: 'Acme Corporation', label: 'Account Name', type: 'input' },
        { selector: 'input[name="Phone"]', value: '555-123-4567', label: 'Phone', type: 'input' },
        { selector: 'input[name="Website"]', value: 'https://acmecorp.com', label: 'Website', type: 'input' }
      ]},
      { action: 'wait_for_save', message: 'FIXED: Please save the Account record', autoSave: true },
      { action: 'capture_record_id', variable: 'accountId' }
    ]
  },
  'create_contact': {
    name: 'FIXED Create Contact',
    steps: [
      { action: 'toast', message: '🚀 FIXED: Starting Contact creation...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Contacts', description: 'Opening Contacts' },
      { action: 'fill_form', description: 'FIXED: Filling Contact form', fields: [
        { selector: 'input[name="firstName"]', value: 'John', label: 'First Name', type: 'input' },
        { selector: 'input[name="lastName"]', value: 'Doe', label: 'Last Name', type: 'input' },
        { selector: 'input[name="Email"]', value: 'john.doe@company.com', label: 'Email', type: 'input' },
        { selector: 'input[name="Phone"]', value: '555-987-6543', label: 'Phone', type: 'input' }
      ]},
      { action: 'wait_for_save', message: 'FIXED: Please save the Contact record', autoSave: true },
      { action: 'capture_record_id', variable: 'contactId' }
    ]
  },
  'create_opportunity': {
    name: 'FIXED Create Opportunity',
    steps: [
      { action: 'toast', message: '🚀 FIXED: Starting Opportunity creation...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Opportunities', description: 'Opening Opportunities' },
      { action: 'fill_form', description: 'FIXED: Filling Opportunity form', fields: [
        { selector: 'input[name="Name"]', value: 'Q1 2025 Deal', label: 'Opportunity Name', type: 'input' },
        { selector: 'input[name="Amount"]', value: '50000', label: 'Amount', type: 'input' },
        { selector: 'input[name="CloseDate"]', value: '2025-03-31', label: 'Close Date', type: 'input' }
      ]},
      { action: 'wait_for_save', message: 'FIXED: Please save the Opportunity record', autoSave: true },
      { action: 'capture_record_id', variable: 'opportunityId' }
    ]
  }
};

/**
 * Execute automation steps
 */
async function executeSteps(tabId, steps, instruction) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, {
      action: 'executeAutomationSteps',
      steps: steps,
      instruction: instruction
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Content script not ready, injecting...");
        
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to inject content script'));
            return;
          }

          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'executeAutomationSteps',
              steps: steps,
              instruction: instruction
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          }, 1000);
        });
      } else {
        resolve(response);
      }
    });
  });
}

console.log('✅ FIXED: Complete background script with field value extraction and proper related list detection');
