// Random Character Generator
class Randomizer {
    constructor() {
        this.nameLists = {
            firstNames: {
                male: ['John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'],
                female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle']
            },
            lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']
        };
    }

    // Random name generator
    randomName(gender) {
        const genderKey = gender === 'Male' ? 'male' : 'female';
        const firstName = this.nameLists.firstNames[genderKey][Math.floor(Math.random() * this.nameLists.firstNames[genderKey].length)];
        const lastName = this.nameLists.lastNames[Math.floor(Math.random() * this.nameLists.lastNames.length)];
        const nickname = Math.random() > 0.5 ? firstName : this.generateNickname(firstName);
        
        return { firstName, lastName, nickname };
    }

    generateNickname(firstName) {
        const nicknames = {
            'John': 'Johnny', 'Michael': 'Mike', 'David': 'Dave', 'James': 'Jim', 'Robert': 'Bob',
            'William': 'Will', 'Richard': 'Rick', 'Joseph': 'Joe', 'Thomas': 'Tom', 'Christopher': 'Chris',
            'Daniel': 'Dan', 'Matthew': 'Matt', 'Anthony': 'Tony', 'Mark': 'Marky', 'Steven': 'Steve',
            'Andrew': 'Andy', 'Joshua': 'Josh', 'Kenneth': 'Ken',
            'Mary': 'Mary', 'Patricia': 'Pat', 'Jennifer': 'Jen', 'Linda': 'Lin', 'Elizabeth': 'Liz',
            'Barbara': 'Barb', 'Susan': 'Sue', 'Jessica': 'Jess', 'Sarah': 'Sara', 'Karen': 'Kari',
            'Nancy': 'Nan', 'Lisa': 'Liz', 'Betty': 'Beth', 'Margaret': 'Maggie', 'Sandra': 'Sandy',
            'Ashley': 'Ash', 'Kimberly': 'Kim', 'Emily': 'Em', 'Donna': 'Don', 'Michelle': 'Shelly'
        };
        return nicknames[firstName] || firstName;
    }

    // Random age
    randomAge() {
        const ages = ['Young', 'MiddleAged', 'Old'];
        return ages[Math.floor(Math.random() * ages.length)];
    }

    // Random pronoun based on gender
    randomPronoun(gender) {
        if (gender === 'Male') return 'He';
        if (gender === 'Female') return 'She';
        return 'They';
    }

    // Random cultural background
    randomCulturalBackground() {
        if (!dataLoader || !dataLoader.data || !dataLoader.data.culturalBackgrounds) return 'AfricanAmerican';
        const backgrounds = dataLoader.data.culturalBackgrounds;
        if (backgrounds.length === 0) return 'AfricanAmerican';
        const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        // Return the Internal ID which is what the form uses
        return bg['Internal ID'] || bg.Name || bg.name || bg || 'AfricanAmerican';
    }

    // Random voice
    randomVoice(gender) {
        if (!dataLoader || !dataLoader.data) return 'Kee_Low';
        const voices = gender === 'Male' ? dataLoader.data.voices.male : dataLoader.data.voices.female;
        if (!voices || voices.length === 0) return 'Kee_Low';
        const voice = voices[Math.floor(Math.random() * voices.length)];
        // Return the Editor ID which is what the form dropdown uses
        // The form uses 'Editor ID' as the option value (see updateVoiceOptions)
        let voiceID = voice['Editor ID'] || voice['Voice ID'] || voice.Name || voice.name || voice || 'Kee';
        // Ensure it's a string
        voiceID = String(voiceID);
        // The Editor ID should already be in the correct format (e.g., "Kee_Low")
        // But if it doesn't have a suffix, add _Low
        if (!voiceID.includes('_')) {
            voiceID = `${voiceID}_Low`;
        }
        return voiceID;
    }

    // Random human definition (character model)
    randomHumanDefinition(gender) {
        if (!dataLoader || !dataLoader.data || !dataLoader.data.humanDefinitions) return '';
        
        // Use the gender-specific arrays
        const definitions = gender === 'Male' 
            ? dataLoader.data.humanDefinitions.male 
            : dataLoader.data.humanDefinitions.female;
        
        if (!definitions || definitions.length === 0) return '';
        const def = definitions[Math.floor(Math.random() * definitions.length)];
        return def['Internal ID (For Editor)'] || def.Name || def.name || def || '';
    }

    // Random philosophy
    randomPhilosophy() {
        if (!dataLoader.data.enums || !dataLoader.data.enums.philosophies) {
            return ['Prudent', 'Pragmatic'];
        }
        const philosophies = dataLoader.data.enums.philosophies;
        // Get the value property, not the whole object
        const philoValues = philosophies.map(p => p.value || p);
        const philo1 = philoValues[Math.floor(Math.random() * philoValues.length)];
        let philo2 = philoValues[Math.floor(Math.random() * philoValues.length)];
        // Ensure they're different
        let attempts = 0;
        while (philo2 === philo1 && philoValues.length > 1 && attempts < 10) {
            philo2 = philoValues[Math.floor(Math.random() * philoValues.length)];
            attempts++;
        }
        // If still same and only one option, use different default
        if (philo2 === philo1 && philoValues.length === 1) {
            philo2 = philo1 === 'Prudent' ? 'Pragmatic' : 'Prudent';
        }
        return [philo1, philo2];
    }

    // Random skills
    randomSkills(options = {}) {
        const skills = {
            cardio: { level: 0, specialty: '' },
            wits: { level: 0, specialty: '' },
            fighting: { level: 0, specialty: '' },
            shooting: { level: 0, specialty: '' },
            fifthSkill: { type: 'none', skill: '' }
        };

        // Random core skill levels (0-7)
        const coreSkills = ['cardio', 'wits', 'fighting', 'shooting'];
        coreSkills.forEach(skill => {
            skills[skill].level = Math.floor(Math.random() * 8); // 0-7
            
            // Random specialty if level >= 5
            if (skills[skill].level >= 5 && dataLoader && dataLoader.data && dataLoader.data.coreSkills) {
                const skillData = dataLoader.data.coreSkills.find(s => {
                    const skillName = s['Core Skill'] || s.Name || s.name || s;
                    return skillName.toLowerCase() === skill;
                });
                if (skillData) {
                    // Try different possible field names for specializations
                    const specA = skillData['Specialization A'];
                    const specB = skillData['Specialization B'];
                    const specC = skillData['Specialization C'];
                    const specD = skillData['Specialization D'];
                    const specs = [specA, specB, specC, specD].filter(s => s && s.trim() !== '');
                    if (specs.length > 0) {
                        skills[skill].specialty = specs[Math.floor(Math.random() * specs.length)];
                    }
                }
            }
        });

        // Random 5th skill (optional)
        if (options.includeFifthSkill !== false && Math.random() > 0.3) {
            const skillType = Math.random() > 0.5 ? 'community' : 'quirk';
            skills.fifthSkill.type = skillType;
            
            const skillList = skillType === 'community' 
                ? dataLoader.data.communitySkills 
                : dataLoader.data.quirkSkills;
            
            if (skillList && skillList.length > 0) {
                const skill = skillList[Math.floor(Math.random() * skillList.length)];
                // Get the correct field name based on skill type
                if (skillType === 'community') {
                    skills.fifthSkill.skill = skill['Base Skill'] || skill.Name || skill.name || skill;
                } else {
                    skills.fifthSkill.skill = skill['Quirk Skill Name'] || skill.Name || skill.name || skill;
                }
            }
        }

        return skills;
    }

    // Random traits
    randomTraits(options = {}) {
        const traitMode = options.traitMode || 'mixed'; // 'good', 'bad', 'mixed'
        const traitLimit = options.traitLimit || 12;
        
        // Use processed traits if available, otherwise use raw traits
        let traitsData = dataLoader.data.processedTraits || dataLoader.data.traits || [];
        
        // If using raw traits, we need to process them
        if (!dataLoader.data.processedTraits && traitsData.length > 0) {
            traitsData = traitsData.map(t => ({
                name: t.Name || t.name || t,
                traitType: t.traitType || 'neutral',
                traitResourceID: t.Name || t.name || t
            }));
        }
        
        let availableTraits = [];
        
        if (traitMode === 'good') {
            availableTraits = traitsData.filter(t => t.traitType === 'good');
        } else if (traitMode === 'bad') {
            availableTraits = traitsData.filter(t => t.traitType === 'bad');
        } else if (traitMode === 'mixed') {
            // Mix of good and bad
            const goodTraits = traitsData.filter(t => t.traitType === 'good');
            const badTraits = traitsData.filter(t => t.traitType === 'bad');
            const neutralTraits = traitsData.filter(t => t.traitType === 'neutral' || !t.traitType);
            
            // 40% good, 30% bad, 30% neutral
            const goodCount = Math.ceil((traitLimit - 5) * 0.4);
            const badCount = Math.ceil((traitLimit - 5) * 0.3);
            const neutralCount = Math.ceil((traitLimit - 5) * 0.3);
            
            availableTraits = [
                ...this.randomSelect(goodTraits, goodCount),
                ...this.randomSelect(badTraits, badCount),
                ...this.randomSelect(neutralTraits, neutralCount)
            ];
        } else {
            availableTraits = traitsData;
        }

        // Filter out descriptor traits and Default
        availableTraits = availableTraits.filter(t => {
            const name = t.name || t.Name || t;
            return !name.includes('Descriptor_') && name !== 'Default';
        });

        // Select random traits up to limit (minus 5 required traits)
        const optionalCount = Math.min(traitLimit - 5, availableTraits.length);
        const selectedTraits = this.randomSelect(availableTraits, optionalCount);

        return selectedTraits.map(trait => ({
            name: trait.name || trait.Name || trait,
            traitResourceID: trait.traitResourceID || trait.name || trait.Name || trait
        }));
    }

    randomSelect(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Random standing level
    randomStandingLevel() {
        if (!dataLoader.data.enums || !dataLoader.data.enums.standingLevels) {
            return 'Citizen';
        }
        const levels = dataLoader.data.enums.standingLevels;
        return levels[Math.floor(Math.random() * levels.length)];
    }

    // Random leader type
    randomLeaderType() {
        if (!dataLoader.data.enums || !dataLoader.data.enums.leaderTypes) {
            return 'None';
        }
        const types = dataLoader.data.enums.leaderTypes;
        return types[Math.floor(Math.random() * types.length)];
    }

    // Random stats
    randomStats() {
        return {
            health: Math.floor(Math.random() * 50) + 75, // 75-125
            stamina: Math.floor(Math.random() * 50) + 75 // 75-125
        };
    }

    // Main randomize function
    randomizeCharacter(options = {}) {
        const gender = options.gender || (Math.random() > 0.5 ? 'Male' : 'Female');
        const name = this.randomName(gender);
        const age = this.randomAge();
        const pronoun = this.randomPronoun(gender);
        const [philo1, philo2] = this.randomPhilosophy();
        
        const character = {
            firstName: name.firstName,
            lastName: name.lastName,
            nickname: name.nickname,
            gender: gender,
            ageRange: age,
            pronoun: pronoun,
            culturalBackground: options.culturalBackground !== false ? this.randomCulturalBackground() : (window.characterData?.culturalBackground || 'AfricanAmerican'),
            voiceID: options.voice !== false ? this.randomVoice(gender) : (window.characterData?.voiceID || 'Kee'),
            humanDefinition: options.humanDefinition !== false ? this.randomHumanDefinition(gender) : (window.characterData?.humanDefinition || ''),
            philosophy1: philo1,
            philosophy2: philo2,
            standingLevel: options.standingLevel !== false ? this.randomStandingLevel() : (window.characterData?.standingLevel || 'Citizen'),
            leaderType: options.leaderType !== false ? this.randomLeaderType() : (window.characterData?.leaderType || 'None'),
            heroBonus: options.heroBonus !== false ? '' : (window.characterData?.heroBonus || ''),
            skills: options.skills !== false ? this.randomSkills(options.skillOptions || {}) : (window.characterData?.skills || {
                cardio: { level: 0, specialty: '' },
                wits: { level: 0, specialty: '' },
                fighting: { level: 0, specialty: '' },
                shooting: { level: 0, specialty: '' },
                fifthSkill: { type: 'none', skill: '' }
            }),
            stats: options.stats !== false ? this.randomStats() : (window.characterData?.stats || { health: 100, stamina: 100 }),
            loadout: window.characterData?.loadout || { preset: 'custom', equipment: {} }
        };

        // Random traits
        if (options.traits !== false) {
            const randomTraits = this.randomTraits({
                traitMode: options.traitMode || 'mixed',
                traitLimit: options.traitLimit || 12
            });
            character.traits = {
                required: [],
                optional: randomTraits
            };
        } else {
            character.traits = window.characterData?.traits || { required: [], optional: [] };
        }

        return character;
    }
}

const randomizer = new Randomizer();

