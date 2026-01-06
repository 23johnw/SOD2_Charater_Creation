const fs = require('fs');
const path = require('path');

// Load mappings
const weaponMapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'weapon-id-mapping.json'), 'utf8'));
const backpackMapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'backpack-id-mapping.json'), 'utf8'));

// Update weapon files
const weaponFiles = [
    { file: 'data/assaultWeapons.json', category: 'assault' },
    { file: 'data/rifles.json', category: 'rifles' },
    { file: 'data/shotguns.json', category: 'shotguns' },
    { file: 'data/pistols.json', category: 'pistols' },
    { file: 'data/revolvers.json', category: 'revolvers' },
    { file: 'data/crossbows.json', category: 'crossbows' },
    { file: 'data/closeCombatWeapons.json', category: 'closeCombat' }
];

weaponFiles.forEach(({ file, category }) => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${file}`);
        return;
    }
    
    const weapons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updated = 0;
    
    weapons.forEach(weapon => {
        const name = weapon.Name || weapon['Weapon Name'] || '';
        if (!name) return;
        
        const mapping = weaponMapping[name];
        if (mapping) {
            weapon.ClassString = mapping.classString;
            weapon.DisplayName = mapping.displayName;
            updated++;
        }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(weapons, null, 2));
    console.log(`✓ Updated ${file}: ${updated}/${weapons.length} weapons have ClassString`);
});

// Update backpack file
const backpackPath = path.join(__dirname, 'data', 'backpacks.json');
const backpacks = JSON.parse(fs.readFileSync(backpackPath, 'utf8'));
let backpackUpdated = 0;

backpacks.forEach(backpack => {
    const name = backpack['All columns are the back pack name'] || 
                 backpack.Name || 
                 Object.values(backpack).find(v => typeof v === 'string' && v.length > 0 && !v.includes('slots') && !v.includes('weight'));
    
    if (!name) return;
    
    const mapping = backpackMapping[name];
    if (mapping) {
        backpack.ClassString = mapping.classString;
        backpack.DisplayName = mapping.displayName;
        backpackUpdated++;
    }
});

fs.writeFileSync(backpackPath, JSON.stringify(backpacks, null, 2));
console.log(`✓ Updated backpacks.json: ${backpackUpdated}/${backpacks.length} backpacks have ClassString`);

console.log('\n✓ All data files updated with ClassString paths!');

