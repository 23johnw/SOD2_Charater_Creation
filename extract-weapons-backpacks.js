const fs = require('fs');
const path = require('path');

// Read UILists.cs file
const uilistsPath = path.join(__dirname, '..', 'Community Editor-45-5-1-8-1734526595', 'Unpacked', 'DesktopUI', 'UILists.cs');
const uilistsContent = fs.readFileSync(uilistsPath, 'utf8');

// Extract all InventoryObject entries
const inventoryObjectPattern = /new InventoryObject\("([^"]+)",\s*"([^"]+)"\)/g;
const items = new Map(); // Map of display name -> ClassString

let match;
while ((match = inventoryObjectPattern.exec(uilistsContent)) !== null) {
    const displayName = match[1];
    const classString = match[2];
    
    // Skip items that are clearly not weapons/backpacks
    if (classString.includes('/Game/Items/RangedWeapons/') ||
        classString.includes('/Game/Items/MeleeWeapons/') ||
        classString.includes('/Game/Items/BackpackItems/') ||
        classString.includes('/Game/Items/CloseCombatWeapons/')) {
        items.set(displayName, classString);
    }
}

console.log(`Found ${items.size} weapons and backpacks in UILists.cs`);

// Helper function to normalize names for matching
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
}

// Helper function to find best match
function findBestMatch(csvName, itemsMap) {
    const normalized = normalizeName(csvName);
    
    // Try exact match first
    for (const [displayName, classString] of itemsMap.entries()) {
        if (normalizeName(displayName) === normalized) {
            return { displayName, classString };
        }
    }
    
    // Try partial match (CSV name contains display name or vice versa)
    for (const [displayName, classString] of itemsMap.entries()) {
        const normalizedDisplay = normalizeName(displayName);
        if (normalized.includes(normalizedDisplay) || normalizedDisplay.includes(normalized)) {
            return { displayName, classString };
        }
    }
    
    // Try fuzzy match (check if key words match)
    const csvWords = normalized.split(/\s+/);
    for (const [displayName, classString] of itemsMap.entries()) {
        const normalizedDisplay = normalizeName(displayName);
        const displayWords = normalizedDisplay.split(/\s+/);
        
        // Check if at least 2 words match
        const matchingWords = csvWords.filter(word => 
            displayWords.some(dWord => dWord.includes(word) || word.includes(dWord))
        );
        if (matchingWords.length >= 2 && matchingWords.length >= csvWords.length * 0.5) {
            return { displayName, classString };
        }
    }
    
    return null;
}

// Process weapon CSV files
const weaponFiles = [
    { file: 'data/assaultWeapons.json', category: 'assault' },
    { file: 'data/rifles.json', category: 'rifles' },
    { file: 'data/shotguns.json', category: 'shotguns' },
    { file: 'data/pistols.json', category: 'pistols' },
    { file: 'data/revolvers.json', category: 'revolvers' },
    { file: 'data/crossbows.json', category: 'crossbows' },
    { file: 'data/closeCombatWeapons.json', category: 'closeCombat' }
];

const weaponMappings = {};
const unmatchedWeapons = [];

weaponFiles.forEach(({ file, category }) => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${file}`);
        return;
    }
    
    const weapons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\nProcessing ${category}: ${weapons.length} weapons`);
    
    weapons.forEach(weapon => {
        const name = weapon.Name || weapon['Weapon Name'] || '';
        if (!name) return;
        
        const match = findBestMatch(name, items);
        if (match) {
            weaponMappings[name] = {
                displayName: match.displayName,
                classString: match.classString,
                category: category
            };
        } else {
            unmatchedWeapons.push({ name, category });
        }
    });
});

// Process backpack CSV
const backpackPath = path.join(__dirname, 'data', 'backpacks.json');
const backpacks = JSON.parse(fs.readFileSync(backpackPath, 'utf8'));
const backpackMappings = {};
const unmatchedBackpacks = [];

console.log(`\nProcessing backpacks: ${backpacks.length} backpacks`);

backpacks.forEach(backpack => {
    // Backpack CSV has a weird structure, try to get the name
    const name = backpack['All columns are the back pack name'] || 
                 backpack.Name || 
                 Object.values(backpack).find(v => typeof v === 'string' && v.length > 0);
    
    if (!name || name.includes('slots') || name.includes('weight') || name.length < 3) {
        return;
    }
    
    const match = findBestMatch(name, items);
    if (match) {
        backpackMappings[name] = {
            displayName: match.displayName,
            classString: match.classString
        };
    } else {
        unmatchedBackpacks.push({ name });
    }
});

// Save mappings
const weaponMappingPath = path.join(__dirname, 'data', 'weapon-id-mapping.json');
fs.writeFileSync(weaponMappingPath, JSON.stringify(weaponMappings, null, 2));
console.log(`\n✓ Saved ${Object.keys(weaponMappings).length} weapon mappings to weapon-id-mapping.json`);

const backpackMappingPath = path.join(__dirname, 'data', 'backpack-id-mapping.json');
fs.writeFileSync(backpackMappingPath, JSON.stringify(backpackMappings, null, 2));
console.log(`✓ Saved ${Object.keys(backpackMappings).length} backpack mappings to backpack-id-mapping.json`);

// Print unmatched items
if (unmatchedWeapons.length > 0) {
    console.log(`\n⚠ ${unmatchedWeapons.length} unmatched weapons:`);
    unmatchedWeapons.slice(0, 20).forEach(({ name, category }) => {
        console.log(`  - ${name} (${category})`);
    });
    if (unmatchedWeapons.length > 20) {
        console.log(`  ... and ${unmatchedWeapons.length - 20} more`);
    }
}

if (unmatchedBackpacks.length > 0) {
    console.log(`\n⚠ ${unmatchedBackpacks.length} unmatched backpacks:`);
    unmatchedBackpacks.slice(0, 20).forEach(({ name }) => {
        console.log(`  - ${name}`);
    });
    if (unmatchedBackpacks.length > 20) {
        console.log(`  ... and ${unmatchedBackpacks.length - 20} more`);
    }
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`Total items in UILists.cs: ${items.size}`);
console.log(`Matched weapons: ${Object.keys(weaponMappings).length}`);
console.log(`Unmatched weapons: ${unmatchedWeapons.length}`);
console.log(`Matched backpacks: ${Object.keys(backpackMappings).length}`);
console.log(`Unmatched backpacks: ${unmatchedBackpacks.length}`);

