// ENHANCED: Complete background.js with Record Type handling + ALL original autofill functionality preserved

let latestStatus = 'Idle'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle automation step generation
  if (request.action === 'generateAutomationSteps') {
    handleEnhancedStepGenerationMerged(request.data)
      .then((response) => {
        console.log('ENHANCED: Generated automation steps with Record Type support successfully');
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('ENHANCED: Step generation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Handle status updates from both systems
  if (request.type === "statusUpdate") {
    console.log("[ENHANCED Background] Status update:", request.message);
    latestStatus = request.message;
  } else if (request.type === "getStatus") {
    sendResponse({ message: latestStatus });
    return true;
  }
  
  // Handle direct autofill requests
  if (request.action === 'triggerAutofill') {
    handleDirectAutofillMerged(request.tabId)
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * ENHANCED: Step generation with ALL original functionality + Record Type handling
 */
async function handleEnhancedStepGenerationMerged(requestData) {
  const { instruction, pageContext, tabId } = requestData;

  console.log('🔄 ENHANCED: Processing instruction with AI autofill integration + Record Type support:', instruction);
  console.log('📄 Page context:', pageContext);

  try {
    // Update status
    updateStatus('ENHANCED: Analyzing instruction with Record Type support...');
    
    // PRESERVED: Parse sequential steps with AI integration + Record Type awareness
    const sequentialSteps = parseSequentialInstructionMerged(instruction);
    
    if (sequentialSteps.length > 1) {
      console.log(`✅ ENHANCED: Found ${sequentialSteps.length} sequential steps:`, sequentialSteps);
      updateStatus(`ENHANCED: Processing ${sequentialSteps.length} sequential steps with Record Type handling...`);
      
      const allAutomationSteps = await generateSequentialAutomationMerged(sequentialSteps, pageContext);
      await executeSteps(tabId, allAutomationSteps, instruction);
      
      updateStatus('ENHANCED: Sequential automation with Record Type support completed successfully!');
      
      return {
        success: true,
        message: `ENHANCED Sequential automation with Record Type support: ${sequentialSteps.length} steps`,
        stepCount: allAutomationSteps.length,
        template: 'sequential-enhanced-merged',
        sequentialSteps: sequentialSteps
      };
    }
    
    // PRESERVED: Single step processing with AI autofill + Record Type support
    const templateSteps = matchInstructionToTemplateMerged(instruction);
    
    if (templateSteps) {
      console.log('✅ ENHANCED: Matched template:', templateSteps.name);
      updateStatus(`ENHANCED: Using template: ${templateSteps.name}`);
      
      await executeSteps(tabId, templateSteps.steps, instruction);
      
      updateStatus('ENHANCED: Template automation completed!');
      
      return {
        success: true,
        message: `ENHANCED Template: ${templateSteps.name}`,
        stepCount: templateSteps.steps.length,
        template: templateSteps.name
      };
    }
    
    // PRESERVED: Use Gemini with AI autofill integration + Record Type support
    console.log('🤖 ENHANCED: Using Gemini with AI autofill integration + Record Type support...');
    updateStatus('ENHANCED: Generating AI automation steps...');
    
    const geminiSteps = await generateStepsWithAIAutofillPromptMerged(instruction, pageContext);
    
    await executeSteps(tabId, geminiSteps, instruction);
    
    updateStatus('ENHANCED: AI automation with autofill + Record Type support completed!');
    
    return {
      success: true,
      message: 'ENHANCED AI-generated with autofill integration + Record Type support',
      stepCount: geminiSteps.length,
      template: 'gemini-enhanced-merged'
    };

  } catch (error) {
    console.error('ENHANCED: Step generation failed:', error);
    updateStatus(`ENHANCED: Automation failed: ${error.message}`);
    throw new Error(`ENHANCED Automation failed: ${error.message}`);
  }
}

/**
 * PRESERVED: Original parseSequentialInstructionMerged with Record Type awareness
 */
function parseSequentialInstructionMerged(instruction) {
  console.log('📝 ENHANCED: Parsing sequential instruction with AI integration + Record Type support:', instruction);
  
  const steps = [];
  
  // PRESERVED: Enhanced patterns for sequential steps
  const patterns = [
    /step\s*(\d+)\.?\s*([^,\n]+)/gi,
    /step\s*(\d+):\s*([^,\n]+)/gi,
    /(\d+)\.?\s*([^,\n]+)/gi,
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
  
  // PRESERVED: Fallback - split by line breaks and separators
  if (steps.length <= 1) {
    console.log('🔍 ENHANCED: Using line-based parsing...');
    
    let parts = instruction.split(/\n+/).filter(part => part.trim().length > 0);
    
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
  console.log('📋 ENHANCED: Parsed sequential steps:', steps);
  return steps;
}

/**
 * PRESERVED: Original generateSequentialAutomationMerged with Record Type support
 */
async function generateSequentialAutomationMerged(sequentialSteps, pageContext) {
  console.log('🎯 ENHANCED: Generating sequential automation with AI autofill + Record Type support...');
  
  const allSteps = [];
  let parentRecordVariable = null;
  let parentRecordType = null;
  
  allSteps.push({
    action: 'toast',
    message: `🚀 ENHANCED Sequential Automation: ${sequentialSteps.length} steps with AI autofill + Record Type support`,
    duration: 4000
  });
  
  for (let i = 0; i < sequentialSteps.length; i++) {
    const step = sequentialSteps[i];
    
    allSteps.push({
      action: 'toast',
      message: `📋 ENHANCED Step ${step.number}: ${step.action}`,
      duration: 3000
    });
    
    // PRESERVED: Enhanced related record detection with Record Type awareness
    const relatedAnalysis = analyzeForRelatedCreationMerged(step.action, parentRecordType, parentRecordVariable, pageContext);
    
    if (relatedAnalysis.isRelated && parentRecordVariable) {
      console.log('🔗 ENHANCED: Using related workflow with AI autofill + Record Type support for:', relatedAnalysis.targetObject);
      
      // Generate ENHANCED Related List steps with AI + Record Type
      const relatedSteps = generateMergedRelatedListSteps(
        step.action, 
        relatedAnalysis.targetObject,
        relatedAnalysis.relatedListName,
        parentRecordVariable, 
        parentRecordType
      );
      allSteps.push(...relatedSteps);
    } else {
      // Use ENHANCED Gemini with AI autofill + Record Type for regular creation
      try {
        const stepAutomation = await generateStepsWithAIAutofillPromptMerged(step.action, pageContext);
        allSteps.push(...stepAutomation);
        
        const createsParent = detectParentRecordCreationMerged(step.action);
        if (createsParent) {
          parentRecordType = createsParent.objectType;
          parentRecordVariable = createsParent.variable;
          console.log(`✅ ENHANCED: Detected parent record: ${parentRecordType} (${parentRecordVariable})`);
        }
      } catch (error) {
        console.error(`❌ ENHANCED: Gemini failed for step ${step.number}:`, error);
        const fallbackSteps = generateMergedFallback(step.action, pageContext);
        allSteps.push(...fallbackSteps);
      }
    }
  }
  
  allSteps.push({
    action: 'toast',
    message: `🎉 ENHANCED: All ${sequentialSteps.length} steps completed with AI autofill + Record Type support!`,
    duration: 5000
  });
  
  return allSteps;
}

/**
 * PRESERVED: Original analyzeForRelatedCreationMerged with Record Type awareness
 */
function analyzeForRelatedCreationMerged(stepAction, parentRecordType, parentRecordVariable, pageContext) {
  console.log(`🎯 ENHANCED ANALYSIS: "${stepAction}"`);
  console.log(`   Parent context: ${parentRecordType} (${parentRecordVariable})`);
  console.log(`   Page context: ${pageContext.currentObject} page`);
  
  if (!parentRecordType || !parentRecordVariable) {
    console.log('   ❌ No parent context available');
    return { isRelated: false };
  }
  
  const lowerAction = stepAction.toLowerCase();
  
  // PRESERVED: More flexible related detection
  const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the', 'under that', 'under the'];
  const hasRelatedKeyword = relatedKeywords.some(keyword => lowerAction.includes(keyword));
  
  // PRESERVED: Also check if we're on a record page (not Home) and different object type
  const isOnRecordPage = pageContext.currentObject && pageContext.currentObject !== 'Home';
  const isDifferentObjectType = pageContext.currentObject && 
                               !lowerAction.includes(pageContext.currentObject.toLowerCase());
  
  console.log('   Has related keyword:', hasRelatedKeyword);
  console.log('   Is on record page:', isOnRecordPage);
  console.log('   Is different object type:', isDifferentObjectType);
  
  if (!hasRelatedKeyword && !isDifferentObjectType) {
    console.log('   ❌ Not a related creation - will use App Launcher with AI + Record Type support');
    return { isRelated: false };
  }
  
  console.log('   ✅ This appears to be related creation - analyzing object type...');
  
  // PRESERVED: Enhanced detection patterns with specific object mapping
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
        console.log(`   ✅ ENHANCED MATCH: ${pattern.object} via keyword: ${keyword}`);
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
 * PRESERVED: Original generateMergedRelatedListSteps with Record Type support
 */
function generateMergedRelatedListSteps(stepAction, targetObject, relatedListName, parentRecordVariable, parentRecordType) {
  console.log(`🔗 ENHANCED: Generating related steps for ${targetObject} in ${relatedListName} with AI autofill + Record Type support`);
  
  return [
    {
      action: 'toast',
      message: `🔗 ENHANCED: Creating related ${targetObject} with AI autofill + Record Type support`,
      duration: 3000
    },
    {
      action: 'navigate_to_related_tab',
      description: 'ENHANCED: Navigate to Related tab'
    },
    {
      action: 'wait',
      duration: 4000,
      description: 'ENHANCED: Wait for Related tab to load'
    },
    {
      action: 'click_related_list_new',
      relatedListName: relatedListName,
      targetObject: targetObject,
      parentRecordVariable: parentRecordVariable,
      description: `ENHANCED: Click New in ${relatedListName} list (Record Type aware)`
    },
    {
      action: 'wait',
      duration: 3000,
      description: 'ENHANCED: Wait for form to load (Record Type modal may appear)'
    },
    {
      action: 'fill_related_form',
      objectType: targetObject,
      originalInstruction: stepAction,
      description: `ENHANCED: Fill ${targetObject} form with AI autofill + Record Type support`
    },
    {
      action: 'wait_for_save',
      message: `ENHANCED: Please save the ${targetObject} record (auto-save in 10 seconds)`,
      autoSave: true
    },
    {
      action: 'toast',
      message: `✅ ENHANCED: ${targetObject} created with AI + Record Type support and linked to ${parentRecordType}!`,
      duration: 4000
    }
  ];
}

/**
 * PRESERVED: Original detectParentRecordCreationMerged - COMPLETE
 */
function detectParentRecordCreationMerged(stepAction) {
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
      
      // PRESERVED: Make sure it's not a "related" creation
      const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the'];
      const isRelated = relatedKeywords.some(rel => lowerAction.includes(rel));
      
      if (!isRelated) {
        console.log(`✅ ENHANCED: Detected parent record creation: ${mapping.objectType}`);
        return mapping;
      }
    }
  }
  
  return null;
}

/**
 * ENHANCED: Gemini prompt with AI autofill integration + Record Type support
 */
async function generateStepsWithAIAutofillPromptMerged(instruction, pageContext) {
  const API_KEY = "AIzaSyAWpSq4nTD377qg4J4n7bxWiTifvz43IDU";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const geminiPrompt = `
You are an expert Salesforce automation specialist with ADVANCED AI AUTOFILL INTEGRATION + RECORD TYPE HANDLING. Generate automation steps for: "${instruction}"

🤖 CRITICAL AI AUTOFILL INTEGRATION:
ALL form filling must use AI autofill instead of manual field entry!

🚨 CRITICAL RECORD TYPE AWARENESS:
When creating Salesforce records, there may be Record Type selection modals that appear. The automation must handle these gracefully.

🔄 WORKFLOW DECISION (ENHANCED):
IF instruction mentions "related", "to that", "to the", "for that" OR user is on record page with different object → Use Related List workflow with AI autofill + Record Type support
ELSE → Use App Launcher workflow with AI autofill + Record Type support

🎯 RECORD TYPE + AI AUTOFILL FLOW:
1. Click "New" button → Record Type modal may appear
2. User selects Record Type and clicks "Next" (automation pauses/resumes automatically)
3. Form appears → AI autofill analyzes all form fields automatically
4. AI generates realistic values for all field types (text, picklist, date, etc.)
5. AI fills fields with intelligent suggestions
6. Auto-save after 10 seconds

🧠 AI AUTOFILL RULES:
1. NEVER use manual "fill_form" with predefined fields
2. ALWAYS use "fill_form" action WITHOUT fields parameter to trigger AI autofill
3. AI will automatically analyze form, extract field types, and fill with intelligent suggestions
4. AI handles picklists, dates, text fields, numbers automatically
5. Wait for AI completion before continuing

RELATED LIST WORKFLOW (with AI autofill + Record Type support):
[
  {"action": "toast", "message": "🔗 ENHANCED: Creating related [OBJECT] with AI + Record Type support", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "[OBJECT]s", "targetObject": "[OBJECT]"},
  {"action": "fill_form", "description": "ENHANCED: AI autofill for [OBJECT] form (after Record Type selection)"},
  {"action": "wait_for_save", "message": "ENHANCED: Please save the [OBJECT]", "autoSave": true}
]

APP LAUNCHER WORKFLOW (with AI autofill + Record Type support):
[
  {"action": "toast", "message": "🚀 ENHANCED: Creating [OBJECT] with AI + Record Type support", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "[OBJECT]s"},
  {"action": "fill_form", "description": "ENHANCED: AI autofill for [OBJECT] form (after Record Type selection)"},
  {"action": "wait_for_save", "message": "ENHANCED: Please save the [OBJECT]", "autoSave": true},
  {"action": "capture_record_id", "variable": "[object]Id"}
]

🎯 SPECIFIC EXAMPLES WITH AI AUTOFILL + RECORD TYPE SUPPORT:

Instruction: "Create account name TestAyush28"
[
  {"action": "toast", "message": "🚀 ENHANCED: Creating Account with AI autofill + Record Type support", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "Accounts"},
  {"action": "fill_form", "description": "ENHANCED: AI autofill for Account form (extracts TestAyush28 + generates other fields)"},
  {"action": "wait_for_save", "message": "ENHANCED: Please save the Account", "autoSave": true},
  {"action": "capture_record_id", "variable": "accountId"}
]

Instruction: "Create related contact to that account"
[
  {"action": "toast", "message": "🔗 ENHANCED: Creating related Contact with AI + Record Type support", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "Contacts", "targetObject": "Contact"},
  {"action": "fill_form", "description": "ENHANCED: AI autofill for Contact form (generates realistic contact data)"},
  {"action": "wait_for_save", "message": "ENHANCED: Please save the Contact", "autoSave": true}
]

🚨 CRITICAL REQUIREMENTS:
1. NEVER include "fields" parameter in "fill_form" action
2. AI autofill will automatically handle all field types and values after Record Type selection
3. Always include "description" explaining the AI autofill + Record Type aware process
4. Always include "wait_for_save" with autoSave: true
5. Always include "capture_record_id" for parent records
6. AI autofill includes 10-second completion wait automatically
7. Record Type selection happens automatically before AI form filling

ENHANCED FLOW SUMMARY:
1. Navigate → Click New → Record Type modal (user selects) → Form appears
2. AI analyzes ALL form fields (text, picklist, date, number, checkbox, etc.)
3. AI generates realistic business values for each field type
4. AI fills ALL fields intelligently 
5. 10-second wait for completion → Auto-save

Current Context:
- Instruction: "${instruction}"
- Page URL: ${pageContext.url}
- Current Object: ${pageContext.currentObject || 'Home'}
- Is Record Page: ${pageContext.url && pageContext.url.includes('/lightning/r/') ? 'YES' : 'NO'}

Generate automation steps as JSON array with AI AUTOFILL + RECORD TYPE INTEGRATION:
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
    console.log('ENHANCED Gemini raw response:', rawResponse);
    
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

    // PRESERVED: Enhance steps with field extraction + Record Type support
    const enhancedSteps = enhanceStepsWithAIAutofillMerged(steps, instruction, pageContext);

    console.log('✅ ENHANCED: Generated', enhancedSteps.length, 'steps with AI autofill + Record Type integration');
    return enhancedSteps;

  } catch (error) {
    console.error('❌ ENHANCED: Gemini failed:', error);
    
    // ENHANCED fallback with AI autofill + Record Type
    return generateMergedFallback(instruction, pageContext);
  }
}

/**
 * PRESERVED: Original enhanceStepsWithAIAutofillMerged + Record Type support
 */
function enhanceStepsWithAIAutofillMerged(steps, instruction, pageContext) {
  const enhancedSteps = [];
  let hasWaitForSave = false;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // PRESERVED: Extract values from instruction for form fields + ensure AI autofill
    if (step.action === 'fill_form') {
      // PRESERVED: Remove any predefined fields to force AI autofill
      if (step.fields) {
        delete step.fields;
      }
      
      // ENHANCED: Ensure description mentions AI autofill + Record Type
      if (!step.description || !step.description.includes('AI')) {
        step.description = `ENHANCED: AI autofill for form fields (after Record Type selection)`;
      }
      
      console.log('✅ ENHANCED: Enhanced fill_form step for AI autofill + Record Type support');
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
          message: 'ENHANCED: Please save the record to continue (AI autofill + Record Type completed)',
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
    const objectType = detectPrimaryObjectMerged(instruction);
    if (objectType && !instruction.toLowerCase().includes('related')) {
      enhancedSteps.push({
        action: 'capture_record_id',
        variable: `${objectType.toLowerCase()}Id`,
        description: `ENHANCED: Capturing ${objectType} ID after AI autofill + Record Type selection`
      });
    }
  }
  
  return enhancedSteps;
}

/**
 * PRESERVED: Original detectPrimaryObjectMerged - COMPLETE
 */
function detectPrimaryObjectMerged(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes('account')) return 'Account';
  if (lowerInstruction.includes('contact')) return 'Contact';
  if (lowerInstruction.includes('opportunity')) return 'Opportunity';
  if (lowerInstruction.includes('case')) return 'Case';
  if (lowerInstruction.includes('lead')) return 'Lead';
  
  return null;
}

/**
 * PRESERVED: Original generateMergedFallback with Record Type support
 */
function generateMergedFallback(instruction, pageContext) {
  console.log('🧠 ENHANCED: Generating fallback with AI autofill + Record Type support for:', instruction);
  
  const lowerInstruction = instruction.toLowerCase();
  const steps = [];
  
  steps.push({
    action: 'toast',
    message: `🤖 ENHANCED fallback with AI autofill + Record Type support: "${instruction}"`,
    duration: 3000
  });
  
  // PRESERVED: Check if this should be related workflow
  const relatedAnalysis = analyzeForRelatedCreationMerged(instruction, pageContext.currentObject, 'accountId', pageContext);
  
  if (relatedAnalysis.isRelated) {
    console.log('🔗 ENHANCED: Using related workflow with AI autofill + Record Type support in fallback');
    const relatedSteps = generateMergedRelatedListSteps(
      instruction,
      relatedAnalysis.targetObject,
      relatedAnalysis.relatedListName,
      'accountId',
      'Account'
    );
    steps.push(...relatedSteps);
    return steps;
  }
  
  // PRESERVED: Regular object creation with AI autofill + Record Type support
  if (lowerInstruction.includes('account')) {
    steps.push({
      action: 'navigate_app_launcher',
      objectName: 'Accounts'
    });
    steps.push({
      action: 'fill_form',
      description: 'ENHANCED: AI autofill for Account form (Record Type aware fallback)'
    });
    steps.push({
      action: 'wait_for_save',
      message: 'ENHANCED: Please save the Account record (AI autofill + Record Type completed)',
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
      description: 'ENHANCED: AI autofill for Contact form (Record Type aware fallback)'
    });
    steps.push({
      action: 'wait_for_save',
      message: 'ENHANCED: Please save the Contact record (AI autofill + Record Type completed)',
      autoSave: true
    });
  }
  
  return steps;
}

/**
 * PRESERVED: Original matchInstructionToTemplateMerged with Record Type support
 */
function matchInstructionToTemplateMerged(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  // ENHANCED: Templates now use AI autofill + Record Type support instead of predefined fields
  if (lowerInstruction.includes('account')) {
    return ENHANCED_AUTOMATION_TEMPLATES.create_account;
  }
  
  if (lowerInstruction.includes('contact')) {
    return ENHANCED_AUTOMATION_TEMPLATES.create_contact;
  }
  
  if (lowerInstruction.includes('opportunity')) {
    return ENHANCED_AUTOMATION_TEMPLATES.create_opportunity;
  }
  
  return null;
}

/**
 * PRESERVED: Original handleDirectAutofillMerged - COMPLETE
 */
async function handleDirectAutofillMerged(tabId) {
  console.log('🤖 ENHANCED: Handling direct autofill request for tab:', tabId);
  
  try {
    updateStatus('ENHANCED: Starting direct AI autofill...');
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'extractFields'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("ENHANCED: Content script not ready, injecting...");
          
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
                action: 'extractFields'
              }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  updateStatus('ENHANCED: Direct autofill completed!');
                  resolve(response);
                }
              });
            }, 1000);
          });
        } else {
          updateStatus('ENHANCED: Direct autofill completed!');
          resolve(response);
        }
      });
    });
    
  } catch (error) {
    updateStatus(`ENHANCED: Direct autofill failed: ${error.message}`);
    throw error;
  }
}

/**
 * PRESERVED: Original updateStatus - COMPLETE
 */
function updateStatus(message) {
  console.log('📢 ENHANCED Background: Status update:', message);
  latestStatus = message;
}

/**
 * ENHANCED: Predefined automation templates with AI autofill + Record Type support
 */
const ENHANCED_AUTOMATION_TEMPLATES = {
  'create_account': {
    name: 'ENHANCED Create Account with AI + Record Type Support',
    steps: [
      { action: 'toast', message: '🚀 ENHANCED: Starting Account creation with AI autofill + Record Type support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Accounts', description: 'Opening Accounts' },
      { action: 'fill_form', description: 'ENHANCED: AI autofill for Account form (after Record Type selection)' },
      { action: 'wait_for_save', message: 'ENHANCED: Please save the Account record (AI autofill + Record Type completed)', autoSave: true },
      { action: 'capture_record_id', variable: 'accountId' }
    ]
  },
  'create_contact': {
    name: 'ENHANCED Create Contact with AI + Record Type Support',
    steps: [
      { action: 'toast', message: '🚀 ENHANCED: Starting Contact creation with AI autofill + Record Type support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Contacts', description: 'Opening Contacts' },
      { action: 'fill_form', description: 'ENHANCED: AI autofill for Contact form (after Record Type selection)' },
      { action: 'wait_for_save', message: 'ENHANCED: Please save the Contact record (AI autofill + Record Type completed)', autoSave: true },
      { action: 'capture_record_id', variable: 'contactId' }
    ]
  },
  'create_opportunity': {
    name: 'ENHANCED Create Opportunity with AI + Record Type Support',
    steps: [
      { action: 'toast', message: '🚀 ENHANCED: Starting Opportunity creation with AI autofill + Record Type support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Opportunities', description: 'Opening Opportunities' },
      { action: 'fill_form', description: 'ENHANCED: AI autofill for Opportunity form (after Record Type selection)' },
      { action: 'wait_for_save', message: 'ENHANCED: Please save the Opportunity record (AI autofill + Record Type completed)', autoSave: true },
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
        console.log("ENHANCED: Content script not ready, injecting...");
        
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

console.log('✅ ENHANCED: Complete background script with ALL original autofill functionality preserved + Record Type handling loaded successfully');
