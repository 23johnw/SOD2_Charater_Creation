const fs = require('fs');
const path = require('path');

// Load data files
const traitsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/traits.json'), 'utf8'));
const traitIdMapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/trait-id-mapping.json'), 'utf8'));

// Buff parsing function (reused from dataLoader.js)
function parseBuffs(effects) {
    if (!effects || effects === 'Affects Skills') return [];
    const buffList = [];
    
    // Clean the effects string to remove special characters that might interfere
    const cleanEffects = effects.replace(/[▶✗✓⚠]/g, '').trim();
    
    // Look for patterns like "+100%", "-20", "+10 Health", etc.
    const buffPatterns = [
        // Pattern for "Max Health" or "Max Stamina" - must match "Max" followed by stat
        /([+-]?\d+)\s+Max\s+(Health|Stamina|Stamina Recovery|Health Recovery)/gi,
        // Pattern for just "Health" or "Stamina" without "Max"
        /([+-]?\d+)\s+(Health|Stamina)(?!\s*(Max|Recovery))/gi,
        /([+-]?\d+%?)\s*(Experience Rate|Exp Rate|Experience|Exp)/gi,
        /([+-]?\d+)\s*(Morale|Standing|Influence)/gi,
        /([+-]?\d+%?)\s*(Damage|Resistance|Speed|Carry Capacity)/gi
    ];
    
    buffPatterns.forEach(pattern => {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(cleanEffects)) !== null) {
            const value = match[1];
            let stat = '';
            
            // Handle "Max Health" or "Max Stamina" pattern
            if (match[2] && (match[2] === 'Health' || match[2] === 'Stamina' || match[2].includes('Recovery'))) {
                stat = 'Max ' + match[2];
            } else if (match[2]) {
                stat = match[2];
            } else if (match[3]) {
                stat = match[3];
            }
            
            if (value && stat) {
                if (!buffList.some(b => b.stat === stat.trim() && b.value === value)) {
                    buffList.push({ value, stat: stat.trim() });
                }
            }
        }
    });
    
    // Also check for simple patterns like "+10 Health" or "-5 Stamina" (fallback)
    const simplePattern = /([+-]?\d+)\s+(Health|Stamina|Morale|Standing)/gi;
    simplePattern.lastIndex = 0;
    let simpleMatch;
    while ((simpleMatch = simplePattern.exec(cleanEffects)) !== null) {
        const value = simpleMatch[1];
        const stat = simpleMatch[2];
        if (!buffList.some(b => (b.stat === stat || b.stat === 'Max ' + stat) && b.value === value)) {
            buffList.push({ value, stat });
        }
    }
    
    return buffList;
}

// Check if trait name is a fragment
function isFragment(name) {
    if (!name || name.length < 2) return true;
    
    const trimmedName = name.trim();
    
    // Check if it's a buff string
    const isBuffString = /^[▶\s]*[+-]?\d+\s+(Max\s+)?(Health|Stamina|Morale|Standing|Influence|Experience|Exp|Damage|Resistance|Speed|Carry Capacity)/i.test(trimmedName);
    if (isBuffString) return true;
    
    // Check for fragments: lowercase start, punctuation end, short length
    const startsWithLowercase = /^[a-z]/.test(trimmedName);
    const endsWithPunctuation = /[.!?]$/.test(trimmedName);
    
    if (endsWithPunctuation && trimmedName.length < 25) return true;
    if (startsWithLowercase && trimmedName.length < 30) return true;
    if (startsWithLowercase && endsWithPunctuation) return true;
    
    // Check for known invalid patterns
    if (trimmedName.includes('▶') || 
        trimmedName.includes('much worse') || 
        trimmedName.includes('something wrong') || 
        trimmedName.includes('way to deal')) {
        return true;
    }
    
    return false;
}

// Determine trait type
function getTraitType(positive, negative) {
    if (positive && !negative) return 'good';
    if (negative && !positive) return 'bad';
    if (positive && negative) return 'mixed';
    return 'neutral';
}

// Categorize trait
function getCategory(name) {
    if (name.includes('Descriptor_Age_')) return 'descriptor_age';
    if (name.includes('Descriptor_Pronoun_')) return 'descriptor_pronoun';
    if (name.includes('Descriptor_Philosophy_')) return 'descriptor_philosophy';
    if (name.includes('_Career_')) return 'career';
    if (name.includes('_Attribute_')) return 'attribute';
    if (name.includes('_Hobby_')) return 'hobby';
    if (name.includes('Filler_')) return 'filler';
    if (name.includes('injury') || name.includes('trauma') || name.includes('rippedchunk')) return 'injury';
    if (name === 'Default' || name === 'Starter') return 'required';
    return 'other';
}

// Build curated traits table
const curatedTraits = [];

// Create a lookup map for traits by name
const traitsByName = {};
traitsRaw.forEach(trait => {
    const name = trait.Name || '';
    if (name) {
        traitsByName[name] = trait;
    }
});

// Process each trait in the mapping file
let processed = 0;
let skipped = 0;

for (const [traitName, traitResourceID] of Object.entries(traitIdMapping)) {
    // Skip if it's a fragment
    if (isFragment(traitName)) {
        skipped++;
        continue;
    }
    
    // Find the trait in the raw data
    const rawTrait = traitsByName[traitName];
    if (!rawTrait) {
        skipped++;
        continue;
    }
    
    // Get effects and description
    let positiveEffects = rawTrait['Positive Effect(s)'] || '';
    let negativeEffects = rawTrait['Negative Effect(s)'] || '';
    let description = rawTrait.Description || '';
    let descriptionWasUsedForBuffs = false;
    
    // If effects are empty but description has buff info, extract from description
    if (!positiveEffects && !negativeEffects && description) {
        if (/\d+\s*(Health|Stamina|Morale|Max)/i.test(description)) {
            if (description.includes('+') || !description.includes('-')) {
                positiveEffects = description;
            } else {
                negativeEffects = description;
            }
            descriptionWasUsedForBuffs = true;
        }
    }
    
    // Parse buffs
    const positiveBuffs = parseBuffs(positiveEffects);
    const negativeBuffs = parseBuffs(negativeEffects);
    const buffs = [];
    
    // Combine and mark positive/negative
    positiveBuffs.forEach(b => { 
        b.type = 'positive';
        // Ensure value has correct sign
        if (!String(b.value).startsWith('+') && !String(b.value).startsWith('-')) {
            b.value = '+' + b.value;
        }
        buffs.push(b); 
    });
    negativeBuffs.forEach(b => { 
        b.type = 'negative';
        // Ensure value has correct sign
        if (!String(b.value).startsWith('+') && !String(b.value).startsWith('-')) {
            b.value = '-' + b.value;
        }
        buffs.push(b); 
    });
    
    // Clean description
    let finalDescription = description;
    if (descriptionWasUsedForBuffs) {
        finalDescription = ''; // Don't show buff text as description
    } else if (finalDescription) {
        finalDescription = finalDescription.replace(/[▶✗✓⚠]/g, '').trim();
    }
    
    // Determine trait type and category
    const traitType = getTraitType(positiveEffects, negativeEffects);
    const category = getCategory(traitName);
    
    // Skip required/descriptor traits (they're handled separately)
    if (category === 'required' || 
        category === 'descriptor_age' || 
        category === 'descriptor_pronoun' || 
        category === 'descriptor_philosophy') {
        skipped++;
        continue;
    }
    
    // Create curated trait entry
    curatedTraits.push({
        name: traitName,
        description: finalDescription,
        traitResourceID: traitResourceID,
        traitType: traitType,
        category: category,
        buffs: buffs,
        providedSkill: rawTrait['Provided Skill(s)'] || '',
        heroBonus: rawTrait['Provided Hero Bonus'] || ''
    });
    
    processed++;
}

// Sort by name for easier reading
curatedTraits.sort((a, b) => a.name.localeCompare(b.name));

// Write to file
const outputPath = path.join(__dirname, 'data/traits-curated.json');
fs.writeFileSync(outputPath, JSON.stringify(curatedTraits, null, 2), 'utf8');

console.log(`✓ Created curated traits table`);
console.log(`  Processed: ${processed} traits`);
console.log(`  Skipped: ${skipped} traits (fragments, missing data, or descriptors)`);
console.log(`  Output: ${outputPath}`);

