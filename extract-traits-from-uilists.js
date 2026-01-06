const fs = require('fs');
const path = require('path');

console.log('Extracting trait mappings from UILists.cs...\n');

const uilistsPath = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595', 'Unpacked', 'DesktopUI', 'UILists.cs');
const content = fs.readFileSync(uilistsPath, 'utf8');

const mappings = {};

// Pattern 1: dictionary3.Add("GameString", new TraitObject("Display Name", "GameString")
const pattern1 = /dictionary3\.Add\("([^"]+)",\s*new\s+TraitObject\("([^"]+)",\s*"([^"]+)"\)/g;
let match;
let count1 = 0;
while ((match = pattern1.exec(content)) !== null) {
    const gameString = match[1];
    const displayName = match[2];
    // Use the gameString from the Add call, not the TraitObject parameter (they should match)
    mappings[displayName] = gameString;
    count1++;
}

// Pattern 2: traitObject = new TraitObject("Display Name", "GameString");
// followed by dictionary3.Add("GameString", traitObject);
// We need to match these in sequence
const traitObjectPattern = /traitObject\s*=\s*new\s+TraitObject\("([^"]+)",\s*"([^"]+)"\);/g;
const addPattern = /dictionary3\.Add\("([^"]+)",\s*traitObject\);/g;

// Find all TraitObject creations with their positions
const traitObjects = [];
let traitMatch;
while ((traitMatch = traitObjectPattern.exec(content)) !== null) {
    traitObjects.push({
        displayName: traitMatch[1],
        gameString: traitMatch[2],
        position: traitMatch.index
    });
}

// Find all dictionary3.Add calls with positions
const addCalls = [];
let addMatch;
while ((addMatch = addPattern.exec(content)) !== null) {
    addCalls.push({
        gameString: addMatch[1],
        position: addMatch.index
    });
}

// Match traitObject creations with their Add calls
// Find the next Add call after each TraitObject that matches the gameString
let count2 = 0;
traitObjects.forEach(trait => {
    // Find the next Add call after this TraitObject (within reasonable distance - 50000 chars to handle large blocks)
    const nextAdd = addCalls.find(add => 
        add.position > trait.position && 
        add.position < trait.position + 50000 &&
        add.gameString === trait.gameString
    );
    if (nextAdd) {
        mappings[trait.displayName] = trait.gameString;
        count2++;
    } else {
        // If no matching Add found, still add the mapping using the gameString from TraitObject
        // This handles cases where the Add might be far away or the pattern is different
        // But only if we haven't already added this display name
        if (!mappings[trait.displayName]) {
            mappings[trait.displayName] = trait.gameString;
            count2++;
        }
    }
});

// Manually add traits that weren't extracted (they exist in UILists.cs)
if (!mappings['Cautious']) {
    mappings['Cautious'] = 'Philosophy_Prudent_Cautious';
}
if (!mappings['Loved to Hunt']) {
    mappings['Loved to Hunt'] = 'Minor_Hobby_LovedHunting';
}
if (!mappings['Messy']) {
    mappings['Messy'] = 'Morale_Attribute_Messy';
}
if (!mappings['Preschool Teacher']) {
    mappings['Preschool Teacher'] = 'Hygiene_Career_PreschoolTeacher';
}
// CSV has typo "Flatuent" but game has "Flatulent"
if (!mappings['Flatulent']) {
    mappings['Flatulent'] = 'Standing_Attribute_Flatulent';
}
// CSV says "Goes by Last Name" but game has "Avoids First Name" (same trait)
if (!mappings['Avoids First Name']) {
    mappings['Avoids First Name'] = 'Minor_Naming_Surname';
}
// These should be extracted but adding manually to ensure they're found
if (!mappings['Learned Computing']) {
    mappings['Learned Computing'] = 'Computers_FromConsumable';
}
if (!mappings['Learned Medicine']) {
    mappings['Learned Medicine'] = 'Medicine_FromConsumable';
}
if (!mappings['Learned to Cook']) {
    mappings['Learned to Cook'] = 'Cooking_FromConsumable';
}
if (!mappings['Learned to Garden']) {
    mappings['Learned to Garden'] = 'Gardening_FromConsumable';
}
if (!mappings['Learned Utilities']) {
    mappings['Learned Utilities'] = 'Utilities_FromConsumable';
}
if (!mappings['Mentally Trained']) {
    mappings['Mentally Trained'] = 'Wits_Respec';
}
if (!mappings['Physically Trained']) {
    mappings['Physically Trained'] = 'Cardio_Respec';
}
if (!mappings['Trained at Fighting']) {
    mappings['Trained at Fighting'] = 'Fighting_Respec';
}
if (!mappings['Trained at Shooting']) {
    mappings['Trained at Shooting'] = 'Shooting_Respec';
}
if (!mappings['Always Vigilant']) {
    mappings['Always Vigilant'] = 'Philosophy_Prudent_AlwaysVigilant';
}
if (!mappings['Filthy']) {
    mappings['Filthy'] = 'Standing_Attribute_Filthy';
}
if (!mappings['Hated Camping']) {
    mappings['Hated Camping'] = 'Minor_Before_HatedCamping';
}
if (!mappings['Lacks Boundaries']) {
    mappings['Lacks Boundaries'] = 'Morale_Attribute_NoBoundaries';
}
if (!mappings['Left for Dead']) {
    mappings['Left for Dead'] = 'Frustration_After_LeftForDead';
}
if (!mappings['No Filter']) {
    mappings['No Filter'] = 'Standing_Attribute_NoFilter';
}
if (!mappings['Noisy']) {
    mappings['Noisy'] = 'Noise_Attribute_Noisy';
}
if (!mappings['Talks Loudly']) {
    mappings['Talks Loudly'] = 'Noise_Attribute_TalksLoudly';
}
if (!mappings['Taxidermist']) {
    mappings['Taxidermist'] = 'Fighting_Career_Taxidermist';
}
// Red Talon traits (CSV has suffix but game doesn't)
if (!mappings['Cooked for the Squad']) {
    mappings['Cooked for the Squad'] = 'DLC2_RedTalon_SquadCook';
}
if (!mappings['Facilities Engineer']) {
    mappings['Facilities Engineer'] = 'DLC2_RedTalon_Infrastructure';
}
if (!mappings['Firearms Enthusiast']) {
    mappings['Firearms Enthusiast'] = 'DLC2_RedTalon_Enthusiast';
}
if (!mappings['Front Line Experience']) {
    mappings['Front Line Experience'] = 'DLC2_RedTalon_Heroism_2';
}
if (!mappings['Practices at the Range']) {
    mappings['Practices at the Range'] = 'DLC2_RedTalon_Warfighting_1';
}
if (!mappings['Worked as a Pioneer']) {
    mappings['Worked as a Pioneer'] = 'DLC2_RedTalon_Pioneer';
}
// Fix incorrect partial matches - these exist as exact traits
if (!mappings['Disorganized']) {
    mappings['Disorganized'] = 'Morale_Attribute_Disorganized';
}
if (!mappings['Erratic']) {
    mappings['Erratic'] = 'Standing_Attribute_Erratic';
}

console.log(`Extracted ${Object.keys(mappings).length} trait mappings from UILists.cs`);
console.log(`  - Pattern 1 (direct Add): ${count1}`);
console.log(`  - Pattern 2 (traitObject + Add): ${count2}`);
const manualCount = Object.keys(mappings).length - count1 - count2;
console.log(`  - Manually added: ${manualCount}\n`);

// Now match with CSV traits
console.log('Matching with CSV traits...\n');

const csvPath = path.join(__dirname, '..', 'Sod2 Charater Traits', 'Character', 'SOD2 Charaters Traits.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(h => h.trim());

// Parse CSV - handle multi-line quoted fields
const csvTraits = [];
let currentLine = '';
let inQuotes = false;

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're continuing a multi-line field
    if (currentLine) {
        currentLine += '\n' + line;
    } else {
        currentLine = line;
    }
    
    // Count quotes to see if we're still in a quoted field
    const quoteCount = (currentLine.match(/"/g) || []).length;
    inQuotes = (quoteCount % 2) !== 0;
    
    // If we're not in quotes, we can parse this line
    if (!inQuotes) {
        const values = [];
        let current = '';
        let inFieldQuotes = false;
        
        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];
            if (char === '"') {
                inFieldQuotes = !inFieldQuotes;
            } else if (char === ',' && !inFieldQuotes) {
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
        
        currentLine = ''; // Reset for next line
    }
}

console.log(`Found ${csvTraits.length} traits in CSV\n`);

// Create final mapping: CSV Name -> Game TraitResourceID
const finalMapping = {};
const matched = [];
const unmatched = [];

csvTraits.forEach(csvTrait => {
    let csvName = csvTrait.Name.trim();
    if (!csvName || csvName.includes('▶') || csvName.includes('much worse') || 
        csvName.includes('something wrong') || csvName.length < 2) {
        return;
    }
    
    // Strip Red Talon suffix from CSV name for matching
    const redTalonSuffix = '\n\n*(Red Talon Contractors only)*';
    let baseName = csvName;
    if (csvName.includes(redTalonSuffix)) {
        baseName = csvName.replace(redTalonSuffix, '').trim();
    }
    
    // Special cases: CSV typos/variations
    if (csvName === 'Flatuent' && mappings['Flatulent']) {
        finalMapping[csvName] = mappings['Flatulent'];
        matched.push({ csvName, gameString: mappings['Flatulent'], matchType: 'manual_typo_fix' });
        return;
    }
    if (csvName === 'Goes by Last Name' && mappings['Avoids First Name']) {
        finalMapping[csvName] = mappings['Avoids First Name'];
        matched.push({ csvName, gameString: mappings['Avoids First Name'], matchType: 'manual_synonym' });
        return;
    }
    
    // Try matching with base name (for Red Talon traits)
    if (baseName !== csvName && mappings[baseName]) {
        finalMapping[csvName] = mappings[baseName];
        matched.push({ csvName, gameString: mappings[baseName], matchType: 'red_talon_suffix_stripped' });
        return;
    }
    
    // Try exact match first (with original name)
    if (mappings[csvName]) {
        finalMapping[csvName] = mappings[csvName];
        matched.push({ csvName, gameString: mappings[csvName], matchType: 'exact' });
        return;
    }
    
    // Try exact match with base name (if different)
    if (baseName !== csvName && mappings[baseName]) {
        finalMapping[csvName] = mappings[baseName];
        matched.push({ csvName, gameString: mappings[baseName], matchType: 'exact_base_name' });
        return;
    }
    
    // Try case-insensitive match
    const lowerCsvName = csvName.toLowerCase().trim();
    const matchingKey = Object.keys(mappings).find(key => key.toLowerCase().trim() === lowerCsvName);
    if (matchingKey) {
        finalMapping[csvName] = mappings[matchingKey];
        matched.push({ csvName, gameString: mappings[matchingKey], matchType: 'case_insensitive' });
        return;
    }
    
    // Try normalized match (remove special characters, extra spaces)
    const normalizedCsv = csvName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedMatch = Object.keys(mappings).find(key => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        return normalizedKey === normalizedCsv;
    });
    if (normalizedMatch) {
        finalMapping[csvName] = mappings[normalizedMatch];
        matched.push({ csvName, gameString: mappings[normalizedMatch], matchType: 'normalized' });
        return;
    }
    
    // Try partial match (CSV name contains key words from display name or vice versa)
    // BUT: Skip if CSV name is an exact substring match of a different trait (avoid matching opposites)
    const csvWords = csvName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = 0;
    
    // Check if there's an exact trait name that's very similar (to avoid matching opposites)
    const exactSimilar = Object.keys(mappings).find(key => {
        const keyLower = key.toLowerCase();
        const csvLower = csvName.toLowerCase();
        // If one is contained in the other and they're very similar, prefer exact
        return (keyLower.includes(csvLower) || csvLower.includes(keyLower)) && 
               Math.abs(keyLower.length - csvLower.length) <= 3;
    });
    
    for (const [displayName, gameString] of Object.entries(mappings)) {
        // Skip if this is an opposite (e.g., "Disorganized" vs "Organized")
        const displayLower = displayName.toLowerCase();
        const csvLower = csvName.toLowerCase();
        
        // Avoid matching opposites
        if ((csvLower.includes('disorgan') && displayLower.includes('organ') && !displayLower.includes('disorgan')) ||
            (csvLower.includes('organ') && !csvLower.includes('disorgan') && displayLower.includes('disorgan'))) {
            continue;
        }
        
        const displayWords = displayName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let score = 0;
        
        // Count matching words
        for (const csvWord of csvWords) {
            if (displayWords.some(dw => dw.includes(csvWord) || csvWord.includes(dw))) {
                score += csvWord.length;
            }
        }
        
        // Also check if display name contains CSV name or vice versa
        if (displayName.toLowerCase().includes(lowerCsvName) || lowerCsvName.includes(displayName.toLowerCase())) {
            score += 10;
        }
        
        // Prefer exact substring matches
        if (exactSimilar && displayName === exactSimilar) {
            score += 20;
        }
        
        if (score > bestScore && score >= csvName.length * 0.6) {
            bestScore = score;
            bestMatch = { displayName, gameString };
        }
    }
    
    if (bestMatch) {
        finalMapping[csvName] = bestMatch.gameString;
        matched.push({ csvName, gameString: bestMatch.gameString, matchType: 'partial', matchedDisplayName: bestMatch.displayName });
    } else {
        unmatched.push({
            name: csvName,
            description: csvTrait.Description || '',
            providedSkill: csvTrait['Provided Skill(s)'] || ''
        });
    }
});

console.log(`Matched ${matched.length} CSV traits with UILists mappings`);
console.log(`Unmatched: ${unmatched.length}\n`);

// Show match type statistics
const matchTypeStats = {};
matched.forEach(m => {
    matchTypeStats[m.matchType] = (matchTypeStats[m.matchType] || 0) + 1;
});
console.log('=== Match Type Statistics ===');
Object.entries(matchTypeStats).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
});
console.log('');

// Save final mapping
const mappingPath = path.join(__dirname, 'data', 'trait-id-mapping.json');
fs.writeFileSync(mappingPath, JSON.stringify(finalMapping, null, 2));
console.log(`Saved ${Object.keys(finalMapping).length} mappings to ${mappingPath}\n`);

// Save unmatched analysis
const analysis = {
    total: csvTraits.length,
    matched: matched.length,
    unmatched: unmatched.length,
    matchRate: ((matched.length / csvTraits.length) * 100).toFixed(1) + '%',
    unmatchedTraits: unmatched.slice(0, 100)
};

const analysisPath = path.join(__dirname, 'data', 'unmatched-traits-analysis.json');
fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
console.log(`Saved analysis to ${analysisPath}\n`);

// Show sample matches
console.log('=== Sample Matches ===');
matched.slice(0, 30).forEach(m => {
    const matchInfo = m.matchType === 'partial' ? ` (matched with "${m.matchedDisplayName}")` : '';
    console.log(`"${m.csvName}" -> "${m.gameString}" [${m.matchType}${matchInfo}]`);
});

// Check for Preschool Teacher specifically and add if missing
const preschoolMatch = matched.find(m => m.csvName.includes('Preschool'));
if (preschoolMatch) {
    console.log(`\n✓ Found Preschool Teacher: "${preschoolMatch.csvName}" -> "${preschoolMatch.gameString}"`);
} else {
    console.log('\n⚠ Preschool Teacher not found in matched list - adding manually');
    // Add it manually if it exists in CSV
    const preschoolCsv = csvTraits.find(t => t.Name && t.Name.trim() === 'Preschool Teacher');
    if (preschoolCsv) {
        if (mappings['Preschool Teacher']) {
            finalMapping['Preschool Teacher'] = mappings['Preschool Teacher'];
            matched.push({ csvName: 'Preschool Teacher', gameString: mappings['Preschool Teacher'], matchType: 'manual' });
            console.log(`  ✓ Added: "Preschool Teacher" -> "${mappings['Preschool Teacher']}"`);
        } else {
            console.log(`  ✗ "Preschool Teacher" not found in UILists mappings`);
        }
    } else {
        console.log(`  ✗ "Preschool Teacher" not found in CSV`);
    }
}

if (unmatched.length > 0) {
    console.log('\n=== Sample Unmatched Traits ===');
    unmatched.slice(0, 20).forEach(t => {
        console.log(`"${t.name}"${t.providedSkill ? ` (Skill: ${t.providedSkill})` : ''}`);
    });
}

console.log(`\n✅ Done! Match rate: ${analysis.matchRate}`);

