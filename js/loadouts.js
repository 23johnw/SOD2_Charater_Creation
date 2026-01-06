// Loadout Management Logic
class LoadoutManager {
    constructor() {
        this.presets = {
            heavy: {
                name: 'Heavy Loadout',
                description: 'Maximum firepower and protection',
                equipment: {
                    backpack: 'best',
                    melee: 'best',
                    closeCombat: 'none',
                    ranged: 'best',
                    sidearm: 'best',
                    rucksack: 'best'
                }
            },
            middle: {
                name: 'Middle Loadout',
                description: 'Balanced equipment',
                equipment: {
                    backpack: 'middle',
                    melee: 'middle',
                    closeCombat: 'none',
                    ranged: 'middle',
                    sidearm: 'middle',
                    rucksack: 'none'
                }
            },
            light: {
                name: 'Light Loadout',
                description: 'Minimal equipment for stealth',
                equipment: {
                    backpack: 'light',
                    melee: 'light',
                    closeCombat: 'best',
                    ranged: 'light',
                    sidearm: 'light',
                    rucksack: 'none'
                }
            },
            custom: {
                name: 'Custom Loadout',
                description: 'Manual selection',
                equipment: {}
            }
        };
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset || presetName === 'custom') {
            return;
        }
        
        // Apply preset equipment selections
        // This will be implemented based on equipment tier data
        Object.keys(preset.equipment).forEach(slot => {
            const value = preset.equipment[slot];
            if (value === 'none') {
                document.getElementById(`equipment${this.capitalize(slot)}`)?.setAttribute('data-preset', 'none');
            } else {
                document.getElementById(`equipment${this.capitalize(slot)}`)?.setAttribute('data-preset', value);
            }
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getBestEquipment(slot) {
        // Return best available equipment for slot
        // This will need to be implemented based on equipment data
        return null;
    }

    getEquipmentByTier(slot, tier) {
        // Return equipment of specified tier (best, middle, light)
        // This will need to be implemented based on equipment data
        return null;
    }
}

const loadoutManager = new LoadoutManager();

// Setup loadout preset selector - called from app.js after initialization
function setupLoadoutPreset() {
    const loadoutPreset = document.getElementById('loadoutPreset');
    if (!loadoutPreset) {
        console.warn('Loadout preset select not found');
        return;
    }
    
    // Ensure options are present - check if options exist or if they're empty
    const hasOptions = loadoutPreset.options && loadoutPreset.options.length > 0;
    const firstOptionHasValue = hasOptions && loadoutPreset.options[0].value !== '';
    
    if (!hasOptions || !firstOptionHasValue) {
        // Re-populate options if they're missing
        loadoutPreset.innerHTML = `
            <option value="custom">Custom</option>
            <option value="heavy">Heavy Loadout</option>
            <option value="middle">Middle Loadout</option>
            <option value="light">Light Loadout</option>
        `;
        console.log('✓ Loadout preset options populated');
    }
    
    // Set default value
    if (window.characterData && window.characterData.loadout) {
        loadoutPreset.value = window.characterData.loadout.preset || 'custom';
    } else {
        loadoutPreset.value = 'custom';
    }
    
    // Remove any existing listeners to avoid duplicates
    const newLoadoutPreset = loadoutPreset.cloneNode(true);
    loadoutPreset.parentNode.replaceChild(newLoadoutPreset, loadoutPreset);
    
    // Add event listener to the new element
    const updatedLoadoutPreset = document.getElementById('loadoutPreset');
    updatedLoadoutPreset.addEventListener('change', (e) => {
        const presetValue = e.target.value;
        console.log('Loadout preset changed to:', presetValue);
        loadoutManager.applyPreset(presetValue);
        if (window.characterData && window.characterData.loadout) {
            window.characterData.loadout.preset = presetValue;
        }
    });
    
    console.log('✓ Loadout preset selector initialized');
}

