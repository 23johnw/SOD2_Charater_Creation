// Process and categorize traits from CSV/JSON
const fs = require('fs');
const path = require('path');

function processTraits() {
    const traitsPath = path.join(__dirname, 'data', 'traits.json');
    const traits = JSON.parse(fs.readFileSync(traitsPath, 'utf-8'));
    
    const processed = traits.map(trait => {
        const name = trait.Name || '';
        const positive = trait['Positive Effect(s)'] || '';
        const negative = trait['Negative Effect(s)'] || '';
        const providedSkill = trait['Provided Skill(s)'] || '';
        const heroBonus = trait['Provided Hero Bonus'] || '';
        
        // Determine if trait is good, bad, or neutral
        let traitType = 'neutral';
        if (positive && !negative) {
            traitType = 'good';
        } else if (negative && !positive) {
            traitType = 'bad';
        } else if (positive && negative) {
            traitType = 'mixed';
        }
        
        // Categorize trait
        let category = 'other';
        const nameLower = name.toLowerCase();
        if (name.includes('Descriptor_Age_') || name.includes('Age')) {
            category = 'descriptor_age';
        } else if (name.includes('Descriptor_Pronoun_') || name.includes('Pronoun')) {
            category = 'descriptor_pronoun';
        } else if (name.includes('Descriptor_Philosophy_') || name.includes('Philosophy')) {
            category = 'descriptor_philosophy';
        } else if (name.includes('_Career_') || name.includes('Career')) {
            category = 'career';
        } else if (name.includes('_Attribute_') || name.includes('Attribute')) {
            category = 'attribute';
        } else if (name.includes('_Hobby_') || name.includes('Hobby')) {
            category = 'hobby';
        } else if (name.includes('Filler_')) {
            category = 'filler';
        } else if (name.includes('injury') || name.includes('trauma') || name.includes('rippedchunk')) {
            category = 'injury';
        } else if (name === 'Default' || name === 'Starter') {
            category = 'required';
        }
        
        return {
            name: name,
            description: trait.Description || '',
            positiveEffects: positive,
            negativeEffects: negative,
            providedSkill: providedSkill,
            heroBonus: heroBonus,
            traitType: traitType, // good, bad, neutral, mixed
            category: category,
            traitResourceID: name // This will need to be mapped to actual TraitResourceID format
        };
    }).filter(t => t.name && t.name.trim() !== '');
    
    // Save processed traits
    const outputPath = path.join(__dirname, 'data', 'traits-processed.json');
    fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2), 'utf-8');
    console.log(`✓ Processed ${processed.length} traits`);
    console.log(`  - Good: ${processed.filter(t => t.traitType === 'good').length}`);
    console.log(`  - Bad: ${processed.filter(t => t.traitType === 'bad').length}`);
    console.log(`  - Mixed: ${processed.filter(t => t.traitType === 'mixed').length}`);
    console.log(`  - Neutral: ${processed.filter(t => t.traitType === 'neutral').length}`);
}

processTraits();

