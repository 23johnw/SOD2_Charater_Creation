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

// Setup loadout preset selector
document.addEventListener('DOMContentLoaded', () => {
    const loadoutPreset = document.getElementById('loadoutPreset');
    if (loadoutPreset) {
        loadoutPreset.addEventListener('change', (e) => {
            loadoutManager.applyPreset(e.target.value);
            characterData.loadout.preset = e.target.value;
        });
    }
});

