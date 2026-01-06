// CSV to JSON Converter for SOD2 Character Generator
// This script converts all CSV files to JSON format for the web app

const fs = require('fs');
const path = require('path');

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length > 0 && values[0]) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            data.push(obj);
        }
    }
    
    return data;
}

// Convert a CSV file to JSON
function convertCSVToJSON(csvPath, jsonPath) {
    try {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const data = parseCSV(csvContent);
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✓ Converted: ${path.basename(csvPath)} -> ${path.basename(jsonPath)}`);
        return true;
    } catch (error) {
        console.error(`✗ Error converting ${csvPath}:`, error.message);
        return false;
    }
}

// Main conversion function
function main() {
    const traitsDir = path.join(__dirname, '..', 'Sod2 Charater Traits');
    const outputDir = path.join(__dirname, 'data');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('Converting CSV files to JSON...\n');
    
    // Convert Voices
    const voicesDir = path.join(traitsDir, 'Voices');
    if (fs.existsSync(voicesDir)) {
        const maleVoices = path.join(voicesDir, 'Male Voices.csv');
        const femaleVoices = path.join(voicesDir, 'Female Voices.csv');
        if (fs.existsSync(maleVoices)) convertCSVToJSON(maleVoices, path.join(outputDir, 'maleVoices.json'));
        if (fs.existsSync(femaleVoices)) convertCSVToJSON(femaleVoices, path.join(outputDir, 'femaleVoices.json'));
    }
    
    // Convert Character data
    const characterDir = path.join(traitsDir, 'Character');
    if (fs.existsSync(characterDir)) {
        const culturalBg = path.join(characterDir, 'Cultral Background .csv');
        const humanDef = path.join(characterDir, 'Humans Defifnitions.csv');
        const traits = path.join(characterDir, 'SOD2 Charaters Traits.csv');
        if (fs.existsSync(culturalBg)) convertCSVToJSON(culturalBg, path.join(outputDir, 'culturalBackgrounds.json'));
        if (fs.existsSync(humanDef)) convertCSVToJSON(humanDef, path.join(outputDir, 'humanDefinitions.json'));
        if (fs.existsSync(traits)) convertCSVToJSON(traits, path.join(outputDir, 'traits.json'));
    }
    
    // Convert Skills
    const skillsDir = path.join(traitsDir, 'Skills');
    if (fs.existsSync(skillsDir)) {
        const coreSkills = path.join(skillsDir, 'The Core Skills (The Big 4).csv');
        const communitySkills = path.join(skillsDir, 'The 5th Skills (Community Skills).csv');
        const quirkSkills = path.join(skillsDir, 'The Quirk Skills (Unique-Rare).csv');
        const redTalon = path.join(skillsDir, 'Red Talon Elite Skills.csv');
        if (fs.existsSync(coreSkills)) convertCSVToJSON(coreSkills, path.join(outputDir, 'coreSkills.json'));
        if (fs.existsSync(communitySkills)) convertCSVToJSON(communitySkills, path.join(outputDir, 'communitySkills.json'));
        if (fs.existsSync(quirkSkills)) convertCSVToJSON(quirkSkills, path.join(outputDir, 'quirkSkills.json'));
        if (fs.existsSync(redTalon)) convertCSVToJSON(redTalon, path.join(outputDir, 'redTalonSkills.json'));
    }
    
    // Convert Equipment
    const equipmentDir = path.join(traitsDir, 'Equipment');
    if (fs.existsSync(equipmentDir)) {
        const backpack = path.join(equipmentDir, 'BackPack.csv');
        if (fs.existsSync(backpack)) convertCSVToJSON(backpack, path.join(outputDir, 'backpacks.json'));
    }
    
    // Convert Weapons (combine all weapon types)
    const weaponsDir = path.join(traitsDir, 'Weapons');
    if (fs.existsSync(weaponsDir)) {
        const weaponFiles = {
            'Asssult Weapons.csv': 'assaultWeapons',
            'Assult Shotguns.csv': 'assaultShotguns',
            'Rifles.csv': 'rifles',
            'Shotguns.csv': 'shotguns',
            'Crossbow.csv': 'crossbows',
            'Close Combat weapons.csv': 'closeCombatWeapons'
        };
        
        const sidearmFiles = {
            'Pistols.csv': 'pistols',
            'Revolvers.csv': 'revolvers',
            'Assulted Pistols.csv': 'assaultPistols',
            'Sidearm Shotguns.csv': 'sidearmShotguns',
            'Sidearm Assault Shotguns.csv': 'sidearmAssaultShotguns'
        };
        
        // Primary weapons
        Object.entries(weaponFiles).forEach(([fileName, jsonName]) => {
            const filePath = path.join(weaponsDir, fileName);
            if (fs.existsSync(filePath)) {
                convertCSVToJSON(filePath, path.join(outputDir, `${jsonName}.json`));
            }
        });
        
        // Sidearms
        const sidearmsDir = path.join(weaponsDir, 'SideArms');
        if (fs.existsSync(sidearmsDir)) {
            Object.entries(sidearmFiles).forEach(([fileName, jsonName]) => {
                const filePath = path.join(sidearmsDir, fileName);
                if (fs.existsSync(filePath)) {
                    convertCSVToJSON(filePath, path.join(outputDir, `${jsonName}.json`));
                }
            });
        }
    }
    
    console.log('\n✓ Conversion complete!');
}

main();

