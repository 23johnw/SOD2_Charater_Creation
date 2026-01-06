const fs = require('fs');
const path = require('path');

// Read trait IDs from XML file
const xmlPath = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595', 'Ashley Lawson (Ashley)');
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Extract all trait IDs
const traitIdPattern = /<PropertyName>TraitResourceID<\/PropertyName>[\s\S]*?<Value>(.*?)<\/Value>/g;
const traitIds = new Set();
let match;
while ((match = traitIdPattern.exec(xmlContent)) !== null) {
    const traitId = match[1].trim();
    if (traitId && traitId !== '') {
        traitIds.add(traitId);
    }
}

console.log(`Found ${traitIds.size} unique trait IDs from XML`);

// Read CSV traits
const csvPath = path.join(__dirname, '..', 'Sod2 Charater Traits', 'Character', 'SOD2 Charaters Traits.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim());

// Parse CSV
const csvTraits = [];
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    
    if (values.length >= headers.length) {
        const trait = {};
        headers.forEach((header, idx) => {
            trait[header] = values[idx] || '';
        });
        if (trait.Name && trait.Name.trim()) {
            csvTraits.push(trait);
        }
    }
}

console.log(`Found ${csvTraits.length} traits in CSV`);

// Create mapping: CSV Name -> Game TraitResourceID
const mapping = {};
const reverseMapping = {}; // Game ID -> CSV Name

// Try to match CSV names with game IDs
csvTraits.forEach(csvTrait => {
    const csvName = csvTrait.Name.trim();
    if (!csvName) return;
    
    // Convert CSV name to possible game ID formats
    // Remove special characters and normalize
    let cleanName = csvName
        .replace(/[▶✗✓⚠]/g, '') // Remove special symbols
        .replace(/[.,!?;:'"]/g, '') // Remove punctuation
        .trim();
    
    const normalizedName = cleanName.replace(/\s+/g, ''); // Remove spaces (camelCase)
    const underscoreName = cleanName.replace(/\s+/g, '_'); // Spaces to underscores
    const pascalCaseName = cleanName.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(''); // PascalCase (no spaces)
    
    // Try to find matching game ID
    let matchedId = null;
    
    // Direct match
    if (traitIds.has(csvName)) {
        matchedId = csvName;
    } else if (traitIds.has(underscoreName)) {
        matchedId = underscoreName;
    } else if (traitIds.has(normalizedName)) {
        matchedId = normalizedName;
    } else if (traitIds.has(pascalCaseName)) {
        matchedId = pascalCaseName;
    } else {
        // Try fuzzy matching - search for trait IDs that contain the normalized name
        const normalizedLower = normalizedName.toLowerCase();
        for (const traitId of traitIds) {
            const traitIdNormalized = traitId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (traitIdNormalized.includes(normalizedLower) || normalizedLower.includes(traitIdNormalized)) {
                // Check if it's a reasonable match (not too different in length)
                if (Math.abs(traitIdNormalized.length - normalizedLower.length) <= 5) {
                    matchedId = traitId;
                    break;
                }
            }
        }
    }
    
    if (!matchedId) {
        // Try pattern matching
        // Career traits: {SkillCategory}_Career_{Name}
        // Also check for complex patterns like Wits_Resourcefulness_Career_{Name}
        const careerPatterns = [
            `Fighting_Career_${underscoreName}`,
            `Wits_Career_${underscoreName}`,
            `Cardio_Career_${underscoreName}`,
            `Shooting_Career_${underscoreName}`,
            `Minor_Career_${underscoreName}`,
            `Combo_Career_${underscoreName}`,
            `Fighting_Career_${pascalCaseName}`,
            `Wits_Career_${pascalCaseName}`,
            `Cardio_Career_${pascalCaseName}`,
            `Shooting_Career_${pascalCaseName}`,
            `Minor_Career_${pascalCaseName}`,
            `Combo_Career_${pascalCaseName}`,
            // Complex patterns
            `Wits_Resourcefulness_Career_${pascalCaseName}`,
            `Wits_Scouting_Career_${pascalCaseName}`,
            `Shooting_Gunslinging_Career_${pascalCaseName}`,
            `Mechanics_Career_${pascalCaseName}`,
            `Mechanics_Engineering_Career_${pascalCaseName}`,
            `Gardening_Agriculture_Career_${pascalCaseName}`
        ];
        
        for (const pattern of careerPatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                break;
            }
        }
        
        // Hobby traits: {SkillCategory}_Hobby_{Name}
        if (!matchedId) {
            const hobbyPatterns = [
                `Fighting_Hobby_${underscoreName}`,
                `Wits_Hobby_${underscoreName}`,
                `Cardio_Hobby_${underscoreName}`,
                `Shooting_Hobby_${underscoreName}`,
                `Utilities_Hobby_${underscoreName}`,
                `Combo_Hobby_${underscoreName}`,
                `Fighting_Hobby_${pascalCaseName}`,
                `Wits_Hobby_${pascalCaseName}`,
                `Cardio_Hobby_${pascalCaseName}`,
                `Shooting_Hobby_${pascalCaseName}`,
                `Utilities_Hobby_${pascalCaseName}`,
                `Combo_Hobby_${pascalCaseName}`
            ];
            
            for (const pattern of hobbyPatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
        
        // Attribute traits: {Category}_Attribute_{Name}
        if (!matchedId) {
            const attributePatterns = [
                `Old_Attribute_${underscoreName}`,
                `Young_Attribute_${underscoreName}`,
                `MiddleAge_Attribute_${underscoreName}`,
                `Stamina_Attribute_${underscoreName}`,
                `Minor_Attribute_${underscoreName}`,
                `Old_Attribute_${pascalCaseName}`,
                `Young_Attribute_${pascalCaseName}`,
                `MiddleAge_Attribute_${pascalCaseName}`,
                `Stamina_Attribute_${pascalCaseName}`,
                `Minor_Attribute_${pascalCaseName}`
            ];
            
            for (const pattern of attributePatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
        
        // Filler traits: Filler_{Name}
        if (!matchedId) {
            const fillerPatterns = [
                `Filler_${underscoreName}`,
                `Filler_${pascalCaseName}`
            ];
            for (const pattern of fillerPatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
        
        // Philosophy traits: Philosophy_{Philosophy}_{Name}
        if (!matchedId) {
            const philosophyPatterns = [
                `Philosophy_Prudent_${pascalCaseName}`,
                `Philosophy_Pragmatic_${pascalCaseName}`,
                `Philosophy_Daring_${pascalCaseName}`,
                `Philosophy_Compassionate_${pascalCaseName}`,
                `Philosophy_Aggressive_${pascalCaseName}`,
                `Philosophy_Combo_${pascalCaseName}`
            ];
            for (const pattern of philosophyPatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
        
        // Special category patterns
        if (!matchedId) {
            const specialPatterns = [
                `Coffee_Career_${pascalCaseName}`,
                `Coffee_Career_${underscoreName}`,
                `Alcohol_Career_${pascalCaseName}`,
                `Alcohol_Attribute_${pascalCaseName}`,
                `Alcohol_Hobby_${pascalCaseName}`,
                `Animals_Career_${pascalCaseName}`,
                `Business_Career_${pascalCaseName}`
            ];
            for (const pattern of specialPatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
        
        // After traits: {SkillCategory}_After_{Name}
        if (!matchedId) {
            const afterPatterns = [
                `Cardio_After_${underscoreName}`,
                `Wits_After_${underscoreName}`,
                `Fighting_After_${underscoreName}`,
                `Shooting_After_${underscoreName}`,
                `Beds_After_${underscoreName}`
            ];
            
            for (const pattern of afterPatterns) {
                if (traitIds.has(pattern)) {
                    matchedId = pattern;
                    break;
                }
            }
        }
    }
    
    if (matchedId) {
        mapping[csvName] = matchedId;
        reverseMapping[matchedId] = csvName;
    }
});

console.log(`\nMatched ${Object.keys(mapping).length} traits`);

// Save mapping to JSON
const mappingPath = path.join(__dirname, 'data', 'trait-id-mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
console.log(`\nSaved mapping to ${mappingPath}`);

// Save reverse mapping
const reverseMappingPath = path.join(__dirname, 'data', 'trait-id-reverse-mapping.json');
fs.writeFileSync(reverseMappingPath, JSON.stringify(reverseMapping, null, 2));
console.log(`Saved reverse mapping to ${reverseMappingPath}`);

// Show some examples
console.log('\n=== Sample Mappings ===');
const sampleKeys = Object.keys(mapping).slice(0, 20);
sampleKeys.forEach(key => {
    console.log(`"${key}" -> "${mapping[key]}"`);
});

// Show unmatched CSV traits (first 20)
const unmatched = csvTraits.filter(t => !mapping[t.Name.trim()]).slice(0, 20);
if (unmatched.length > 0) {
    console.log('\n=== Sample Unmatched CSV Traits ===');
    unmatched.forEach(t => {
        console.log(`"${t.Name}"`);
    });
}

