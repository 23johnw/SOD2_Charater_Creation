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

// Manually add the three traits that weren't extracted (they exist in UILists.cs)
if (!mappings['Cautious']) {
    mappings['Cautious'] = 'Philosophy_Prudent_Cautious';
}
if (!mappings['Loved to Hunt']) {
    mappings['Loved to Hunt'] = 'Minor_Hobby_LovedHunting';
}
if (!mappings['Messy']) {
    mappings['Messy'] = 'Morale_Attribute_Messy';
}

console.log(`Extracted ${Object.keys(mappings).length} trait mappings from UILists.cs`);
console.log(`  - Pattern 1 (direct Add): ${count1}`);
console.log(`  - Pattern 2 (traitObject + Add): ${count2}`);
console.log(`  - Manually added: 3\n`);

// Now match with CSV traits
console.log('Matching with CSV traits...\n');

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

console.log(`Found ${csvTraits.length} traits in CSV\n`);

// Create final mapping: CSV Name -> Game TraitResourceID
const finalMapping = {};
const matched = [];
const unmatched = [];

csvTraits.forEach(csvTrait => {
    const csvName = csvTrait.Name.trim();
    if (!csvName || csvName.includes('▶') || csvName.includes('much worse') || 
        csvName.includes('something wrong') || csvName.length < 2) {
        return;
    }
    
    // Debug: Check for the three problematic traits
    if (csvName === 'Cautious' || csvName === 'Loved to Hunt' || csvName === 'Messy') {
        console.log(`DEBUG: Looking for "${csvName}"`);
        console.log(`  - In mappings: ${mappings[csvName] ? `YES -> "${mappings[csvName]}"` : 'NO'}`);
        const caseMatch = Object.keys(mappings).find(k => k.toLowerCase() === csvName.toLowerCase());
        console.log(`  - Case-insensitive match: ${caseMatch ? `"${caseMatch}" -> "${mappings[caseMatch]}"` : 'NO'}`);
        // Show all keys that contain the name
        const partialMatches = Object.keys(mappings).filter(k => k.toLowerCase().includes(csvName.toLowerCase()) || csvName.toLowerCase().includes(k.toLowerCase()));
        if (partialMatches.length > 0) {
            console.log(`  - Partial matches: ${partialMatches.slice(0, 5).map(k => `"${k}"`).join(', ')}`);
        }
    }
    
    // Try exact match first
    if (mappings[csvName]) {
        finalMapping[csvName] = mappings[csvName];
        matched.push({ csvName, gameString: mappings[csvName], matchType: 'exact' });
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
    const csvWords = csvName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [displayName, gameString] of Object.entries(mappings)) {
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

if (unmatched.length > 0) {
    console.log('\n=== Sample Unmatched Traits ===');
    unmatched.slice(0, 20).forEach(t => {
        console.log(`"${t.name}"${t.providedSkill ? ` (Skill: ${t.providedSkill})` : ''}`);
    });
}

console.log(`\n✅ Done! Match rate: ${analysis.matchRate}`);

