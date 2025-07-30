// ENHANCED UNIVERSAL: Complete background.js with UNIVERSAL UI SUPPORT for ALL Salesforce layouts

let latestStatus = 'Idle'; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle automation step generation with universal UI support
  if (request.action === 'generateAutomationSteps') {
    handleUniversalStepGeneration(request.data)
      .then((response) => {
        console.log('🌟 UNIVERSAL: Generated automation steps with universal UI support successfully');
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('🌟 UNIVERSAL: Step generation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  // Handle status updates
  if (request.type === "statusUpdate") {
    console.log("[🌟 UNIVERSAL Background] Status update:", request.message);
    latestStatus = request.message;
  } else if (request.type === "getStatus") {
    sendResponse({ message: latestStatus });
    return true;
  }
  
  // Handle direct autofill requests with universal support
  if (request.action === 'triggerAutofill') {
    handleUniversalDirectAutofill(request.tabId)
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
 * 🌟 UNIVERSAL: Enhanced step generation with universal UI support for ALL Salesforce layouts
 */
async function handleUniversalStepGeneration(requestData) {
  const { instruction, pageContext, tabId } = requestData;

  console.log('🌟 UNIVERSAL: Processing instruction with universal UI support + AI autofill:', instruction);
  console.log('📄 Page context:', pageContext);

  try {
    // Update status
    updateStatus('🌟 UNIVERSAL: Analyzing instruction with universal UI support...');
    
    // Enhanced parsing with universal UI awareness
    const sequentialSteps = parseSequentialInstructionUniversal(instruction);
    
    if (sequentialSteps.length > 1) {
      console.log(`✅ UNIVERSAL: Found ${sequentialSteps.length} sequential steps:`, sequentialSteps);
      updateStatus(`🌟 UNIVERSAL: Processing ${sequentialSteps.length} sequential steps with universal UI handling...`);
      
      const allAutomationSteps = await generateSequentialAutomationUniversal(sequentialSteps, pageContext);
      await executeSteps(tabId, allAutomationSteps, instruction);
      
      updateStatus('🌟 UNIVERSAL: Sequential automation with universal UI support completed successfully!');
      
      return {
        success: true,
        message: `🌟 UNIVERSAL Sequential automation: ${sequentialSteps.length} steps`,
        stepCount: allAutomationSteps.length,
        template: 'sequential-universal',
        sequentialSteps: sequentialSteps
      };
    }
    
    // Single step processing with universal UI support
    const templateSteps = matchInstructionToUniversalTemplate(instruction);
    
    if (templateSteps) {
      console.log('✅ UNIVERSAL: Matched universal template:', templateSteps.name);
      updateStatus(`🌟 UNIVERSAL: Using template: ${templateSteps.name}`);
      
      await executeSteps(tabId, templateSteps.steps, instruction);
      
      updateStatus('🌟 UNIVERSAL: Template automation completed!');
      
      return {
        success: true,
        message: `🌟 UNIVERSAL Template: ${templateSteps.name}`,
        stepCount: templateSteps.steps.length,
        template: templateSteps.name
      };
    }
    
    // Use enhanced Gemini with universal UI prompting
    console.log('🤖 UNIVERSAL: Using Gemini with universal UI support...');
    updateStatus('🌟 UNIVERSAL: Generating AI automation steps for all UI patterns...');
    
    const geminiSteps = await generateStepsWithUniversalUIPrompt(instruction, pageContext);
    
    await executeSteps(tabId, geminiSteps, instruction);
    
    updateStatus('🌟 UNIVERSAL: AI automation with universal UI support completed!');
    
    return {
      success: true,
      message: '🌟 UNIVERSAL AI-generated with universal UI support',
      stepCount: geminiSteps.length,
      template: 'gemini-universal'
    };

  } catch (error) {
    console.error('🌟 UNIVERSAL: Step generation failed:', error);
    updateStatus(`🌟 UNIVERSAL: Automation failed: ${error.message}`);
    throw new Error(`🌟 UNIVERSAL Automation failed: ${error.message}`);
  }
}

/**
 * 🌟 UNIVERSAL: Enhanced sequential instruction parsing
 */
function parseSequentialInstructionUniversal(instruction) {
  console.log('📝 UNIVERSAL: Parsing sequential instruction with universal UI awareness:', instruction);
  
  const steps = [];
  
  // Enhanced patterns for sequential steps with UI flexibility
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
  
  // Fallback - split by line breaks and separators
  if (steps.length <= 1) {
    console.log('🔍 UNIVERSAL: Using line-based parsing with UI awareness...');
    
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
  console.log('📋 UNIVERSAL: Parsed sequential steps with UI awareness:', steps);
  return steps;
}

/**
 * 🌟 UNIVERSAL: Generate sequential automation with universal UI support
 */
async function generateSequentialAutomationUniversal(sequentialSteps, pageContext) {
  console.log('🎯 UNIVERSAL: Generating sequential automation with universal UI support...');
  
  const allSteps = [];
  let parentRecordVariable = null;
  let parentRecordType = null;
  
  allSteps.push({
    action: 'toast',
    message: `🌟 UNIVERSAL Sequential Automation: ${sequentialSteps.length} steps with universal UI support`,
    duration: 4000
  });
  
  for (let i = 0; i < sequentialSteps.length; i++) {
    const step = sequentialSteps[i];
    
    allSteps.push({
      action: 'toast',
      message: `📋 UNIVERSAL Step ${step.number}: ${step.action}`,
      duration: 3000
    });
    
    // Enhanced related record detection with universal UI awareness
    const relatedAnalysis = analyzeForRelatedCreationUniversal(step.action, parentRecordType, parentRecordVariable, pageContext);
    
    if (relatedAnalysis.isRelated && parentRecordVariable) {
      console.log('🔗 UNIVERSAL: Using related workflow with universal UI support for:', relatedAnalysis.targetObject);
      
      // Generate universal Related List steps
      const relatedSteps = generateUniversalRelatedListSteps(
        step.action, 
        relatedAnalysis.targetObject,
        relatedAnalysis.relatedListName,
        parentRecordVariable, 
        parentRecordType
      );
      allSteps.push(...relatedSteps);
    } else {
      // Use enhanced Gemini with universal UI support
      try {
        const stepAutomation = await generateStepsWithUniversalUIPrompt(step.action, pageContext);
        allSteps.push(...stepAutomation);
        
        const createsParent = detectParentRecordCreationUniversal(step.action);
        if (createsParent) {
          parentRecordType = createsParent.objectType;
          parentRecordVariable = createsParent.variable;
          console.log(`✅ UNIVERSAL: Detected parent record: ${parentRecordType} (${parentRecordVariable})`);
        }
      } catch (error) {
        console.error(`❌ UNIVERSAL: Gemini failed for step ${step.number}:`, error);
        const fallbackSteps = generateUniversalFallback(step.action, pageContext);
        allSteps.push(...fallbackSteps);
      }
    }
  }
  
  allSteps.push({
    action: 'toast',
    message: `🎉 UNIVERSAL: All ${sequentialSteps.length} steps completed with universal UI support!`,
    duration: 5000
  });
  
  return allSteps;
}

/**
 * 🌟 UNIVERSAL: Enhanced related creation analysis
 */
function analyzeForRelatedCreationUniversal(stepAction, parentRecordType, parentRecordVariable, pageContext) {
  console.log(`🎯 UNIVERSAL ANALYSIS: "${stepAction}"`);
  console.log(`   Parent context: ${parentRecordType} (${parentRecordVariable})`);
  console.log(`   Page context: ${pageContext.currentObject} page`);
  
  if (!parentRecordType || !parentRecordVariable) {
    console.log('   ❌ No parent context available');
    return { isRelated: false };
  }
  
  const lowerAction = stepAction.toLowerCase();
  
  // Enhanced related detection with UI pattern awareness
  const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the', 'under that', 'under the', 'link to', 'attach to', 'associate with'];
  const hasRelatedKeyword = relatedKeywords.some(keyword => lowerAction.includes(keyword));
  
  // Check if we're on a record page and creating different object type
  const isOnRecordPage = pageContext.currentObject && pageContext.currentObject !== 'Home';
  const isDifferentObjectType = pageContext.currentObject && 
                               !lowerAction.includes(pageContext.currentObject.toLowerCase());
  
  console.log('   Has related keyword:', hasRelatedKeyword);
  console.log('   Is on record page:', isOnRecordPage);
  console.log('   Is different object type:', isDifferentObjectType);
  
  if (!hasRelatedKeyword && !isDifferentObjectType) {
    console.log('   ❌ Not a related creation - will use App Launcher with universal UI support');
    return { isRelated: false };
  }
  
  console.log('   ✅ This appears to be related creation - analyzing object type...');
  
  // Enhanced detection patterns with universal UI mapping
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
    { keywords: ['contract'], object: 'Contract', list: 'Contracts' },
    { keywords: ['quote'], object: 'Quote', list: 'Quotes' },
    { keywords: ['asset'], object: 'Asset', list: 'Assets' },
    { keywords: ['activity'], object: 'Activity', list: 'Activities' }
  ];
  
  // Check each pattern
  for (const pattern of objectPatterns) {
    for (const keyword of pattern.keywords) {
      if (lowerAction.includes(keyword)) {
        console.log(`   ✅ UNIVERSAL MATCH: ${pattern.object} via keyword: ${keyword}`);
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
 * 🌟 UNIVERSAL: Generate universal Related List steps
 */
function generateUniversalRelatedListSteps(stepAction, targetObject, relatedListName, parentRecordVariable, parentRecordType) {
  console.log(`🔗 UNIVERSAL: Generating related steps for ${targetObject} in ${relatedListName} with universal UI support`);
  
  return [
    {
      action: 'toast',
      message: `🔗 UNIVERSAL: Creating related ${targetObject} with universal UI support`,
      duration: 3000
    },
    {
      action: 'navigate_to_related_tab',
      description: '🌟 UNIVERSAL: Navigate to Related tab (all UI patterns)'
    },
    {
      action: 'wait',
      duration: 4000,
      description: '🌟 UNIVERSAL: Wait for Related tab to load'
    },
    {
      action: 'click_related_list_new',
      relatedListName: relatedListName,
      targetObject: targetObject,
      parentRecordVariable: parentRecordVariable,
      description: `🌟 UNIVERSAL: Click New in ${relatedListName} list (universal UI aware)`
    },
    {
      action: 'wait',
      duration: 3000,
      description: '🌟 UNIVERSAL: Wait for form to load (universal Record Type handling)'
    },
    {
      action: 'fill_related_form',
      objectType: targetObject,
      originalInstruction: stepAction,
      description: `🌟 UNIVERSAL: Fill ${targetObject} form with universal AI autofill`
    },
    {
      action: 'wait_for_save',
      message: `🌟 UNIVERSAL: Please save the ${targetObject} record (auto-save in 10 seconds)`,
      autoSave: true
    },
    {
      action: 'toast',
      message: `✅ UNIVERSAL: ${targetObject} created with universal UI support and linked to ${parentRecordType}!`,
      duration: 4000
    }
  ];
}

/**
 * 🌟 UNIVERSAL: Enhanced Gemini prompt with universal UI support
 */
async function generateStepsWithUniversalUIPrompt(instruction, pageContext) {
  const API_KEY = "AIzaSyAWpSq4nTD377qg4J4n7bxWiTifvz43IDU";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const geminiPrompt = `
You are an expert Salesforce automation specialist with UNIVERSAL UI SUPPORT across ALL Salesforce interface layouts. Generate automation steps for: "${instruction}"

🌟 CRITICAL UNIVERSAL UI AWARENESS:
Your automation must work on ANY Salesforce UI pattern:
- Standard Lightning Experience
- Lightning Console Apps  
- List Views (like the one shown in user's screenshot)
- Classic layouts
- Lightning App Builder pages
- Custom Lightning components
- Service Console layouts
- Sales Console layouts
- Mobile responsive layouts

🚨 UNIVERSAL NEW BUTTON DETECTION STRATEGY:
The New button can appear in various locations depending on UI:
1. Top-right header controls: .slds-page-header__controls
2. List view toolbars: .listViewControls
3. Button groups: .slds-button-group
4. Dropdown menus: lightning-button-menu
5. Lightning button components: lightning-button[title="New"]
6. Standard buttons: button[title="New"]
7. Custom positioned buttons anywhere on page

🤖 UNIVERSAL AI AUTOFILL INTEGRATION:
ALL form filling must use universal AI autofill that works across all UI patterns!

🔄 UNIVERSAL WORKFLOW DECISION:
IF instruction mentions "related", "to that", "to the", "for that" OR user is on record page with different object → Use Related List workflow with universal UI support
ELSE → Use App Launcher workflow with universal UI support

🎯 UNIVERSAL RECORD TYPE + AI AUTOFILL FLOW:
1. Use UNIVERSAL New button detection across all UI patterns
2. Handle Record Type modal if it appears (works on all layouts)
3. AI analyzes form fields universally regardless of UI structure
4. AI generates realistic values for all field types
5. Universal field filling that works on all Lightning patterns
6. Auto-save with universal button detection

🧠 UNIVERSAL AI AUTOFILL RULES:
1. NEVER use manual "fill_form" with predefined fields
2. ALWAYS use "fill_form" action WITHOUT fields parameter to trigger universal AI autofill
3. Universal AI automatically detects and handles:
   - Standard Lightning fields
   - Lightning component fields  
   - Custom component fields
   - Different picklist implementations
   - Various date/time pickers
   - All input patterns across UI variations
4. Works on list views, console apps, and custom layouts

UNIVERSAL APP LAUNCHER WORKFLOW:
[
  {"action": "toast", "message": "🌟 UNIVERSAL: Creating [OBJECT] with universal UI support", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "[OBJECT]s"},
  {"action": "fill_form", "description": "🌟 UNIVERSAL: AI autofill for [OBJECT] form (works on all UI patterns)"},
  {"action": "wait_for_save", "message": "🌟 UNIVERSAL: Please save the [OBJECT]", "autoSave": true},
  {"action": "capture_record_id", "variable": "[object]Id"}
]

UNIVERSAL RELATED LIST WORKFLOW:
[
  {"action": "toast", "message": "🔗 UNIVERSAL: Creating related [OBJECT] with universal UI support", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "[OBJECT]s", "targetObject": "[OBJECT]"},
  {"action": "fill_form", "description": "🌟 UNIVERSAL: AI autofill for [OBJECT] form (universal UI patterns)"},
  {"action": "wait_for_save", "message": "🌟 UNIVERSAL: Please save the [OBJECT]", "autoSave": true}
]

🎯 UNIVERSAL EXAMPLES:

Instruction: "Create account name TestAyush28"
[
  {"action": "toast", "message": "🌟 UNIVERSAL: Creating Account with universal UI support", "duration": 2000},
  {"action": "navigate_app_launcher", "objectName": "Accounts"},
  {"action": "fill_form", "description": "🌟 UNIVERSAL: AI autofill for Account (extracts TestAyush28 + works on all UI patterns)"},
  {"action": "wait_for_save", "message": "🌟 UNIVERSAL: Please save the Account", "autoSave": true},
  {"action": "capture_record_id", "variable": "accountId"}
]

Instruction: "Create related contact to that account"
[
  {"action": "toast", "message": "🔗 UNIVERSAL: Creating related Contact with universal UI support", "duration": 3000},
  {"action": "navigate_to_related_tab"},
  {"action": "click_related_list_new", "relatedListName": "Contacts", "targetObject": "Contact"},
  {"action": "fill_form", "description": "🌟 UNIVERSAL: AI autofill for Contact (works on all UI patterns including list views)"},
  {"action": "wait_for_save", "message": "🌟 UNIVERSAL: Please save the Contact", "autoSave": true}
]

🚨 CRITICAL UNIVERSAL REQUIREMENTS:
1. NEVER include "fields" parameter in "fill_form" action
2. Universal AI autofill handles ALL field types across ALL UI patterns
3. Always include "description" explaining universal UI awareness
4. Always include "wait_for_save" with autoSave: true
5. Always include "capture_record_id" for parent records
6. Universal AI includes 10-second completion wait automatically
7. Record Type selection works universally across all layouts
8. New button detection uses multiple strategies for all UI patterns

ENHANCED UNIVERSAL FLOW SUMMARY:
1. Universal Navigate → Universal New Button Detection → Universal Record Type → Universal Form
2. Universal AI analyzes ALL form fields regardless of UI structure
3. Universal AI generates realistic business values for each field type
4. Universal AI fills ALL fields intelligently across any layout
5. Universal 10-second wait → Universal Auto-save

🌟 UNIVERSAL UI CONTEXT AWARENESS:
- List View UI: New button in header controls or toolbar
- Console UI: New button in workspace tabs or actions
- Standard UI: New button in page header or related lists  
- Custom UI: New button anywhere - use universal detection
- Mobile UI: New button in mobile-optimized locations

Current Context:
- Instruction: "${instruction}"
- Page URL: ${pageContext.url}
- Current Object: ${pageContext.currentObject || 'Home'}
- Is Record Page: ${pageContext.url && pageContext.url.includes('/lightning/r/') ? 'YES' : 'NO'}
- UI Pattern: ${detectUIPattern(pageContext)}

Generate automation steps as JSON array with UNIVERSAL UI SUPPORT that works on ANY Salesforce layout:
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
    console.log('🌟 UNIVERSAL Gemini raw response:', rawResponse);
    
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

    // Enhance steps with universal UI support
    const enhancedSteps = enhanceStepsWithUniversalUI(steps, instruction, pageContext);

    console.log('✅ UNIVERSAL: Generated', enhancedSteps.length, 'steps with universal UI support');
    return enhancedSteps;

  } catch (error) {
    console.error('❌ UNIVERSAL: Gemini failed:', error);
    
    // Universal fallback
    return generateUniversalFallback(instruction, pageContext);
  }
}

/**
 * 🌟 UNIVERSAL: Detect UI pattern for context
 */
function detectUIPattern(pageContext) {
  const url = pageContext.url || '';
  
  if (url.includes('/lightning/o/') && !url.includes('/lightning/r/')) {
    return 'LIST_VIEW';
  } else if (url.includes('/lightning/r/')) {
    return 'RECORD_PAGE';
  } else if (url.includes('/lightning/app/')) {
    return 'LIGHTNING_APP';
  } else if (url.includes('/console/')) {
    return 'CONSOLE_APP';
  } else if (url.includes('/builder/')) {
    return 'APP_BUILDER';
  } else {
    return 'STANDARD_LIGHTNING';
  }
}

/**
 * 🌟 UNIVERSAL: Enhance steps with universal UI support
 */
function enhanceStepsWithUniversalUI(steps, instruction, pageContext) {
  const enhancedSteps = [];
  let hasWaitForSave = false;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Enhance fill_form step for universal UI
    if (step.action === 'fill_form') {
      // Remove any predefined fields to force universal AI autofill
      if (step.fields) {
        delete step.fields;
      }
      
      // Ensure description mentions universal UI support
      if (!step.description || !step.description.includes('UNIVERSAL')) {
        step.description = `🌟 UNIVERSAL: AI autofill for form fields (works on all UI patterns)`;
      }
      
      console.log('✅ UNIVERSAL: Enhanced fill_form step for universal UI support');
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
          message: '🌟 UNIVERSAL: Please save the record (universal UI support + AI autofill completed)',
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
    const objectType = detectPrimaryObjectUniversal(instruction);
    if (objectType && !instruction.toLowerCase().includes('related')) {
      enhancedSteps.push({
        action: 'capture_record_id',
        variable: `${objectType.toLowerCase()}Id`,
        description: `🌟 UNIVERSAL: Capturing ${objectType} ID after universal UI processing`
      });
    }
  }
  
  return enhancedSteps;
}

/**
 * 🌟 UNIVERSAL: Detect primary object
 */
function detectPrimaryObjectUniversal(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes('account')) return 'Account';
  if (lowerInstruction.includes('contact')) return 'Contact';
  if (lowerInstruction.includes('opportunity')) return 'Opportunity';
  if (lowerInstruction.includes('case')) return 'Case';
  if (lowerInstruction.includes('lead')) return 'Lead';
  if (lowerInstruction.includes('quote')) return 'Quote';
  if (lowerInstruction.includes('asset')) return 'Asset';
  if (lowerInstruction.includes('contract')) return 'Contract';
  
  return null;
}

/**
 * 🌟 UNIVERSAL: Detect parent record creation
 */
function detectParentRecordCreationUniversal(stepAction) {
  const lowerAction = stepAction.toLowerCase();
  
  const objectMappings = {
    'account': { objectType: 'Account', variable: 'accountId' },
    'contact': { objectType: 'Contact', variable: 'contactId' },
    'opportunity': { objectType: 'Opportunity', variable: 'opportunityId' },
    'case': { objectType: 'Case', variable: 'caseId' },
    'lead': { objectType: 'Lead', variable: 'leadId' },
    'quote': { objectType: 'Quote', variable: 'quoteId' },
    'contract': { objectType: 'Contract', variable: 'contractId' }
  };
  
  for (const [keyword, mapping] of Object.entries(objectMappings)) {
    if (lowerAction.includes(keyword) && 
        (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('make'))) {
      
      // Make sure it's not a "related" creation
      const relatedKeywords = ['related', 'to that', 'to the', 'for that', 'for the'];
      const isRelated = relatedKeywords.some(rel => lowerAction.includes(rel));
      
      if (!isRelated) {
        console.log(`✅ UNIVERSAL: Detected parent record creation: ${mapping.objectType}`);
        return mapping;
      }
    }
  }
  
  return null;
}

/**
 * 🌟 UNIVERSAL: Generate universal fallback
 */
function generateUniversalFallback(instruction, pageContext) {
  console.log('🧠 UNIVERSAL: Generating fallback with universal UI support for:', instruction);
  
  const lowerInstruction = instruction.toLowerCase();
  const steps = [];
  
  steps.push({
    action: 'toast',
    message: `🌟 UNIVERSAL fallback with universal UI support: "${instruction}"`,
    duration: 3000
  });
  
  // Check if this should be related workflow
  const relatedAnalysis = analyzeForRelatedCreationUniversal(instruction, pageContext.currentObject, 'accountId', pageContext);
  
  if (relatedAnalysis.isRelated) {
    console.log('🔗 UNIVERSAL: Using related workflow with universal UI support in fallback');
    const relatedSteps = generateUniversalRelatedListSteps(
      instruction,
      relatedAnalysis.targetObject,
      relatedAnalysis.relatedListName,
      'accountId',
      'Account'
    );
    steps.push(...relatedSteps);
    return steps;
  }
  
  // Regular object creation with universal UI support
  if (lowerInstruction.includes('account')) {
    steps.push({
      action: 'navigate_app_launcher',
      objectName: 'Accounts'
    });
    steps.push({
      action: 'fill_form',
      description: '🌟 UNIVERSAL: AI autofill for Account form (universal UI fallback)'
    });
    steps.push({
      action: 'wait_for_save',
      message: '🌟 UNIVERSAL: Please save the Account record (universal UI completed)',
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
      description: '🌟 UNIVERSAL: AI autofill for Contact form (universal UI fallback)'
    });
    steps.push({
      action: 'wait_for_save',
      message: '🌟 UNIVERSAL: Please save the Contact record (universal UI completed)',
      autoSave: true
    });
  }
  
  return steps;
}

/**
 * 🌟 UNIVERSAL: Match instruction to universal template
 */
function matchInstructionToUniversalTemplate(instruction) {
  const lowerInstruction = instruction.toLowerCase();
  
  // Universal templates with UI support
  if (lowerInstruction.includes('account')) {
    return UNIVERSAL_AUTOMATION_TEMPLATES.create_account;
  }
  
  if (lowerInstruction.includes('contact')) {
    return UNIVERSAL_AUTOMATION_TEMPLATES.create_contact;
  }
  
  if (lowerInstruction.includes('opportunity')) {
    return UNIVERSAL_AUTOMATION_TEMPLATES.create_opportunity;
  }
  
  if (lowerInstruction.includes('case')) {
    return UNIVERSAL_AUTOMATION_TEMPLATES.create_case;
  }
  
  return null;
}

/**
 * 🌟 UNIVERSAL: Handle direct autofill with universal support
 */
async function handleUniversalDirectAutofill(tabId) {
  console.log('🌟 UNIVERSAL: Handling direct autofill request with universal UI support for tab:', tabId);
  
  try {
    updateStatus('🌟 UNIVERSAL: Starting direct AI autofill with universal UI support...');
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'extractFields'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("🌟 UNIVERSAL: Content script not ready, injecting...");
          
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
                  updateStatus('🌟 UNIVERSAL: Direct autofill completed!');
                  resolve(response);
                }
              });
            }, 1000);
          });
        } else {
          updateStatus('🌟 UNIVERSAL: Direct autofill completed!');
          resolve(response);
        }
      });
    });
    
  } catch (error) {
    updateStatus(`🌟 UNIVERSAL: Direct autofill failed: ${error.message}`);
    throw error;
  }
}

/**
 * Update status
 */
function updateStatus(message) {
  console.log('📢 🌟 UNIVERSAL Background: Status update:', message);
  latestStatus = message;
}

/**
 * 🌟 UNIVERSAL: Automation templates with universal UI support
 */
const UNIVERSAL_AUTOMATION_TEMPLATES = {
  'create_account': {
    name: '🌟 UNIVERSAL Create Account with Universal UI Support',
    steps: [
      { action: 'toast', message: '🌟 UNIVERSAL: Starting Account creation with universal UI support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Accounts', description: 'Opening Accounts with universal UI detection' },
      { action: 'fill_form', description: '🌟 UNIVERSAL: AI autofill for Account form (works on all UI patterns)' },
      { action: 'wait_for_save', message: '🌟 UNIVERSAL: Please save the Account record (universal UI support)', autoSave: true },
      { action: 'capture_record_id', variable: 'accountId' }
    ]
  },
  'create_contact': {
    name: '🌟 UNIVERSAL Create Contact with Universal UI Support',
    steps: [
      { action: 'toast', message: '🌟 UNIVERSAL: Starting Contact creation with universal UI support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Contacts', description: 'Opening Contacts with universal UI detection' },
      { action: 'fill_form', description: '🌟 UNIVERSAL: AI autofill for Contact form (works on all UI patterns)' },
      { action: 'wait_for_save', message: '🌟 UNIVERSAL: Please save the Contact record (universal UI support)', autoSave: true },
      { action: 'capture_record_id', variable: 'contactId' }
    ]
  },
  'create_opportunity': {
    name: '🌟 UNIVERSAL Create Opportunity with Universal UI Support',
    steps: [
      { action: 'toast', message: '🌟 UNIVERSAL: Starting Opportunity creation with universal UI support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Opportunities', description: 'Opening Opportunities with universal UI detection' },
      { action: 'fill_form', description: '🌟 UNIVERSAL: AI autofill for Opportunity form (works on all UI patterns)' },
      { action: 'wait_for_save', message: '🌟 UNIVERSAL: Please save the Opportunity record (universal UI support)', autoSave: true },
      { action: 'capture_record_id', variable: 'opportunityId' }
    ]
  },
  'create_case': {
    name: '🌟 UNIVERSAL Create Case with Universal UI Support',
    steps: [
      { action: 'toast', message: '🌟 UNIVERSAL: Starting Case creation with universal UI support...', description: 'Starting automation' },
      { action: 'navigate_app_launcher', objectName: 'Cases', description: 'Opening Cases with universal UI detection' },
      { action: 'fill_form', description: '🌟 UNIVERSAL: AI autofill for Case form (works on all UI patterns)' },
      { action: 'wait_for_save', message: '🌟 UNIVERSAL: Please save the Case record (universal UI support)', autoSave: true },
      { action: 'capture_record_id', variable: 'caseId' }
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
        console.log("🌟 UNIVERSAL: Content script not ready, injecting...");
        
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

console.log('✅ 🌟 UNIVERSAL: Enhanced background script with UNIVERSAL UI SUPPORT for ALL Salesforce layouts loaded successfully');
