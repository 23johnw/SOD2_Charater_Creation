const fs = require('fs');
const path = require('path');

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,     // deletion
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j - 1] + 1 // substitution
                );
            }
        }
    }
    
    return matrix[len1][len2];
}

// Calculate similarity percentage
function similarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return ((maxLen - distance) / maxLen) * 100;
}

// Normalize string for matching
function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
        .trim();
}

// Extract base name from game ID (remove prefixes)
function extractBaseName(gameId) {
    // Remove common prefixes
    const prefixes = [
        'Fighting_Career_', 'Wits_Career_', 'Cardio_Career_', 'Shooting_Career_',
        'Minor_Career_', 'Combo_Career_',
        'Fighting_Hobby_', 'Wits_Hobby_', 'Cardio_Hobby_', 'Shooting_Hobby_',
        'Utilities_Hobby_', 'Combo_Hobby_',
        'Old_Attribute_', 'Young_Attribute_', 'MiddleAge_Attribute_', 'MiddleAged_Attribute_',
        'Stamina_Attribute_', 'Minor_Attribute_',
        'Filler_',
        'Philosophy_Prudent_', 'Philosophy_Pragmatic_', 'Philosophy_Daring_',
        'Philosophy_Compassionate_', 'Philosophy_Aggressive_', 'Philosophy_Combo_',
        'Wits_Resourcefulness_Career_', 'Wits_Scouting_Career_',
        'Shooting_Gunslinging_Career_', 'Mechanics_Career_',
        'Mechanics_Engineering_Career_', 'Gardening_Agriculture_Career_',
        'Coffee_Career_', 'Alcohol_Career_', 'Alcohol_Attribute_', 'Alcohol_Hobby_',
        'Animals_Career_', 'Business_Career_',
        'Cardio_After_', 'Wits_After_', 'Fighting_After_', 'Shooting_After_', 'Beds_After_',
        'Cardio_Acrobatics_Career_', 'Cardio_Backpacking_Career_',
        'Cardio_Marathon_Career_', 'Cardio_Powerhouse_Career_'
    ];
    
    let baseName = gameId;
    for (const prefix of prefixes) {
        if (baseName.startsWith(prefix)) {
            baseName = baseName.substring(prefix.length);
            break;
        }
    }
    
    return baseName;
}

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
const reverseMapping = {};
const unmatched = [];
const matchReasons = {};

// Try to match CSV names with game IDs
csvTraits.forEach(csvTrait => {
    const csvName = csvTrait.Name.trim();
    if (!csvName) return;
    
    // Skip invalid entries
    if (csvName.includes('▶') || csvName.includes('much worse') || 
        csvName.includes('something wrong') || csvName.length < 2) {
        return;
    }
    
    // Convert CSV name to possible game ID formats
    let cleanName = csvName
        .replace(/[▶✗✓⚠]/g, '')
        .replace(/[.,!?;:'"]/g, '')
        .trim();
    
    const normalizedName = cleanName.replace(/\s+/g, ''); // Remove spaces (camelCase)
    const underscoreName = cleanName.replace(/\s+/g, '_'); // Spaces to underscores
    const pascalCaseName = cleanName.split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(''); // PascalCase (no spaces)
    
    // Strategy 1: Direct exact match
    let matchedId = null;
    let matchReason = null;
    
    if (traitIds.has(csvName)) {
        matchedId = csvName;
        matchReason = 'exact';
    } else if (traitIds.has(underscoreName)) {
        matchedId = underscoreName;
        matchReason = 'underscore';
    } else if (traitIds.has(normalizedName)) {
        matchedId = normalizedName;
        matchReason = 'normalized';
    } else if (traitIds.has(pascalCaseName)) {
        matchedId = pascalCaseName;
        matchReason = 'pascalCase';
    }
    
    // Strategy 2: Pattern matching with prefixes
    if (!matchedId) {
        const careerPatterns = [
            `Fighting_Career_${underscoreName}`, `Wits_Career_${underscoreName}`,
            `Cardio_Career_${underscoreName}`, `Shooting_Career_${underscoreName}`,
            `Minor_Career_${underscoreName}`, `Combo_Career_${underscoreName}`,
            `Fighting_Career_${pascalCaseName}`, `Wits_Career_${pascalCaseName}`,
            `Cardio_Career_${pascalCaseName}`, `Shooting_Career_${pascalCaseName}`,
            `Minor_Career_${pascalCaseName}`, `Combo_Career_${pascalCaseName}`,
            `Wits_Resourcefulness_Career_${pascalCaseName}`,
            `Wits_Scouting_Career_${pascalCaseName}`,
            `Shooting_Gunslinging_Career_${pascalCaseName}`,
            `Mechanics_Career_${pascalCaseName}`,
            `Mechanics_Engineering_Career_${pascalCaseName}`,
            `Gardening_Agriculture_Career_${pascalCaseName}`,
            `Coffee_Career_${pascalCaseName}`, `Alcohol_Career_${pascalCaseName}`,
            `Animals_Career_${pascalCaseName}`, `Business_Career_${pascalCaseName}`
        ];
        
        for (const pattern of careerPatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                matchReason = 'career_pattern';
                break;
            }
        }
    }
    
    // Strategy 3: Hobby patterns
    if (!matchedId) {
        const hobbyPatterns = [
            `Fighting_Hobby_${underscoreName}`, `Wits_Hobby_${underscoreName}`,
            `Cardio_Hobby_${underscoreName}`, `Shooting_Hobby_${underscoreName}`,
            `Utilities_Hobby_${underscoreName}`, `Combo_Hobby_${underscoreName}`,
            `Fighting_Hobby_${pascalCaseName}`, `Wits_Hobby_${pascalCaseName}`,
            `Cardio_Hobby_${pascalCaseName}`, `Shooting_Hobby_${pascalCaseName}`,
            `Utilities_Hobby_${pascalCaseName}`, `Combo_Hobby_${pascalCaseName}`
        ];
        
        for (const pattern of hobbyPatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                matchReason = 'hobby_pattern';
                break;
            }
        }
    }
    
    // Strategy 4: Attribute patterns
    if (!matchedId) {
        const attributePatterns = [
            `Old_Attribute_${underscoreName}`, `Young_Attribute_${underscoreName}`,
            `MiddleAge_Attribute_${underscoreName}`, `Stamina_Attribute_${underscoreName}`,
            `Minor_Attribute_${underscoreName}`,
            `Old_Attribute_${pascalCaseName}`, `Young_Attribute_${pascalCaseName}`,
            `MiddleAge_Attribute_${pascalCaseName}`, `Stamina_Attribute_${pascalCaseName}`,
            `Minor_Attribute_${pascalCaseName}`, `Alcohol_Attribute_${pascalCaseName}`
        ];
        
        for (const pattern of attributePatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                matchReason = 'attribute_pattern';
                break;
            }
        }
    }
    
    // Strategy 5: Filler patterns
    if (!matchedId) {
        const fillerPatterns = [
            `Filler_${underscoreName}`, `Filler_${pascalCaseName}`
        ];
        
        for (const pattern of fillerPatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                matchReason = 'filler_pattern';
                break;
            }
        }
    }
    
    // Strategy 6: Philosophy patterns
    if (!matchedId) {
        const philosophyPatterns = [
            `Philosophy_Prudent_${pascalCaseName}`, `Philosophy_Pragmatic_${pascalCaseName}`,
            `Philosophy_Daring_${pascalCaseName}`, `Philosophy_Compassionate_${pascalCaseName}`,
            `Philosophy_Aggressive_${pascalCaseName}`, `Philosophy_Combo_${pascalCaseName}`
        ];
        
        for (const pattern of philosophyPatterns) {
            if (traitIds.has(pattern)) {
                matchedId = pattern;
                matchReason = 'philosophy_pattern';
                break;
            }
        }
    }
    
    // Strategy 7: Reverse matching - extract base names from game IDs and match
    if (!matchedId) {
        const csvNormalized = normalizeString(csvName);
        let bestMatch = null;
        let bestSimilarity = 0;
        
        for (const gameId of traitIds) {
            const baseName = extractBaseName(gameId);
            const gameNormalized = normalizeString(baseName);
            
            // Try exact match first
            if (csvNormalized === gameNormalized) {
                matchedId = gameId;
                matchReason = 'reverse_exact';
                break;
            }
            
            // Try fuzzy match
            const sim = similarity(csvNormalized, gameNormalized);
            if (sim > bestSimilarity && sim >= 85) {
                bestSimilarity = sim;
                bestMatch = gameId;
            }
        }
        
        if (!matchedId && bestMatch) {
            matchedId = bestMatch;
            matchReason = `reverse_fuzzy_${Math.round(bestSimilarity)}`;
        }
    }
    
    // Strategy 8: Partial word matching
    if (!matchedId) {
        const csvWords = csvName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let bestMatch = null;
        let bestScore = 0;
        
        for (const gameId of traitIds) {
            const baseName = extractBaseName(gameId).toLowerCase();
            let score = 0;
            
            for (const word of csvWords) {
                if (baseName.includes(word) || word.includes(baseName)) {
                    score += word.length;
                }
            }
            
            if (score > bestScore && score >= csvName.length * 0.5) {
                bestScore = score;
                bestMatch = gameId;
            }
        }
        
        if (bestMatch) {
            matchedId = bestMatch;
            matchReason = 'partial_word';
        }
    }
    
    if (matchedId) {
        mapping[csvName] = matchedId;
        reverseMapping[matchedId] = csvName;
        matchReasons[csvName] = matchReason;
    } else {
        unmatched.push({
            name: csvName,
            description: csvTrait.Description || '',
            providedSkill: csvTrait['Provided Skill(s)'] || ''
        });
    }
});

console.log(`\nMatched ${Object.keys(mapping).length} traits`);
console.log(`Unmatched: ${unmatched.length}`);

// Show match reason statistics
const reasonStats = {};
Object.values(matchReasons).forEach(reason => {
    reasonStats[reason] = (reasonStats[reason] || 0) + 1;
});
console.log('\n=== Match Reason Statistics ===');
Object.entries(reasonStats).sort((a, b) => b[1] - a[1]).forEach(([reason, count]) => {
    console.log(`${reason}: ${count}`);
});

// Save mapping to JSON
const mappingPath = path.join(__dirname, 'data', 'trait-id-mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
console.log(`\nSaved mapping to ${mappingPath}`);

// Save reverse mapping
const reverseMappingPath = path.join(__dirname, 'data', 'trait-id-reverse-mapping.json');
fs.writeFileSync(reverseMappingPath, JSON.stringify(reverseMapping, null, 2));
console.log(`Saved reverse mapping to ${reverseMappingPath}`);

// Create unmatched traits analysis
const analysis = {
    total: csvTraits.length,
    matched: Object.keys(mapping).length,
    unmatched: unmatched.length,
    matchRate: ((Object.keys(mapping).length / csvTraits.length) * 100).toFixed(1) + '%',
    unmatchedTraits: unmatched.slice(0, 100), // First 100 for analysis
    suggestions: {}
};

// Analyze unmatched traits for patterns
unmatched.forEach(trait => {
    const name = trait.name.toLowerCase();
    const skill = (trait.providedSkill || '').toLowerCase();
    
    // Suggest possible patterns
    if (skill.includes('hairdressing') || name.includes('stylist') || name.includes('barber')) {
        analysis.suggestions[trait.name] = 'Possible Fighting_Career_ pattern';
    } else if (skill.includes('driving') || name.includes('carrier') || name.includes('driver')) {
        analysis.suggestions[trait.name] = 'Possible Wits_Career_ pattern';
    } else if (skill.includes('backpacking') || name.includes('backpack')) {
        analysis.suggestions[trait.name] = 'Possible Cardio_Career_ or Filler_Backpacking pattern';
    } else if (skill) {
        analysis.suggestions[trait.name] = `Has provided skill: ${trait.providedSkill}`;
    }
});

const analysisPath = path.join(__dirname, 'data', 'unmatched-traits-analysis.json');
fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
console.log(`Saved analysis to ${analysisPath}`);

// Show some examples
console.log('\n=== Sample Mappings ===');
const sampleKeys = Object.keys(mapping).slice(0, 30);
sampleKeys.forEach(key => {
    console.log(`"${key}" -> "${mapping[key]}" (${matchReasons[key]})`);
});

// Show unmatched CSV traits (first 30)
if (unmatched.length > 0) {
    console.log('\n=== Sample Unmatched CSV Traits ===');
    unmatched.slice(0, 30).forEach(t => {
        console.log(`"${t.name}"${t.providedSkill ? ` (Skill: ${t.providedSkill})` : ''}`);
    });
}

