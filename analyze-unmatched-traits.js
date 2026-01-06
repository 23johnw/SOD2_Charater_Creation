const fs = require('fs');
const path = require('path');

console.log('Analyzing unmatched traits...\n');

// Load unmatched traits
const analysis = JSON.parse(fs.readFileSync('data/unmatched-traits-analysis.json', 'utf8'));
const unmatched = analysis.unmatchedTraits;

// Load all UILists mappings
const uilistsPath = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595', 'Unpacked', 'DesktopUI', 'UILists.cs');
const content = fs.readFileSync(uilistsPath, 'utf8');

// Extract all trait mappings from UILists
const uilistsMappings = {};
const pattern1 = /dictionary3\.Add\("([^"]+)",\s*new\s+TraitObject\("([^"]+)",\s*"([^"]+)"\)/g;
let match;
while ((match = pattern1.exec(content)) !== null) {
    uilistsMappings[match[2]] = match[1];
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

traitObjects.forEach(trait => {
    const nextAdd = addCalls.find(add => 
        add.position > trait.position && 
        add.position < trait.position + 50000 &&
        add.gameString === trait.gameString
    );
    if (nextAdd || !uilistsMappings[trait.displayName]) {
        uilistsMappings[trait.displayName] = trait.gameString;
    }
});

// Manually add the ones we know
uilistsMappings['Cautious'] = 'Philosophy_Prudent_Cautious';
uilistsMappings['Loved to Hunt'] = 'Minor_Hobby_LovedHunting';
uilistsMappings['Messy'] = 'Morale_Attribute_Messy';
uilistsMappings['Preschool Teacher'] = 'Hygiene_Career_PreschoolTeacher';

console.log(`Found ${Object.keys(uilistsMappings).length} traits in UILists.cs\n`);

// Function to find similar traits
function findSimilarTraits(csvName, uilistsMappings) {
    const csvLower = csvName.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const csvWords = csvLower.split(/\s+/).filter(w => w.length > 2);
    
    const similar = [];
    
    for (const [displayName, gameString] of Object.entries(uilistsMappings)) {
        const displayLower = displayName.toLowerCase();
        let score = 0;
        let matchingWords = [];
        
        // Check for exact substring match
        if (displayLower.includes(csvLower) || csvLower.includes(displayLower)) {
            score += 50;
        }
        
        // Count matching words
        for (const csvWord of csvWords) {
            if (displayLower.includes(csvWord)) {
                score += csvWord.length;
                matchingWords.push(csvWord);
            }
        }
        
        // Check for key phrases
        const keyPhrases = [
            'red talon', 'contractor', 'pioneer', 'engineer', 'enthusiast',
            'learned', 'trained', 'physically', 'mentally', 'fighting', 'shooting',
            'vigilant', 'filthy', 'noisy', 'talks', 'no filter', 'boundaries',
            'left for dead', 'short change', 'taxidermist', 'camping'
        ];
        
        for (const phrase of keyPhrases) {
            if (csvLower.includes(phrase) && displayLower.includes(phrase)) {
                score += 20;
            }
        }
        
        if (score > 10) {
            similar.push({
                displayName,
                gameString,
                score,
                matchingWords: matchingWords.join(', ')
            });
        }
    }
    
    return similar.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Create comparison report
const report = {
    unmatchedCount: unmatched.length,
    unmatchedTraits: [],
    summary: `Found ${unmatched.length} unmatched traits out of ${analysis.total} total traits (${analysis.matchRate} match rate)`
};

unmatched.forEach(trait => {
    const csvName = trait.name.replace(/\n/g, ' ').trim();
    const similar = findSimilarTraits(csvName, uilistsMappings);
    
    report.unmatchedTraits.push({
        csvName: trait.name,
        csvNameClean: csvName,
        description: trait.description,
        providedSkill: trait.providedSkill,
        similarTraits: similar.map(s => ({
            displayName: s.displayName,
            gameString: s.gameString,
            score: s.score,
            matchingWords: s.matchingWords
        }))
    });
});

// Save report
const reportPath = path.join(__dirname, 'data', 'unmatched-traits-comparison.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Also create a readable text report
let textReport = `UNMATCHED TRAITS ANALYSIS\n`;
textReport += `========================\n\n`;
textReport += `Total unmatched: ${unmatched.length} out of ${analysis.total} (${analysis.matchRate} match rate)\n\n`;

unmatched.forEach((trait, idx) => {
    const csvName = trait.name.replace(/\n/g, ' ').trim();
    textReport += `${idx + 1}. "${csvName}"\n`;
    textReport += `   Description: ${trait.description.replace(/\n/g, ' ').substring(0, 80)}...\n`;
    if (trait.providedSkill) {
        textReport += `   Provides Skill: ${trait.providedSkill}\n`;
    }
    
    const similar = findSimilarTraits(csvName, uilistsMappings);
    if (similar.length > 0) {
        textReport += `   \n   Possible matches from UILists.cs:\n`;
        similar.forEach((s, i) => {
            textReport += `   ${i + 1}. "${s.displayName}" -> "${s.gameString}" (score: ${s.score}, matches: ${s.matchingWords || 'none'})\n`;
        });
    } else {
        textReport += `   \n   No similar traits found in UILists.cs\n`;
    }
    textReport += `\n`;
});

const textReportPath = path.join(__dirname, 'data', 'unmatched-traits-comparison.txt');
fs.writeFileSync(textReportPath, textReport);

console.log(`Created comparison report:`);
console.log(`  - JSON: ${reportPath}`);
console.log(`  - Text: ${textReportPath}\n`);

console.log('=== UNMATCHED TRAITS WITH SUGGESTIONS ===\n');
unmatched.forEach((trait, idx) => {
    const csvName = trait.name.replace(/\n/g, ' ').trim();
    console.log(`${idx + 1}. "${csvName}"`);
    if (trait.providedSkill) {
        console.log(`   Skill: ${trait.providedSkill}`);
    }
    
    const similar = findSimilarTraits(csvName, uilistsMappings);
    if (similar.length > 0) {
        console.log(`   Possible matches:`);
        similar.slice(0, 3).forEach(s => {
            console.log(`     - "${s.displayName}" -> "${s.gameString}" (score: ${s.score})`);
        });
    } else {
        console.log(`   No similar matches found`);
    }
    console.log('');
});

console.log(`\n✅ Analysis complete! Check the files for full details.`);

