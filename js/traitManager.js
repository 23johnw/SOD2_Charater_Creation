// Trait Management Logic
class TraitManager {
    constructor() {
        this.selectedTraits = [];
        this.traitLimit = 12;
    }

    getRequiredTraits(characterData) {
        // Map age range to correct descriptor format
        let ageDescriptorName = characterData.ageRange;
        if (ageDescriptorName === 'MiddleAged') {
            ageDescriptorName = 'MiddleAge';
        }
        
        return [
            { name: 'Default', traitResourceID: 'Default' },
            { 
                name: `Descriptor_Age_${ageDescriptorName}`, 
                traitResourceID: `Descriptor_Age_${ageDescriptorName}` 
            },
            { 
                name: `Descriptor_Pronoun_${characterData.pronoun}`, 
                traitResourceID: `Descriptor_Pronoun_${characterData.pronoun}` 
            },
            { 
                name: `Descriptor_Philosophy_${characterData.philosophy1}`, 
                traitResourceID: `Descriptor_Philosophy_${characterData.philosophy1}` 
            },
            { 
                name: `Descriptor_Philosophy_${characterData.philosophy2}`, 
                traitResourceID: `Descriptor_Philosophy_${characterData.philosophy2}` 
            }
        ];
    }

    getAvailableTraits(mode) {
        let traits = dataLoader.data.traits;
        
        // Filter based on mode
        if (mode === 'allGood') {
            traits = traits.filter(t => t.traitType === 'good');
        } else if (mode === 'allBad') {
            traits = traits.filter(t => t.traitType === 'bad');
        } else if (mode === 'random') {
            // Return all traits for random selection
            traits = traits;
        }
        
        // Filter out required/descriptor traits
        return traits.filter(t => 
            !t.name.includes('Descriptor_') && 
            t.name !== 'Default' && 
            t.category !== 'required'
        );
    }

    canAddTrait(selectedCount, limit) {
        return selectedCount < limit;
    }

    validateTraits(requiredTraits, optionalTraits, limit) {
        const totalCount = requiredTraits.length + optionalTraits.length;
        const errors = [];
        const warnings = [];
        
        if (totalCount > limit) {
            errors.push(`Trait count (${totalCount}) exceeds limit (${limit})`);
        }
        
        // Check for duplicates
        const allTraitNames = [...requiredTraits, ...optionalTraits].map(t => t.name);
        const duplicates = allTraitNames.filter((name, index) => allTraitNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate traits found: ${duplicates.join(', ')}`);
        }
        
        // Check if required traits are present
        const requiredNames = requiredTraits.map(t => t.name);
        if (!requiredNames.includes('Default')) {
            errors.push('Required trait "Default" is missing');
        }
        
        if (totalCount < 5) {
            warnings.push('Character has very few traits. Consider adding more.');
        }
        
        return { valid: errors.length === 0, errors, warnings };
    }

    getRandomTraits(count, mode = 'random') {
        const available = this.getAvailableTraits(mode);
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
}

const traitManager = new TraitManager();

