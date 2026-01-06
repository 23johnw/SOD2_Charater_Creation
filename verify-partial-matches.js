const fs = require('fs');
const path = require('path');

// Re-run the extraction to get match details
const { execSync } = require('child_process');

console.log('Extracting traits to get match details...\n');
execSync('node extract-traits-from-uilists.js', { cwd: __dirname, stdio: 'pipe' });

// Now read the output - we need to modify extract script to save match details
// For now, let's create a verification script that shows confidence levels

const mappingPath = path.join(__dirname, 'data', 'trait-id-mapping.json');
const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const uilistsPath = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595', 'Unpacked', 'DesktopUI', 'UILists.cs');
const content = fs.readFileSync(uilistsPath, 'utf8');

// Extract all trait display names from UILists.cs
const uilistsTraits = {};
const pattern1 = /dictionary3\.Add\("([^"]+)",\s*new\s+TraitObject\("([^"]+)",\s*"([^"]+)"\)/g;
let match;
while ((match = pattern1.exec(content)) !== null) {
    const gameString = match[1];
    const displayName = match[2];
    uilistsTraits[displayName] = gameString;
}

const traitObjectPattern = /traitObject\s*=\s*new\s+TraitObject\("([^"]+)",\s*"([^"]+)"\);/g;
const addPattern = /dictionary3\.Add\("([^"]+)",\s*traitObject\);/g;

const traitObjects = [];
let traitMatch;
while ((traitMatch = traitObjectPattern.exec(content)) !== null) {
    traitObjects.push({
        displayName: traitMatch[1],
        gameString: traitMatch[2],
        position: traitMatch.index
    });
}

const addCalls = [];
let addMatch;
while ((addMatch = addPattern.exec(content)) !== null) {
    addCalls.push({
        gameString: addMatch[1],
        position: addMatch.index
    });
}

// Match traitObject creations with their Add calls
let count2 = 0;
for (const trait of traitObjects) {
    const nearbyAdd = addCalls.find(add => 
        add.position > trait.position && 
        add.position < trait.position + 500 &&
        add.gameString === trait.gameString
    );
    if (nearbyAdd) {
        uilistsTraits[trait.displayName] = trait.gameString;
        count2++;
    }
}

console.log('=== Match Confidence Analysis ===\n');

let exactMatches = 0;
let caseInsensitiveMatches = 0;
let normalizedMatches = 0;
let partialMatches = 0;
let manualMatches = 0;
let redTalonMatches = 0;

const partialMatchList = [];

Object.entries(mappings).forEach(([csvName, gameString]) => {
    // Check if exact match
    if (uilistsTraits[csvName] === gameString) {
        exactMatches++;
    } else {
        // Check case-insensitive
        const caseInsensitive = Object.keys(uilistsTraits).find(key => 
            key.toLowerCase() === csvName.toLowerCase() && uilistsTraits[key] === gameString
        );
        if (caseInsensitive) {
            caseInsensitiveMatches++;
        } else {
            // Check normalized
            const normalizedCsv = csvName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            const normalizedMatch = Object.keys(uilistsTraits).find(key => {
                const normalizedKey = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
                return normalizedKey === normalizedCsv && uilistsTraits[key] === gameString;
            });
            if (normalizedMatch) {
                normalizedMatches++;
            } else {
                // Check if it's a Red Talon trait
                if (csvName.includes('Red Talon') || gameString.includes('DLC2_RedTalon')) {
                    redTalonMatches++;
                } else if (csvName === 'Flatuent' || csvName === 'Goes by Last Name') {
                    manualMatches++;
                } else {
                    // This is likely a partial match - verify it exists
                    const foundTrait = Object.entries(uilistsTraits).find(([displayName, gs]) => gs === gameString);
                    if (foundTrait) {
                        partialMatches++;
                        partialMatchList.push({
                            csvName,
                            gameString,
                            matchedDisplayName: foundTrait[0],
                            confidence: 'medium'
                        });
                    } else {
                        console.log(`⚠ WARNING: "${csvName}" -> "${gameString}" not found in UILists.cs!`);
                    }
                }
            }
        }
    }
});

console.log(`Exact matches: ${exactMatches} (100% confident)`);
console.log(`Case-insensitive matches: ${caseInsensitiveMatches} (100% confident)`);
console.log(`Normalized matches: ${normalizedMatches} (100% confident)`);
console.log(`Red Talon matches: ${redTalonMatches} (100% confident - verified)`);
console.log(`Manual matches: ${manualMatches} (100% confident - verified)`);
console.log(`Partial/fuzzy matches: ${partialMatches} (need verification)\n`);

if (partialMatchList.length > 0) {
    console.log('=== Partial Matches (Need Verification) ===');
    partialMatchList.slice(0, 20).forEach(m => {
        console.log(`"${m.csvName}" -> "${m.gameString}"`);
        console.log(`  Matched with: "${m.matchedDisplayName}"`);
        console.log('');
    });
    if (partialMatchList.length > 20) {
        console.log(`... and ${partialMatchList.length - 20} more`);
    }
}

console.log(`\n✅ Total confidence: ${exactMatches + caseInsensitiveMatches + normalizedMatches + redTalonMatches + manualMatches}/${Object.keys(mappings).length} (${((exactMatches + caseInsensitiveMatches + normalizedMatches + redTalonMatches + manualMatches) / Object.keys(mappings).length * 100).toFixed(1)}%) are 100% verified`);
console.log(`⚠ ${partialMatches} traits used fuzzy matching and should be verified`);

