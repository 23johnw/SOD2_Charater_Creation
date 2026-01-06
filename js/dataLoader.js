// Data Loader - Loads all JSON data files
class DataLoader {
    constructor() {
        this.data = {
            voices: { male: [], female: [] },
            culturalBackgrounds: [],
            humanDefinitions: { male: [], female: [] },
            coreSkills: [],
            communitySkills: [],
            quirkSkills: [],
            redTalonSkills: [],
            traits: [],
            enums: {},
            weapons: {},
            backpacks: []
        };
        this.loaded = false;
    }

    async loadAll() {
        try {
            // Load voices
            this.data.maleVoices = await this.loadJSON('data/maleVoices.json');
            this.data.femaleVoices = await this.loadJSON('data/femaleVoices.json');
            this.data.voices.male = this.data.maleVoices;
            this.data.voices.female = this.data.femaleVoices;
            
            // Load character data
            this.data.culturalBackgrounds = await this.loadJSON('data/culturalBackgrounds.json');
            const humanDefs = await this.loadJSON('data/humanDefinitions.json');
            this.data.humanDefinitions.male = humanDefs.filter(h => h.Gender === 'Male' && h['Internal ID (For Editor)']);
            this.data.humanDefinitions.female = humanDefs.filter(h => h.Gender === 'Female' && h['Internal ID (For Editor)']);
            // Also store full list for randomizer
            this.data.humanDefinitions = humanDefs;
            
            // Load skills
            this.data.coreSkills = await this.loadJSON('data/coreSkills.json');
            this.data.communitySkills = await this.loadJSON('data/communitySkills.json');
            this.data.quirkSkills = await this.loadJSON('data/quirkSkills.json');
            this.data.redTalonSkills = await this.loadJSON('data/redTalonSkills.json');
            
            // Load traits
            const traitsRaw = await this.loadJSON('data/traits.json');
            this.data.traits = this.processTraits(traitsRaw);
            // Also try to load processed traits if available
            try {
                this.data.processedTraits = await this.loadJSON('data/traits-processed.json');
            } catch (e) {
                // If processed traits don't exist, use the processed raw traits
                this.data.processedTraits = this.data.traits;
            }
            
            // Load enums
            this.data.enums = await this.loadJSON('data/enums.json');
            
            // Load weapons
            this.data.weapons.assault = await this.loadJSON('data/assaultWeapons.json');
            this.data.weapons.rifles = await this.loadJSON('data/rifles.json');
            this.data.weapons.shotguns = await this.loadJSON('data/shotguns.json');
            this.data.weapons.crossbows = await this.loadJSON('data/crossbows.json');
            this.data.weapons.pistols = await this.loadJSON('data/pistols.json');
            this.data.weapons.revolvers = await this.loadJSON('data/revolvers.json');
            this.data.weapons.closeCombat = await this.loadJSON('data/closeCombatWeapons.json');
            
            // Load backpacks
            this.data.backpacks = await this.loadJSON('data/backpacks.json');
            
            this.loaded = true;
            console.log('✓ All data loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    async loadJSON(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.statusText}`);
        }
        return await response.json();
    }

    processTraits(traitsRaw) {
        // Process traits to extract good/bad classification and categories
        return traitsRaw.map(trait => {
            const name = trait.Name || '';
            const positive = trait['Positive Effect(s)'] || '';
            const negative = trait['Negative Effect(s)'] || '';
            
            // Determine trait type
            let traitType = 'neutral';
            if (positive && !negative) {
                traitType = 'good';
            } else if (negative && !positive) {
                traitType = 'bad';
            } else if (positive && negative) {
                traitType = 'mixed';
            }
            
            // Categorize
            let category = 'other';
            if (name.includes('Descriptor_Age_')) {
                category = 'descriptor_age';
            } else if (name.includes('Descriptor_Pronoun_')) {
                category = 'descriptor_pronoun';
            } else if (name.includes('Descriptor_Philosophy_')) {
                category = 'descriptor_philosophy';
            } else if (name.includes('_Career_')) {
                category = 'career';
            } else if (name.includes('_Attribute_')) {
                category = 'attribute';
            } else if (name.includes('_Hobby_')) {
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
                providedSkill: trait['Provided Skill(s)'] || '',
                heroBonus: trait['Provided Hero Bonus'] || '',
                traitType: traitType,
                category: category,
                traitResourceID: name // Will need proper mapping
            };
        }).filter(t => t.name && t.name.trim() !== '');
    }

    getVoices(gender) {
        return gender === 'Male' ? this.data.voices.male : this.data.voices.female;
    }

    getHumanDefinitions(gender) {
        return gender === 'Male' ? this.data.humanDefinitions.male : this.data.humanDefinitions.female;
    }

    getTraitsByType(type) {
        if (type === 'allGood') {
            return this.data.traits.filter(t => t.traitType === 'good');
        } else if (type === 'allBad') {
            return this.data.traits.filter(t => t.traitType === 'bad');
        }
        return this.data.traits;
    }
}

// Global data loader instance
const dataLoader = new DataLoader();

