// Main Application Logic
let selectedTierFilter = 'all'; // Tier filter state: 'all', 'top10', 'good', 'average', 'bad', 'worst10'

let characterData = {
    firstName: '',
    lastName: '',
    nickname: '',
    gender: 'Female',
    ageRange: 'MiddleAged',
    pronoun: 'She',
    culturalBackground: 'AfricanAmerican',
    voiceID: 'Kee',
    voicePitch: 'Low',
    humanDefinition: 'HumanFemaleVest_01_v_01', // Default model for Female (validated against Community Editor)
    philosophy1: 'Prudent',
    philosophy2: 'Pragmatic',
    standingLevel: 'Citizen',
    leaderType: 'None',
    heroBonus: '',
    skills: {
        // All core skills can be 0 - this is valid
        cardio: { level: 0, specialty: '' },
        wits: { level: 0, specialty: '' },
        fighting: { level: 0, specialty: '' },
        shooting: { level: 0, specialty: '' },
        // 5th skill can be 'none' - this is valid
        fifthSkill: { type: 'none', skill: '' }
    },
    traits: {
        // Required traits (including 'Default') are automatically added during XML generation
        // Only optional traits need to be added here
        required: [],
        optional: []
    },
    stats: {
        health: 100,
        stamina: 100
    },
    inventory: [] // Array of { category, itemId, displayName, classString, quantity }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing SOD2 Character Generator...');
    
    // Load all data
    const loaded = await dataLoader.loadAll();
    if (!loaded) {
        alert('Failed to load data files. Please check the console for errors.');
        return;
    }
    
    // Initialize UI
    initializeForm();
    setupEventListeners();
    
    // Make characterData globally available for randomizer
    window.characterData = characterData;
    
    // Generate random names on initialization
    await generateRandomNames();
    
    // Auto-randomize character on page load with only Standing & Leader Type checked
    setTimeout(() => {
        // Set randomizer checkboxes: all unchecked except Standing & Leader Type
        const randName = document.getElementById('randName');
        const randAttributes = document.getElementById('randAttributes');
        const randSkills = document.getElementById('randSkills');
        const randTraits = document.getElementById('randTraits');
        const randStats = document.getElementById('randStats');
        const randStanding = document.getElementById('randStanding');
        
        if (randName) randName.checked = false;
        if (randAttributes) randAttributes.checked = false;
        if (randSkills) randSkills.checked = false;
        if (randTraits) randTraits.checked = false;
        if (randStats) randStats.checked = false;
        if (randStanding) randStanding.checked = true; // Only this one checked
        
        // Ensure leader type is set to "None"
        const leaderSelect = document.getElementById('leaderType');
        if (leaderSelect) {
            leaderSelect.value = 'None';
        }
        
        // Auto-randomize the character
        console.log('Auto-randomizing character on page load...');
        randomizeSelected();
    }, 600); // Wait a bit longer to ensure everything is initialized
    
    // Final validation: ensure humanDefinition is set after everything is initialized
    setTimeout(() => {
        const humanDefSelect = document.getElementById('humanDefinition');
        if (humanDefSelect) {
            // If dropdown is empty or has no valid selection, force a selection
            if (!humanDefSelect.value || humanDefSelect.value.trim() === '') {
                if (humanDefSelect.options.length > 1) {
                    // Select first available option (skip "Select model...")
                    for (let i = 1; i < humanDefSelect.options.length; i++) {
                        const option = humanDefSelect.options[i];
                        if (option.value && option.value.trim() !== '') {
                            humanDefSelect.value = option.value;
                            characterData.humanDefinition = option.value;
                            console.log('Final validation: Set humanDefinition to:', option.value);
                            break;
                        }
                    }
                }
            } else {
                // Ensure characterData is synced with dropdown
                characterData.humanDefinition = humanDefSelect.value;
            }
            
            // Log final state for debugging
            console.log('Final humanDefinition state:', {
                dropdownValue: humanDefSelect.value,
                characterDataValue: characterData.humanDefinition,
                isValid: humanDefSelect.value && humanDefSelect.value.trim() !== ''
            });
        }
    }, 500);
    
    console.log('✓ Application initialized');
});

function initializeForm() {
    // Populate cultural backgrounds
    const culturalBgSelect = document.getElementById('culturalBackground');
    dataLoader.data.culturalBackgrounds.forEach(bg => {
        const option = document.createElement('option');
        option.value = bg['Internal ID'];
        option.textContent = bg['Background Name'];
        culturalBgSelect.appendChild(option);
    });
    
    // Populate enums
    populateSelect('philosophy1', dataLoader.data.enums.philosophies);
    populateSelect('philosophy2', dataLoader.data.enums.philosophies);
    populateSelect('standingLevel', dataLoader.data.enums.standingLevels);
    populateSelect('leaderType', dataLoader.data.enums.leaderTypes);
    
    // Initialize skills UI
    initializeSkillsUI();
    
    // Initialize traits UI
    initializeTraitsUI();
    
    // Initialize inventory UI
    initializeInventoryUI();
    
    // Update voice and human definition based on gender
    updateVoiceOptions();
    updateHumanDefinitionOptions();
    
    // Explicitly ensure humanDefinition is set after options are populated
    // This mimics what randomize does - directly setting the dropdown value
    setTimeout(() => {
        const humanDefSelect = document.getElementById('humanDefinition');
        if (humanDefSelect) {
            // If no value is selected, force select the first available option
            if (!humanDefSelect.value || humanDefSelect.value.trim() === '') {
                if (humanDefSelect.options.length > 1) {
                    // Find first valid option (skip "Select model...")
                    for (let i = 1; i < humanDefSelect.options.length; i++) {
                        const option = humanDefSelect.options[i];
                        if (option.value && option.value.trim() !== '') {
                            humanDefSelect.value = option.value;
                            characterData.humanDefinition = option.value;
                            // Dispatch change event to ensure characterData is updated
                            humanDefSelect.dispatchEvent(new Event('change'));
                            console.log('Initialized humanDefinition to:', option.value);
                            break;
                        }
                    }
                }
            } else {
                // Value exists, ensure characterData is synced
                characterData.humanDefinition = humanDefSelect.value;
                console.log('Synced humanDefinition from dropdown:', humanDefSelect.value);
            }
        }
    }, 150);
    
    // Set default values in form fields to match characterData
    setDefaultFormValues();
}

async function generateRandomNames() {
    try {
        // Try to fetch random names from randomuser.me API
        const response = await fetch('https://randomuser.me/api/?nat=us,gb,ca,au');
        const data = await response.json();
        
        if (data && data.results && data.results.length > 0) {
            const user = data.results[0];
            characterData.firstName = user.name.first;
            characterData.lastName = user.name.last;
            // Generate a nickname from the first name (shortened or variation)
            characterData.nickname = generateNickname(user.name.first);
            
            // Update form fields
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const nicknameInput = document.getElementById('nickname');
            
            if (firstNameInput) firstNameInput.value = characterData.firstName;
            if (lastNameInput) lastNameInput.value = characterData.lastName;
            if (nicknameInput) nicknameInput.value = characterData.nickname;
            
            console.log('✓ Random names generated from API');
            return;
        }
    } catch (error) {
        console.warn('Failed to fetch random names from API, using defaults:', error);
    }
    
    // Fallback to default names if API fails
    const defaultNames = {
        firstNames: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Ashley'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
        nicknames: ['', 'Ace', 'Bear', 'Cat', 'Dash', 'Echo', 'Fox', 'Ghost', 'Hawk', 'Ice']
    };
    
    const randomFirst = defaultNames.firstNames[Math.floor(Math.random() * defaultNames.firstNames.length)];
    const randomLast = defaultNames.lastNames[Math.floor(Math.random() * defaultNames.lastNames.length)];
    const randomNick = Math.random() > 0.5 ? defaultNames.nicknames[Math.floor(Math.random() * defaultNames.nicknames.length)] : '';
    
    characterData.firstName = randomFirst;
    characterData.lastName = randomLast;
    characterData.nickname = randomNick;
    
    // Update form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const nicknameInput = document.getElementById('nickname');
    
    if (firstNameInput) firstNameInput.value = characterData.firstName;
    if (lastNameInput) lastNameInput.value = characterData.lastName;
    if (nicknameInput) nicknameInput.value = characterData.nickname;
    
    console.log('✓ Default random names generated');
}

function generateNickname(firstName) {
    // Generate a nickname from the first name
    // Sometimes return empty, sometimes return a shortened version or variation
    if (Math.random() > 0.6) {
        return ''; // 40% chance of no nickname
    }
    
    // Common nickname patterns
    if (firstName.length <= 3) {
        return firstName; // Short names stay the same
    }
    
    // Try common nickname patterns
    const nicknamePatterns = [
        firstName.substring(0, 3), // First 3 letters
        firstName.substring(0, 4), // First 4 letters
        firstName + 'y', // Add 'y'
        firstName.substring(0, firstName.length - 1) + 'y' // Remove last letter, add 'y'
    ];
    
    // Return a random pattern or empty
    if (Math.random() > 0.3) {
        return nicknamePatterns[Math.floor(Math.random() * nicknamePatterns.length)];
    }
    
    return '';
}

function setDefaultFormValues() {
    // Set all form fields to match characterData defaults
    const formFields = {
        'firstName': characterData.firstName,
        'lastName': characterData.lastName,
        'nickname': characterData.nickname,
        'gender': characterData.gender,
        'ageRange': characterData.ageRange,
        'pronoun': characterData.pronoun,
        'culturalBackground': characterData.culturalBackground,
        'voiceID': characterData.voiceID,
        'philosophy1': characterData.philosophy1,
        'philosophy2': characterData.philosophy2,
        'standingLevel': characterData.standingLevel,
        'leaderType': characterData.leaderType,
        'currentHealth': characterData.stats.health,
        'currentStamina': characterData.stats.stamina
    };
    
    Object.entries(formFields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // For name fields, set value even if empty (will be populated by generateRandomNames)
            // For other fields, only set if value exists
            if (id === 'firstName' || id === 'lastName' || id === 'nickname') {
                element.value = value || '';
            } else if (value) {
                element.value = value;
            }
        }
    });
    
    // Set humanDefinition after options are populated
    // Use multiple attempts to ensure it's set properly
    const setHumanDefinitionValue = () => {
        const humanDefSelect = document.getElementById('humanDefinition');
        if (!humanDefSelect) return;
        
        // If dropdown has no options yet, wait and try again
        if (humanDefSelect.options.length <= 1) {
            setTimeout(setHumanDefinitionValue, 50);
            return;
        }
        
        // Try to use characterData.humanDefinition if it exists and is valid
        if (characterData.humanDefinition) {
            const option = Array.from(humanDefSelect.options).find(
                opt => opt.value === characterData.humanDefinition && opt.value !== ''
            );
            if (option) {
                humanDefSelect.value = characterData.humanDefinition;
                console.log('Set humanDefinition from characterData:', characterData.humanDefinition);
                return;
            }
        }
        
        // If no valid value in characterData or it's not in dropdown, select first available
        if (humanDefSelect.options.length > 1) {
            // Skip the first option (usually "Select model...")
            for (let i = 1; i < humanDefSelect.options.length; i++) {
                const option = humanDefSelect.options[i];
                if (option.value && option.value.trim() !== '') {
                    humanDefSelect.value = option.value;
                    characterData.humanDefinition = option.value;
                    console.log('Set humanDefinition to first available option:', option.value);
                    return;
                }
            }
        }
        
        // Final fallback: use default based on gender
        const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
        const defaultModel = gender === 'Male' 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        
        // Try to find default in dropdown
        const defaultOption = Array.from(humanDefSelect.options).find(
            opt => opt.value === defaultModel
        );
        if (defaultOption) {
            humanDefSelect.value = defaultModel;
            characterData.humanDefinition = defaultModel;
            console.log('Set humanDefinition to default:', defaultModel);
        } else if (humanDefSelect.options.length > 1) {
            // Last resort: use first available option
            humanDefSelect.selectedIndex = 1;
            characterData.humanDefinition = humanDefSelect.value;
            console.log('Set humanDefinition to first option:', humanDefSelect.value);
        }
    };
    
    // Try immediately, then with delays to ensure it's set
    setHumanDefinitionValue();
    setTimeout(setHumanDefinitionValue, 100);
    setTimeout(setHumanDefinitionValue, 300);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
    });
}

function initializeSkillsUI() {
    const coreSkillsDiv = document.getElementById('coreSkills');
    const coreSkills = ['cardio', 'wits', 'fighting', 'shooting'];
    
    coreSkills.forEach(skillName => {
        const skillData = dataLoader.data.coreSkills.find(s => 
            s['Core Skill'].toLowerCase() === skillName
        );
        
        if (skillData) {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-item';
            skillDiv.innerHTML = `
                <h4>${skillData['Core Skill']}</h4>
                <div class="skill-controls">
                    <div class="skill-level">
                        <label>Level:</label>
                        <input type="range" id="${skillName}Level" min="0" max="7" value="0">
                        <span id="${skillName}LevelDisplay">0</span>
                    </div>
                    <div class="skill-specialty" id="${skillName}Specialty" style="display: none;">
                        <label>Specialty:</label>
                        <select id="${skillName}SpecialtySelect">
                            <option value="">None</option>
                            <option value="${skillData['Specialization A']}">${skillData['Specialization A']}</option>
                            <option value="${skillData['Specialization B']}">${skillData['Specialization B']}</option>
                            <option value="${skillData['Specialization C']}">${skillData['Specialization C']}</option>
                            <option value="${skillData['Specialization D']}">${skillData['Specialization D']}</option>
                        </select>
                    </div>
                </div>
            `;
            coreSkillsDiv.appendChild(skillDiv);
            
            // Add event listener for level changes
            const levelInput = document.getElementById(`${skillName}Level`);
            levelInput.addEventListener('input', (e) => {
                const level = parseInt(e.target.value);
                document.getElementById(`${skillName}LevelDisplay`).textContent = level;
                const specialtyDiv = document.getElementById(`${skillName}Specialty`);
                if (level >= 5) {
                    specialtyDiv.style.display = 'block';
                } else {
                    specialtyDiv.style.display = 'none';
                    document.getElementById(`${skillName}SpecialtySelect`).value = '';
                }
                updateCharacterData();
            });
            
            const specialtySelect = document.getElementById(`${skillName}SpecialtySelect`);
            specialtySelect.addEventListener('change', updateCharacterData);
        }
    });
    
    // Setup 5th skill selector
    setupFifthSkillSelector();
}

function setupFifthSkillSelector() {
    const fifthSkillTypeRadios = document.querySelectorAll('input[name="fifthSkillType"]');
    const fifthSkillSelect = document.getElementById('fifthSkill');
    
    fifthSkillTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            fifthSkillSelect.innerHTML = '<option value="">Select skill...</option>';
            
            if (type === 'community') {
                dataLoader.data.communitySkills.forEach(skill => {
                    const option = document.createElement('option');
                    option.value = skill['Base Skill'];
                    option.textContent = skill['Base Skill'];
                    fifthSkillSelect.appendChild(option);
                });
                fifthSkillSelect.style.display = 'block';
            } else if (type === 'quirk') {
                dataLoader.data.quirkSkills.forEach(skill => {
                    const option = document.createElement('option');
                    option.value = skill['Quirk Skill Name'];
                    option.textContent = skill['Quirk Skill Name'];
                    fifthSkillSelect.appendChild(option);
                });
                fifthSkillSelect.style.display = 'block';
            } else {
                fifthSkillSelect.style.display = 'none';
            }
            updateCharacterData();
        });
    });
    
    fifthSkillSelect.addEventListener('change', updateCharacterData);
}

function initializeTraitsUI() {
    // Display required traits (will be auto-populated)
    updateRequiredTraits();
    
    // Setup trait search and selection
    const traitSearch = document.getElementById('traitSearch');
    if (traitSearch) {
        // Ensure input is enabled and accessible
        traitSearch.disabled = false;
        traitSearch.readOnly = false;
        traitSearch.style.pointerEvents = 'auto';
        traitSearch.addEventListener('input', filterTraits);
        traitSearch.addEventListener('keydown', (e) => {
            // Allow all key inputs
            e.stopPropagation();
        });
    }
    
    const traitMode = document.getElementById('traitMode');
    traitMode.addEventListener('change', () => {
        loadAvailableTraits();
        filterTraits();
        updateCharacterData();
    });
    
    // Setup tier filter buttons
    const tierFilterButtons = document.querySelectorAll('.tier-filter-btn');
    
    // Set initial active state for "All" button
    const allButton = document.querySelector('.tier-filter-btn[data-tier="all"]');
    if (allButton) {
        allButton.classList.add('active');
    }
    
    tierFilterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            tierFilterButtons.forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('data-active');
            });
            btn.classList.add('active');
            btn.setAttribute('data-active', 'true');
            
            // Update filter
            selectedTierFilter = btn.dataset.tier;
            loadAvailableTraits();
            filterTraits();
        });
    });
    
    // Load available traits
    loadAvailableTraits();
}

function updateRequiredTraits() {
    const requiredTraitsList = document.getElementById('requiredTraitsList');
    requiredTraitsList.innerHTML = `
        <div class="trait-tag">Default (Required)</div>
        <div class="trait-tag" id="ageDescriptor">Age: <span id="ageDescriptorValue">-</span></div>
        <div class="trait-tag" id="pronounDescriptor">Pronoun: <span id="pronounDescriptorValue">-</span></div>
        <div class="trait-tag" id="philosophy1Descriptor">Philosophy 1: <span id="philosophy1DescriptorValue">-</span></div>
        <div class="trait-tag" id="philosophy2Descriptor">Philosophy 2: <span id="philosophy2DescriptorValue">-</span></div>
    `;
}

function filterByTier(traits) {
    if (selectedTierFilter === 'all') {
        return traits;
    }
    
    return traits.filter(trait => {
        const tier = trait.tier || 'average'; // Default to average if no tier assigned
        return tier === selectedTierFilter;
    });
}

function loadAvailableTraits() {
    const availableTraitsList = document.getElementById('availableTraitsList');
    const traitMode = document.getElementById('traitMode').value;
    
    // Step 1: Filter by traitMode (good/bad/mixed)
    let traits = dataLoader.getTraitsByType(traitMode);
    
    // Step 2: Filter out required/descriptor traits from optional list
    traits = traits.filter(t => 
        !t.name.includes('Descriptor_') && 
        t.name !== 'Default' && 
        t.category !== 'required'
    );
    
    // Step 3: Filter by tier
    traits = filterByTier(traits);
    
    availableTraitsList.innerHTML = '';
    traits.forEach(trait => {
        const traitDiv = document.createElement('div');
        traitDiv.className = `trait-item ${trait.traitType}`;
        
        // Store trait data on the element for search functionality
        traitDiv.dataset.traitName = trait.name.toLowerCase();
        traitDiv.dataset.traitDescription = (trait.description || '').toLowerCase();
        traitDiv.dataset.traitTier = trait.tier || 'average';
        
        // Store buff search text (include stat names for searching)
        let buffSearchText = '';
        if (trait.buffs && trait.buffs.length > 0) {
            buffSearchText = trait.buffs.map(buff => {
                // Include stat name in multiple formats for better search
                const statLower = buff.stat.toLowerCase();
                // Remove "Max " prefix for search if present, so "stamina" matches "Max Stamina"
                const statBase = statLower.replace(/^max\s+/, '');
                return `${buff.value} ${buff.stat} ${statLower} ${statBase}`.toLowerCase();
            }).join(' ');
            traitDiv.dataset.traitBuffs = buffSearchText;
        }
        
        // Format buffs for display
        let buffsDisplay = '';
        if (trait.buffs && trait.buffs.length > 0) {
            const buffElements = trait.buffs.map(buff => {
                // Strip any existing sign and add the correct one based on type
                let displayValue = String(buff.value).replace(/^[+-]/, ''); // Remove existing + or -
                displayValue = (buff.type === 'positive' ? '+' : '-') + displayValue;
                return `<span class="trait-item-buff ${buff.type}">${displayValue} ${buff.stat}</span>`;
            });
            buffsDisplay = `<div class="trait-item-buffs">${buffElements.join('')}</div>`;
        }
        
        // Format tier badge
        const tier = trait.tier || 'average';
        const tierLabels = {
            'top10': 'Top 10',
            'good': 'Good',
            'average': 'Average',
            'bad': 'Bad',
            'worst10': 'Worst 10'
        };
        const tierLabel = tierLabels[tier] || 'Average';
        const tierBadge = `<span class="trait-tier-badge tier-${tier}">${tierLabel}</span>`;
        
        traitDiv.innerHTML = `
            <div class="trait-item-header">
                <div class="trait-item-name">
                    ${trait.name}
                    ${tierBadge}
                </div>
                ${buffsDisplay}
            </div>
            <div class="trait-item-effects">${trait.description || 'No description'}</div>
        `;
        
        // Add click event - use event delegation to ensure it works even if innerHTML is modified
        traitDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            addTrait(trait);
        });
        
        // Also make sure child elements don't block clicks
        traitDiv.style.cursor = 'pointer';
        
        availableTraitsList.appendChild(traitDiv);
    });
}

function filterTraits() {
    const searchTerm = document.getElementById('traitSearch').value.toLowerCase().trim();
    const traitItems = document.querySelectorAll('.trait-item');
    
    if (!searchTerm) {
        // Show all if search is empty
        traitItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    traitItems.forEach(item => {
        const name = item.dataset.traitName || '';
        const description = item.dataset.traitDescription || '';
        const buffs = item.dataset.traitBuffs || '';
        
        // Search in name, description, and buffs
        if (name.includes(searchTerm) || 
            description.includes(searchTerm) || 
            buffs.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addTrait(trait) {
    // Check if trait is already added
    if (characterData.traits.optional.find(t => t.name === trait.name)) {
        return; // Already added
    }
    
    characterData.traits.optional.push(trait);
    updateSelectedTraitsDisplay();
    updateCharacterData();
}

function removeTrait(traitName) {
    characterData.traits.optional = characterData.traits.optional.filter(t => t.name !== traitName);
    updateSelectedTraitsDisplay();
    updateCharacterData();
}

// Calculate buffs from all traits (required + optional)
function calculateTraitBuffs() {
    let totalHealthBuff = 0;
    let totalStaminaBuff = 0;
    
    // Check all traits (required + optional)
    const allTraits = [...(characterData.traits.required || []), ...(characterData.traits.optional || [])];
    
    allTraits.forEach(trait => {
        // Get full trait data to access buffs
        const fullTrait = dataLoader.data.traits.find(t => t.name === trait.name || t.traitResourceID === trait.traitResourceID) || trait;
        const buffs = fullTrait.buffs || [];
        
        // Calculate stat buffs
        buffs.forEach(buff => {
            const stat = buff.stat.toLowerCase();
            const value = parseInt(buff.value) || 0;
            if (stat.includes('health')) {
                totalHealthBuff += value;
            } else if (stat.includes('stamina')) {
                totalStaminaBuff += value;
            }
        });
    });
    
    return { totalHealthBuff, totalStaminaBuff };
}

function updateSelectedTraitsDisplay() {
    const selectedTraitsList = document.getElementById('selectedTraitsList');
    selectedTraitsList.innerHTML = '';
    
    // Calculate buffs from all traits
    const { totalHealthBuff, totalStaminaBuff } = calculateTraitBuffs();
    
    characterData.traits.optional.forEach(trait => {
        // Get full trait data to access buffs
        const fullTrait = dataLoader.data.traits.find(t => t.name === trait.name) || trait;
        const buffs = fullTrait.buffs || [];
        
        const tag = document.createElement('div');
        tag.className = 'trait-tag';
        
        // Create buff indicators if trait has buffs
        let buffIndicators = '';
        if (buffs.length > 0) {
            buffIndicators = '<div class="trait-buffs">' + 
                buffs.map(buff => {
                    const sign = buff.type === 'positive' ? '+' : '';
                    return `<span class="trait-buff ${buff.type}" title="${sign}${buff.value} ${buff.stat}">${sign}${buff.value} ${buff.stat}</span>`;
                }).join('') + 
                '</div>';
        }
        
        tag.innerHTML = `
            <div class="trait-tag-content">
                <span class="trait-name">${trait.name}</span>
                ${buffIndicators}
            </div>
            <span class="remove" onclick="removeTrait('${trait.name}')">×</span>
        `;
        selectedTraitsList.appendChild(tag);
    });
    
    // Update stat displays with buff totals
    updateStatDisplays(totalHealthBuff, totalStaminaBuff);
    
    // Update trait counter (no limit)
    const totalTraits = characterData.traits.required.length + characterData.traits.optional.length;
    const counter = document.querySelector('.trait-counter') || document.createElement('div');
    counter.className = 'trait-counter';
    counter.textContent = `Traits: ${totalTraits}`;
    counter.classList.remove('error', 'warning'); // Remove limit warnings
    if (!document.querySelector('.trait-counter')) {
        document.getElementById('optionalTraits').insertBefore(counter, document.getElementById('selectedTraitsList'));
    }
}

function updateStatDisplays(healthBuff, staminaBuff) {
    const baseHealth = parseInt(document.getElementById('currentHealth')?.value) || 100;
    const baseStamina = parseInt(document.getElementById('currentStamina')?.value) || 100;
    
    // Update health display
    const healthBaseEl = document.querySelector('#healthDisplay .stat-base');
    const healthBuffEl = document.getElementById('healthBuff');
    const healthTotalEl = document.getElementById('healthTotal');
    
    if (healthBaseEl) healthBaseEl.textContent = baseHealth;
    
    if (healthBuffEl && healthTotalEl) {
        if (healthBuff !== 0) {
            const sign = healthBuff > 0 ? '+' : '';
            healthBuffEl.textContent = ` ${sign}${healthBuff}`;
            healthBuffEl.className = `stat-buff ${healthBuff > 0 ? 'positive' : 'negative'}`;
            healthBuffEl.style.display = 'inline';
            const total = baseHealth + healthBuff;
            healthTotalEl.textContent = `= ${total}`;
        } else {
            healthBuffEl.style.display = 'none';
            healthTotalEl.textContent = `= ${baseHealth}`;
        }
    }
    
    // Update stamina display
    const staminaBaseEl = document.querySelector('#staminaDisplay .stat-base');
    const staminaBuffEl = document.getElementById('staminaBuff');
    const staminaTotalEl = document.getElementById('staminaTotal');
    
    if (staminaBaseEl) staminaBaseEl.textContent = baseStamina;
    
    if (staminaBuffEl && staminaTotalEl) {
        if (staminaBuff !== 0) {
            const sign = staminaBuff > 0 ? '+' : '';
            staminaBuffEl.textContent = ` ${sign}${staminaBuff}`;
            staminaBuffEl.className = `stat-buff ${staminaBuff > 0 ? 'positive' : 'negative'}`;
            staminaBuffEl.style.display = 'inline';
            const total = baseStamina + staminaBuff;
            staminaTotalEl.textContent = `= ${total}`;
        } else {
            staminaBuffEl.style.display = 'none';
            staminaTotalEl.textContent = `= ${baseStamina}`;
        }
    }
}

// Loadout functions removed - using Inventory Items section instead

function updateVoiceOptions() {
    const gender = document.getElementById('gender').value;
    const voiceSelect = document.getElementById('voiceID');
    const voices = dataLoader.getVoices(gender);
    
    voiceSelect.innerHTML = '<option value="">Select voice...</option>';
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice['Editor ID'];
        option.textContent = `${voice['Editor ID']} - ${voice['Description / Notable Use']}`;
        voiceSelect.appendChild(option);
    });
}

function updateHumanDefinitionOptions() {
    const gender = document.getElementById('gender').value;
    const humanDefSelect = document.getElementById('humanDefinition');
    const humanDefs = dataLoader.getHumanDefinitions(gender);
    
    if (!humanDefSelect) return;
    
    humanDefSelect.innerHTML = '<option value="">Select model...</option>';
    
    if (!humanDefs || !Array.isArray(humanDefs)) {
        console.warn('Human definitions not available for gender:', gender);
        // Set default based on gender even if data not loaded
        const defaultModel = gender === 'Male' 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        characterData.humanDefinition = defaultModel;
        return;
    }
    
    humanDefs.forEach(def => {
        const option = document.createElement('option');
        option.value = def['Internal ID (For Editor)'] || '';
        const modelName = def['Model Name'] || def.Name || 'Unknown';
        const style = def.Style || '';
        option.textContent = style ? `${modelName} (${style})` : modelName;
        humanDefSelect.appendChild(option);
    });
    
    // Set default model if none selected or if current selection is invalid for new gender
    const currentValue = humanDefSelect.value;
    const hasValidSelection = Array.from(humanDefSelect.options).some(
        opt => opt.value === currentValue && opt.value !== ''
    );
    
    if (!hasValidSelection && humanDefs.length > 0) {
        // Try to use characterData.humanDefinition if it's valid for this gender
        let modelToSelect = '';
        if (characterData.humanDefinition) {
            const isValidForGender = Array.from(humanDefSelect.options).some(
                opt => opt.value === characterData.humanDefinition
            );
            if (isValidForGender) {
                modelToSelect = characterData.humanDefinition;
            }
        }
        
        // If no valid model from characterData, select first available model as default
        if (!modelToSelect) {
            const firstModel = humanDefs[0]['Internal ID (For Editor)'] || '';
            if (firstModel) {
                modelToSelect = firstModel;
            } else {
                // Fallback to hardcoded default
                modelToSelect = gender === 'Male' 
                    ? 'HumanMaleHoodie_01_v_02' 
                    : 'HumanFemaleHoodie_01_v_02';
            }
        }
        
        // Set the value in the dropdown
        humanDefSelect.value = modelToSelect;
        characterData.humanDefinition = modelToSelect;
    } else if (currentValue) {
        // Keep current selection if valid
        characterData.humanDefinition = currentValue;
    } else if (!characterData.humanDefinition) {
        // If no value at all, set default
        const defaultModel = gender === 'Male' 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        characterData.humanDefinition = defaultModel;
        // Try to select it if it exists in the dropdown
        const defaultOption = Array.from(humanDefSelect.options).find(
            opt => opt.value === defaultModel
        );
        if (defaultOption) {
            humanDefSelect.value = defaultModel;
        } else if (humanDefs.length > 0) {
            // If default not found, use first available model
            const firstModel = humanDefs[0]['Internal ID (For Editor)'] || '';
            if (firstModel) {
                humanDefSelect.value = firstModel;
                characterData.humanDefinition = firstModel;
                console.log('Set default HumanDefinition to first available:', firstModel);
            }
        }
    }
    
    // Final validation: ensure dropdown has a valid value selected
    if (humanDefSelect && (!humanDefSelect.value || humanDefSelect.value.trim() === '')) {
        if (humanDefs.length > 0) {
            const firstModel = humanDefs[0]['Internal ID (For Editor)'] || '';
            if (firstModel) {
                humanDefSelect.value = firstModel;
                characterData.humanDefinition = firstModel;
                console.log('Forced selection of first available HumanDefinition:', firstModel);
            }
        }
    }
    
    // Ensure characterData is updated with the final value
    if (humanDefSelect && humanDefSelect.value) {
        characterData.humanDefinition = humanDefSelect.value;
    } else {
        // If still no value, force selection of first available
        if (humanDefs.length > 0) {
            const firstModel = humanDefs[0]['Internal ID (For Editor)'] || '';
            if (firstModel && humanDefSelect) {
                humanDefSelect.value = firstModel;
                characterData.humanDefinition = firstModel;
                console.log('Force-set humanDefinition to first model:', firstModel);
            }
        }
    }
    
    // Final validation: log the current state
    if (humanDefSelect) {
        console.log('HumanDefinition dropdown state:', {
            selectedValue: humanDefSelect.value,
            characterDataValue: characterData.humanDefinition,
            optionsCount: humanDefSelect.options.length
        });
    }
}

function initializeInventoryUI() {
    const categorySelect = document.getElementById('inventoryCategory');
    const itemSelect = document.getElementById('inventoryItem');
    
    if (!categorySelect || !itemSelect) {
        console.warn('Inventory UI elements not found');
        return;
    }
    
    // Populate items when category changes
    categorySelect.addEventListener('change', () => {
        populateInventoryItemDropdown();
    });
    
    // Wait for dataLoader to be ready, then populate
    // Use a small delay to ensure dataLoader.data is fully populated
    setTimeout(() => {
        // Set default category if none selected
        if (!categorySelect.value) {
            categorySelect.value = 'consumable';
        }
        populateInventoryItemDropdown();
    }, 100);
    
    // Also try immediately in case data is already loaded
    if (dataLoader && dataLoader.data && dataLoader.loaded) {
        if (!categorySelect.value) {
            categorySelect.value = 'consumable';
        }
        populateInventoryItemDropdown();
    }
    
    // Update inventory list display
    updateInventoryList();
}

function populateInventoryItemDropdown() {
    const categorySelect = document.getElementById('inventoryCategory');
    const itemSelect = document.getElementById('inventoryItem');
    
    if (!categorySelect || !itemSelect) {
        console.warn('Inventory dropdown elements not found');
        return;
    }
    
    // Check if dataLoader is ready
    if (!dataLoader || !dataLoader.data || !dataLoader.loaded) {
        console.warn('DataLoader not ready yet, will retry...');
        // Retry after a short delay
        setTimeout(() => populateInventoryItemDropdown(), 200);
        return;
    }
    
    const category = categorySelect.value || 'consumable';
    itemSelect.innerHTML = '<option value="">-- Select an item --</option>';
    
    let items = [];
    
    // Handle weapon categories differently - they use weaponIdMapping
    if (['melee', 'closeCombat', 'ranged', 'sidearm'].includes(category)) {
        // Get weapons from weaponIdMapping and filter by category
        const weaponIdMapping = dataLoader.data.weaponIdMapping || {};
        const weaponsData = dataLoader.data.weapons || {};
        
        // Convert weaponIdMapping object to array format
        const allWeapons = Object.keys(weaponIdMapping).map(displayName => {
            const weapon = weaponIdMapping[displayName];
            return {
                displayName: displayName,
                classString: weapon.classString || ''
            };
        });
        
        // Filter weapons by category
        if (category === 'melee') {
            // Melee includes: Bladed, Blunt, Heavy, and Close Combat weapons
            // Filter by classString path or category
            items = allWeapons.filter(w => {
                const classString = (w.classString || '').toLowerCase();
                const weapon = weaponIdMapping[w.displayName];
                const weaponCategory = weapon?.category || '';
                
                // Include if it's a melee weapon (Bladed, Blunt, Heavy) OR close combat
                return classString.includes('/meleeweapons/') || 
                       classString.includes('/closecombatitems/') ||
                       weaponCategory === 'melee' || 
                       weaponCategory === 'closeCombat';
            });
            
            // Sort by display name
            items.sort((a, b) => a.displayName.localeCompare(b.displayName));
            console.log(`Found ${items.length} melee weapons (includes bladed, blunt, heavy, and close combat)`);
        } else if (category === 'closeCombat') {
            // Close Combat is a subcategory of Melee - only show close combat weapons
            // Filter by classString path or category
            items = allWeapons.filter(w => {
                const classString = (w.classString || '').toLowerCase();
                const weapon = weaponIdMapping[w.displayName];
                const weaponCategory = weapon?.category || '';
                
                // Include only close combat weapons
                return classString.includes('/closecombatitems/') ||
                       weaponCategory === 'closeCombat';
            });
            
            // Sort by display name
            items.sort((a, b) => a.displayName.localeCompare(b.displayName));
            console.log(`Found ${items.length} close combat weapons`);
        } else if (category === 'ranged') {
            // Ranged: assault, rifles, shotguns, crossbows
            const rangedTypes = ['assault', 'rifles', 'shotguns', 'crossbows'];
            const rangedNames = new Set();
            
            rangedTypes.forEach(type => {
                const weapons = weaponsData[type] || [];
                weapons.forEach(weapon => {
                    const name = weapon.DisplayName || weapon.Name || '';
                    if (name && name !== 'Unknown') {
                        rangedNames.add(name);
                    }
                });
            });
            
            // Filter weaponIdMapping by ranged names
            items = allWeapons.filter(w => rangedNames.has(w.displayName));
            
            // Also add any weapons from weaponIdMapping that have category info
            Object.keys(weaponIdMapping).forEach(displayName => {
                const weapon = weaponIdMapping[displayName];
                if (weapon.category === 'rifles' || weapon.category === 'shotguns' || 
                    weapon.category === 'assault' || weapon.category === 'crossbows' ||
                    weapon.category === 'ranged') {
                    if (!items.find(i => i.displayName === displayName)) {
                        items.push({
                            displayName: displayName,
                            classString: weapon.classString || ''
                        });
                    }
                }
            });
        } else if (category === 'sidearm') {
            // Sidearm: pistols, revolvers, assaultPistols, sidearmShotguns, sidearmAssaultShotguns
            const sidearmTypes = ['pistols', 'revolvers', 'assaultPistols', 'sidearmShotguns', 'sidearmAssaultShotguns'];
            const sidearmNames = new Set();
            
            sidearmTypes.forEach(type => {
                const weapons = weaponsData[type] || [];
                weapons.forEach(weapon => {
                    const name = weapon.DisplayName || weapon.Name || '';
                    if (name && name !== 'Unknown') {
                        sidearmNames.add(name);
                    }
                });
            });
            
            // Filter weaponIdMapping by sidearm names
            items = allWeapons.filter(w => sidearmNames.has(w.displayName));
            
            // Also add any weapons from weaponIdMapping that have category info
            Object.keys(weaponIdMapping).forEach(displayName => {
                const weapon = weaponIdMapping[displayName];
                if (weapon.category === 'pistols' || weapon.category === 'revolvers' ||
                    weapon.category === 'assaultPistols' || weapon.category === 'sidearm') {
                    if (!items.find(i => i.displayName === displayName)) {
                        items.push({
                            displayName: displayName,
                            classString: weapon.classString || ''
                        });
                    }
                }
            });
        }
        
        // Sort by display name
        items.sort((a, b) => a.displayName.localeCompare(b.displayName));
        console.log(`Found ${items.length} ${category} weapons`);
    } else if (category === 'skillBooks') {
        // Filter skill books from consumables
        if (dataLoader.data.consumableIdMapping) {
            items = dataLoader.data.consumableIdMapping.filter(item => {
                const displayName = (item.displayName || '').toLowerCase();
                return displayName.includes('textbook') || 
                       displayName.includes('training manual') || 
                       displayName.includes('guide') ||
                       displayName.includes('gainskill') ||
                       displayName.includes('respec');
            });
            // Sort by display name
            items.sort((a, b) => a.displayName.localeCompare(b.displayName));
            console.log(`Found ${items.length} skill books and manuals`);
        } else {
            console.warn('Consumable ID mapping not found for skill books');
            items = [];
        }
    } else {
        // Handle non-weapon categories (consumable, ammo, resource, miscellaneous, backpack)
        const mappingKey = {
            'consumable': 'consumableIdMapping',
            'ammo': 'ammoIdMapping',
            'resource': 'resourceIdMapping',
            'miscellaneous': 'miscellaneousIdMapping',
            'backpack': 'backpackIdMapping'
        }[category];
        
        if (mappingKey && dataLoader.data[mappingKey]) {
            items = dataLoader.data[mappingKey];
            console.log(`Found ${items.length} items for category: ${category}`);
        } else {
            console.warn(`No mapping found for category: ${category}, mappingKey: ${mappingKey}`);
        }
    }
    
    // Populate dropdown
    if (Array.isArray(items)) {
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.classString;
            
            // Check if item is deprecated
            const isDeprecated = checkItemDeprecation(item.displayName, item.classString, category);
            if (isDeprecated) {
                option.textContent = `${item.displayName} [Deprecated]`;
                option.dataset.isDeprecated = 'true';
            } else {
                option.textContent = item.displayName;
            }
            
            option.dataset.displayName = item.displayName;
            itemSelect.appendChild(option);
        });
    }
    
    console.log(`✓ Populated ${itemSelect.options.length - 1} ${category} items`);
}

// Helper function to check if an item is deprecated (for inventory items)
function isItemDeprecated(item) {
    return checkItemDeprecation(item.displayName, item.classString, item.category);
}

// Helper function to check if an item is deprecated (for dropdown items)
function checkItemDeprecation(displayName, classString, category) {
    if (!dataLoader || !dataLoader.data || !dataLoader.data.deprecatedItems) {
        return false;
    }
    
    const deprecatedItems = dataLoader.data.deprecatedItems;
    
    // Normalize category name for deprecated items lookup
    // Deprecated items file uses plural forms: "consumables", "weapons", etc.
    let categoryKey = category;
    if (category === 'melee' || category === 'closeCombat' || category === 'ranged' || category === 'sidearm') {
        categoryKey = 'weapons';
    } else if (category === 'consumable' || category === 'skillBooks') {
        // Skill books are also consumables for deprecation checking
        categoryKey = 'consumables';
    } else if (category === 'resource') {
        categoryKey = 'resources';
    } else if (category === 'miscellaneous') {
        categoryKey = 'miscellaneous'; // Already plural
    } else if (category === 'backpack') {
        categoryKey = 'backpacks';
    } else if (category === 'ammo') {
        categoryKey = 'ammo'; // Keep as is (singular in deprecated items file)
    }
    
    // Check if category exists in deprecated items
    if (deprecatedItems[categoryKey]) {
        // Check by displayName (exact match)
        if (deprecatedItems[categoryKey][displayName]) {
            return true;
        }
        
        // Check by classString (partial match)
        if (classString) {
            // Extract the class name from the classString
            const classStringParts = classString.split('.');
            const className = classStringParts[classStringParts.length - 1]?.replace('_C', '') || '';
            
            for (const key in deprecatedItems[categoryKey]) {
                const deprecatedItem = deprecatedItems[categoryKey][key];
                if (deprecatedItem.classString) {
                    const deprecatedClassParts = deprecatedItem.classString.split('.');
                    const deprecatedClassName = deprecatedClassParts[deprecatedClassParts.length - 1]?.replace('_C', '') || '';
                    
                    // Check if class names match
                    if (className && deprecatedClassName && className === deprecatedClassName) {
                        return true;
                    }
                    // Also check if classString contains the deprecated classString
                    if (classString.includes(deprecatedClassName)) {
                        return true;
                    }
                    // Check if deprecated classString contains the current classString
                    if (deprecatedItem.classString.includes(className)) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

function updateInventoryList() {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;
    
    if (characterData.inventory.length === 0) {
        inventoryList.innerHTML = '<p class="empty-message">No items in inventory. Add items above.</p>';
        return;
    }
    
    inventoryList.innerHTML = '<h3>Current Inventory</h3>';
    const list = document.createElement('ul');
    list.className = 'inventory-items-list';
    
    characterData.inventory.forEach((item, index) => {
        const isDeprecated = isItemDeprecated(item);
        const listItem = document.createElement('li');
        listItem.className = 'inventory-item';
        if (isDeprecated) {
            listItem.classList.add('deprecated-item');
        }
        listItem.innerHTML = `
            <span class="item-info">
                <strong>${item.displayName}</strong> 
                ${isDeprecated ? '<span class="deprecated-badge">[Deprecated]</span>' : ''}
                <span class="item-category">(${item.category})</span>
                <span class="item-quantity">x${item.quantity}</span>
            </span>
            <button type="button" class="btn-remove-item" onclick="removeInventoryItem(${index})" title="Remove item">×</button>
        `;
        list.appendChild(listItem);
    });
    
    inventoryList.appendChild(list);
}

function addInventoryItem() {
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:913',message:'addInventoryItem called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const categorySelect = document.getElementById('inventoryCategory');
    const itemSelect = document.getElementById('inventoryItem');
    const quantityInput = document.getElementById('inventoryQuantity');
    
    if (!categorySelect || !itemSelect || !quantityInput) {
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:918',message:'Early return - missing form elements',data:{hasCategorySelect:!!categorySelect,hasItemSelect:!!itemSelect,hasQuantityInput:!!quantityInput},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return;
    }
    
    const category = categorySelect.value;
    const classString = itemSelect.value;
    const displayName = itemSelect.options[itemSelect.selectedIndex]?.dataset.displayName || itemSelect.options[itemSelect.selectedIndex]?.textContent || 'Unknown';
    const quantity = parseInt(quantityInput.value) || 1;
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:923',message:'Item data extracted',data:{category:category,classString:classString,displayName:displayName,quantity:quantity,hasClassString:!!classString},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (!classString || classString === '') {
        // #region agent log
        fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:925',message:'Validation failed - no classString',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        showNotification('Please select an item', 'warning');
        return;
    }
    
    // Add item to inventory
    const inventoryItem = {
        category: category,
        classString: classString,
        displayName: displayName,
        quantity: quantity
    };
    characterData.inventory.push(inventoryItem);
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:931',message:'Item added to inventory',data:{inventoryItem:inventoryItem,inventoryLength:characterData.inventory.length},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Update display
    updateInventoryList();
    
    // Reset form
    itemSelect.value = '';
    quantityInput.value = 1;
    
    showNotification(`Added ${displayName} (x${quantity}) to inventory`, 'success');
}

function removeInventoryItem(index) {
    if (index >= 0 && index < characterData.inventory.length) {
        const item = characterData.inventory[index];
        characterData.inventory.splice(index, 1);
        updateInventoryList();
        showNotification(`Removed ${item.displayName} from inventory`, 'info');
    }
}

// Make removeInventoryItem globally available
window.removeInventoryItem = removeInventoryItem;

function setupEventListeners() {
    // Form field listeners
    document.getElementById('gender').addEventListener('change', (e) => {
        characterData.gender = e.target.value;
        updateVoiceOptions();
        updateHumanDefinitionOptions();
        updateCharacterData();
    });
    
    document.getElementById('ageRange').addEventListener('change', (e) => {
        characterData.ageRange = e.target.value;
        updateDescriptorTraits();
        updateCharacterData();
    });
    
    document.getElementById('pronoun').addEventListener('change', (e) => {
        characterData.pronoun = e.target.value;
        updateDescriptorTraits();
        updateCharacterData();
    });
    
    document.getElementById('philosophy1').addEventListener('change', (e) => {
        characterData.philosophy1 = e.target.value;
        updateDescriptorTraits();
        updateCharacterData();
    });
    
    // Ensure humanDefinition updates characterData when changed
    const humanDefSelect = document.getElementById('humanDefinition');
    if (humanDefSelect) {
        humanDefSelect.addEventListener('change', (e) => {
            characterData.humanDefinition = e.target.value;
            console.log('HumanDefinition changed to:', e.target.value);
            updateCharacterData();
        });
    }
    
    document.getElementById('philosophy2').addEventListener('change', (e) => {
        characterData.philosophy2 = e.target.value;
        updateDescriptorTraits();
        updateCharacterData();
    });
    
    // Add listeners for all form fields
    const formFields = ['firstName', 'lastName', 'nickname', 'culturalBackground', 
                       'voiceID', 'humanDefinition', 'standingLevel', 'leaderType', 
                       'heroBonus', 'currentHealth', 'currentStamina'];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updateCharacterData);
            field.addEventListener('change', updateCharacterData);
        }
    });
    
    // Add listeners for health/stamina to update stat displays
    const healthInput = document.getElementById('currentHealth');
    const staminaInput = document.getElementById('currentStamina');
    if (healthInput) {
        healthInput.addEventListener('input', () => {
            updateCharacterData();
            // Recalculate stat displays with current trait buffs
            const selectedTraits = characterData.traits.optional || [];
            let totalHealthBuff = 0;
            let totalStaminaBuff = 0;
            selectedTraits.forEach(trait => {
                const fullTrait = dataLoader.data.traits.find(t => t.name === trait.name);
                if (fullTrait && fullTrait.buffs) {
                    fullTrait.buffs.forEach(buff => {
                        const stat = buff.stat.toLowerCase();
                        const value = parseInt(buff.value) || 0;
                        if (stat.includes('health')) {
                            totalHealthBuff += value;
                        } else if (stat.includes('stamina')) {
                            totalStaminaBuff += value;
                        }
                    });
                }
            });
            updateStatDisplays(totalHealthBuff, totalStaminaBuff);
        });
    }
    if (staminaInput) {
        staminaInput.addEventListener('input', () => {
            updateCharacterData();
            // Recalculate stat displays with current trait buffs
            const selectedTraits = characterData.traits.optional || [];
            let totalHealthBuff = 0;
            let totalStaminaBuff = 0;
            selectedTraits.forEach(trait => {
                const fullTrait = dataLoader.data.traits.find(t => t.name === trait.name);
                if (fullTrait && fullTrait.buffs) {
                    fullTrait.buffs.forEach(buff => {
                        const stat = buff.stat.toLowerCase();
                        const value = parseInt(buff.value) || 0;
                        if (stat.includes('health')) {
                            totalHealthBuff += value;
                        } else if (stat.includes('stamina')) {
                            totalStaminaBuff += value;
                        }
                    });
                }
            });
            updateStatDisplays(totalHealthBuff, totalStaminaBuff);
        });
    }
    
    // Export buttons
    document.getElementById('exportBtn').addEventListener('click', exportCharacter);
    document.getElementById('previewBtn').addEventListener('click', previewXML);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Inventory button
    const addInventoryBtn = document.getElementById('addInventoryItemBtn');
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', addInventoryItem);
    }
    
    // Randomizer buttons
    document.getElementById('randomizeBtn').addEventListener('click', randomizeFullCharacter);
    document.getElementById('randomizePartialBtn').addEventListener('click', randomizeSelected);
    
    // Show/hide trait mode selection when traits checkbox is checked
    document.getElementById('randTraits').addEventListener('change', (e) => {
        document.getElementById('traitModeSelection').style.display = e.target.checked ? 'block' : 'none';
    });
}

function updateDescriptorTraits() {
    // Update required trait descriptors based on character attributes
    // Map age range to correct descriptor format
    let ageDescriptorName = characterData.ageRange;
    if (ageDescriptorName === 'MiddleAged') {
        ageDescriptorName = 'MiddleAge';
    }
    const ageDescriptor = `Descriptor_Age_${ageDescriptorName}`;
    const pronounDescriptor = `Descriptor_Pronoun_${characterData.pronoun}`;
    const philosophy1Descriptor = `Descriptor_Philosophy_${characterData.philosophy1}`;
    const philosophy2Descriptor = characterData.philosophy1 !== characterData.philosophy2 
        ? `Descriptor_Philosophy_${characterData.philosophy2}` 
        : null;
    
    document.getElementById('ageDescriptorValue').textContent = characterData.ageRange;
    document.getElementById('pronounDescriptorValue').textContent = characterData.pronoun;
    document.getElementById('philosophy1DescriptorValue').textContent = characterData.philosophy1;
    const philo2El = document.getElementById('philosophy2DescriptorValue');
    if (philo2El) {
        philo2El.textContent = philosophy2Descriptor ? characterData.philosophy2 : '(same as Philosophy 1)';
    }
    
    // Update character data required traits
    characterData.traits.required = [
        { name: 'Default', traitResourceID: 'Default' },
        { name: ageDescriptor, traitResourceID: ageDescriptor },
        { name: pronounDescriptor, traitResourceID: pronounDescriptor },
        { name: philosophy1Descriptor, traitResourceID: philosophy1Descriptor }
    ];
    
    // Only add philosophy2 if it's different from philosophy1 (avoid duplicates)
    if (characterData.philosophy1 !== characterData.philosophy2) {
        characterData.traits.required.push({
            name: philosophy2Descriptor, 
            traitResourceID: philosophy2Descriptor
        });
    }
}

function updateCharacterData() {
    // Update characterData object from form
    characterData.firstName = document.getElementById('firstName').value;
    characterData.lastName = document.getElementById('lastName').value;
    characterData.nickname = document.getElementById('nickname').value;
    characterData.gender = document.getElementById('gender').value;
    characterData.ageRange = document.getElementById('ageRange').value;
    characterData.pronoun = document.getElementById('pronoun').value;
    characterData.culturalBackground = document.getElementById('culturalBackground').value;
    // Only update voiceID if form has a value, otherwise preserve existing
    const voiceSelect = document.getElementById('voiceID');
    const voiceValue = voiceSelect?.value || '';
    if (voiceValue && voiceValue.trim() !== '') {
        characterData.voiceID = voiceValue;
    } else if (!characterData.voiceID) {
        // Only set to empty if characterData doesn't already have a value
        characterData.voiceID = '';
    }
    characterData.humanDefinition = document.getElementById('humanDefinition').value;
    characterData.philosophy1 = document.getElementById('philosophy1').value;
    characterData.philosophy2 = document.getElementById('philosophy2').value;
    
    // Ensure standingLevel and leaderType are always valid
    const standingSelect = document.getElementById('standingLevel');
    let standingLevel = standingSelect ? standingSelect.value : '';
    if (!standingLevel || standingLevel.trim() === '') {
        standingLevel = 'Citizen';
        if (standingSelect) standingSelect.value = standingLevel;
    }
    // If it's an object, extract the value
    if (typeof standingLevel === 'object' && standingLevel.value) {
        standingLevel = standingLevel.value;
    }
    characterData.standingLevel = standingLevel;
    
    const leaderSelect = document.getElementById('leaderType');
    let leaderType = leaderSelect ? leaderSelect.value : '';
    if (!leaderType || leaderType.trim() === '') {
        leaderType = 'None';
        if (leaderSelect) leaderSelect.value = leaderType;
    }
    // If it's an object, extract the value
    if (typeof leaderType === 'object' && leaderType.value) {
        leaderType = leaderType.value;
    }
    characterData.leaderType = leaderType;
    
    characterData.heroBonus = document.getElementById('heroBonus').value;
    characterData.stats.health = parseInt(document.getElementById('currentHealth').value) || 100;
    characterData.stats.stamina = parseInt(document.getElementById('currentStamina').value) || 100;
    
    // Update skills
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        characterData.skills[skill].level = parseInt(document.getElementById(`${skill}Level`).value) || 0;
        characterData.skills[skill].specialty = document.getElementById(`${skill}SpecialtySelect`)?.value || '';
    });
    
    // Update 5th skill
    const fifthSkillType = document.querySelector('input[name="fifthSkillType"]:checked')?.value || 'none';
    characterData.skills.fifthSkill.type = fifthSkillType;
    characterData.skills.fifthSkill.skill = document.getElementById('fifthSkill').value || '';
    
    updateDescriptorTraits();
    
    // Recalculate and update stat displays when base stats change
    const { totalHealthBuff, totalStaminaBuff } = calculateTraitBuffs();
    updateStatDisplays(totalHealthBuff, totalStaminaBuff);
}

// Make updateCharacterData globally available
window.updateCharacterData = updateCharacterData;

function resetForm() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.getElementById('characterForm').reset();
        characterData.traits.optional = [];
        updateSelectedTraitsDisplay();
        updateCharacterData();
    }
}

function previewXML() {
    // Ensure humanDefinition is set before generating XML
    ensureHumanDefinitionSet();
    // Ensure skills are initialized in form
    ensureSkillsInitialized();
    // Ensure form data is saved before generating XML
    updateCharacterDataWithoutValidation();
    const xml = generateCharacterXML();
    const previewArea = document.getElementById('previewArea');
    const xmlPreview = document.getElementById('xmlPreview');
    xmlPreview.textContent = xml;
    previewArea.style.display = 'block';
    previewArea.scrollIntoView({ behavior: 'smooth' });
}

function exportCharacter() {
    // CRITICAL: Force full initialization like randomization does
    // This ensures all dropdowns are populated and all fields are synced
    console.log('Exporting character - forcing full initialization...');
    
    // Step 1: Ensure all dropdowns are populated (like initializeForm does)
    updateVoiceOptions();
    updateHumanDefinitionOptions();
    
    // Step 2: Wait for dropdowns to be ready, then sync everything
    waitForCondition(() => {
        const humanDefSelect = document.getElementById('humanDefinition');
        return humanDefSelect && humanDefSelect.options.length > 1;
    }, 2000, 50).then(() => {
        // Step 3: Ensure humanDefinition is set (critical!)
        ensureHumanDefinitionSet();
        
        // Step 3.5: Ensure voiceID is set (also required!)
        const voiceSelect = document.getElementById('voiceID');
        if (voiceSelect) {
            if (!voiceSelect.value || voiceSelect.value.trim() === '') {
                // Set default voice based on gender
                const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
                const voices = dataLoader.getVoices(gender);
                if (voices && voices.length > 0) {
                    // Use first available voice as default
                    const defaultVoice = voices[0]['Editor ID'] || voices[0].value || 'Kee';
                    voiceSelect.value = defaultVoice;
                    characterData.voiceID = defaultVoice;
                    console.log('Set default voiceID:', defaultVoice);
                } else {
                    // Fallback to characterData default
                    voiceSelect.value = characterData.voiceID || 'Kee';
                    characterData.voiceID = characterData.voiceID || 'Kee';
                }
            } else {
                // Ensure characterData is synced
                characterData.voiceID = voiceSelect.value;
            }
        }
        
        // Step 4: Trigger change events to ensure all dependent fields are updated
        const genderSelect = document.getElementById('gender');
        if (genderSelect) {
            genderSelect.dispatchEvent(new Event('change'));
        }
        
        // Step 5: Wait a moment for change events to process
        setTimeout(() => {
            // Step 6: Sync all form data to characterData
            updateCharacterDataWithoutValidation();
            
            // Step 7: Run finalization with retry logic (same as randomization)
            finalizeCharacterDataForExport();
            
            // Step 8: Give finalization a moment to complete any retries
            setTimeout(() => {
                const xml = generateCharacterXML();
                const firstName = characterData.firstName || 'Character';
                const lastName = characterData.lastName || '';
                const nickname = characterData.nickname || '';
                const filename = `${firstName} ${lastName}${nickname ? ` (${nickname})` : ''}`;
                
                console.log('Exporting filename:', filename);
                
                // Use octet-stream to prevent browser from adding any extension
                const blob = new Blob([xml], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Ensure filename has no extension - browser won't add one with octet-stream
                a.download = filename;
                a.setAttribute('download', filename);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 300); // Allow finalization retries to complete
        }, 200); // Allow change events to process
    }).catch(() => {
        console.warn('Timeout waiting for dropdowns, proceeding anyway');
        // Fallback: try to export anyway
        ensureHumanDefinitionSet();
        
        // Ensure voiceID is set in fallback too
        const voiceSelect = document.getElementById('voiceID');
        if (voiceSelect && (!voiceSelect.value || voiceSelect.value.trim() === '')) {
            const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
            const voices = dataLoader.getVoices(gender);
            if (voices && voices.length > 0) {
                voiceSelect.value = voices[0].value || 'Kee';
                characterData.voiceID = voices[0].value || 'Kee';
            } else {
                voiceSelect.value = characterData.voiceID || 'Kee';
            }
        }
        
        updateCharacterDataWithoutValidation();
        finalizeCharacterDataForExport();
        
        setTimeout(() => {
            const xml = generateCharacterXML();
            const firstName = characterData.firstName || 'Character';
            const lastName = characterData.lastName || '';
            const nickname = characterData.nickname || '';
            const filename = `${firstName} ${lastName}${nickname ? ` (${nickname})` : ''}`;
            
            const blob = new Blob([xml], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 300);
    });
}

// Randomizer functions
function randomizeFullCharacter() {
    try {
        console.log('Randomizing full character...');
        
        if (!randomizer) {
            console.error('Randomizer not available');
            showNotification('Error: Randomizer not loaded', 'error');
            return;
        }
        
        const options = {
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            traitMode: document.querySelector('input[name="traitMode"]:checked')?.value || 'mixed',
            traitLimit: 999 // No practical limit
        };
        
        console.log('Randomizer options:', options);
        const randomChar = randomizer.randomizeCharacter(options);
        console.log('Randomized character:', randomChar);
        
        populateFormFromCharacter(randomChar);
        
        // Show notification
        showNotification('Character randomized!', 'success');
    } catch (error) {
        console.error('Error randomizing character:', error);
        showNotification('Error randomizing character. Check console for details.', 'error');
    }
}

function randomizeSelected() {
    const options = {
        gender: characterData.gender,
        name: document.getElementById('randName').checked,
        culturalBackground: document.getElementById('randAttributes').checked,
        voice: document.getElementById('randAttributes').checked,
        humanDefinition: document.getElementById('randAttributes').checked,
        skills: document.getElementById('randSkills').checked,
        traits: document.getElementById('randTraits').checked,
        stats: document.getElementById('randStats').checked,
        standingLevel: document.getElementById('randStanding').checked,
        leaderType: document.getElementById('randStanding').checked,
        traitMode: document.querySelector('input[name="traitMode"]:checked')?.value || 'mixed',
        traitLimit: 999 // No practical limit
    };
    
    // If name is checked, randomize gender too
    if (options.name) {
        options.gender = Math.random() > 0.5 ? 'Male' : 'Female';
    }
    
    const randomChar = randomizer.randomizeCharacter(options);
    populateFormFromCharacter(randomChar, options);
    
    // Show notification
    showNotification('Selected options randomized!', 'success');
}

// Helper function to wait for a condition
function waitForCondition(condition, timeout = 5000, interval = 50) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
            if (condition()) {
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Condition timeout'));
            } else {
                setTimeout(check, interval);
            }
        };
        check();
    });
}

// Finalize character data for export (without char parameter)
function finalizeCharacterDataForExport() {
    // Final validation: ensure all critical fields are set
    ensureHumanDefinitionSet();
    
    // Ensure voiceID is set (required field)
    const voiceSelect = document.getElementById('voiceID');
    if (voiceSelect) {
        if (!voiceSelect.value || voiceSelect.value.trim() === '') {
            // Set default voice based on gender
            const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
            const voices = dataLoader.getVoices(gender);
            if (voices && voices.length > 0) {
                const defaultVoice = voices[0]['Editor ID'] || 'Kee';
                voiceSelect.value = defaultVoice;
                characterData.voiceID = defaultVoice;
                console.log('Finalize: Set default voiceID:', defaultVoice);
            } else {
                // Fallback
                voiceSelect.value = characterData.voiceID || 'Kee';
                characterData.voiceID = characterData.voiceID || 'Kee';
            }
        } else {
            // Ensure characterData is synced
            characterData.voiceID = voiceSelect.value;
        }
    }
    
    // Ensure standingLevel and leaderType are valid
    const standingSelect = document.getElementById('standingLevel');
    if (standingSelect) {
        if (!standingSelect.value || standingSelect.value.trim() === '') {
            standingSelect.value = characterData.standingLevel || 'Citizen';
        }
    }
    
    const leaderSelect = document.getElementById('leaderType');
    if (leaderSelect) {
        if (!leaderSelect.value || leaderSelect.value.trim() === '') {
            leaderSelect.value = characterData.leaderType || 'None';
        }
    }
    
    // CRITICAL: Ensure skills are always set in form, even if not randomized
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        const levelInput = document.getElementById(`${skill}Level`);
        if (levelInput) {
            const currentValue = parseInt(levelInput.value);
            if (isNaN(currentValue) || levelInput.value === '') {
                levelInput.value = 0;
                const levelDisplay = document.getElementById(`${skill}LevelDisplay`);
                if (levelDisplay) levelDisplay.textContent = '0';
            }
        }
    });
    
    // Ensure 5th skill is set
    const fifthSkillRadio = document.querySelector(`input[name="fifthSkillType"]:checked`);
    if (!fifthSkillRadio) {
        const noneRadio = document.querySelector(`input[name="fifthSkillType"][value="none"]`);
        if (noneRadio) {
            noneRadio.checked = true;
            noneRadio.dispatchEvent(new Event('change'));
        }
    }
    
    // Update all character data
    updateCharacterDataWithoutValidation();
    
    // Final validation check - retry if critical fields are missing
    let retries = 0;
    const maxRetries = 3;
    const validateAndRetry = () => {
        const issues = [];
        
        if (!characterData.humanDefinition || characterData.humanDefinition.trim() === '') {
            issues.push('humanDefinition');
            ensureHumanDefinitionSet();
        }
        
        if (!characterData.voiceID || characterData.voiceID.trim() === '') {
            issues.push('voiceID');
            const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
            const voices = dataLoader.getVoices(gender);
            if (voices && voices.length > 0) {
                const defaultVoice = voices[0]['Editor ID'] || 'Kee';
                if (voiceSelect) voiceSelect.value = defaultVoice;
                characterData.voiceID = defaultVoice;
            } else {
                characterData.voiceID = 'Kee';
                if (voiceSelect) voiceSelect.value = 'Kee';
            }
        }
        
        if (!characterData.standingLevel || characterData.standingLevel.trim() === '') {
            issues.push('standingLevel');
            if (standingSelect) standingSelect.value = 'Citizen';
        }
        
        if (!characterData.leaderType || characterData.leaderType.trim() === '') {
            issues.push('leaderType');
            if (leaderSelect) leaderSelect.value = 'None';
        }
        
        // Validate skills are properly initialized
        if (!characterData.skills) {
            issues.push('skills (missing object)');
            characterData.skills = {
                cardio: { level: 0, specialty: '' },
                wits: { level: 0, specialty: '' },
                fighting: { level: 0, specialty: '' },
                shooting: { level: 0, specialty: '' },
                fifthSkill: { type: 'none', skill: '' }
            };
        } else {
            // Ensure each skill has a valid level (at least 0)
            ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
                if (!characterData.skills[skill] || typeof characterData.skills[skill].level !== 'number') {
                    issues.push(`skills.${skill} (invalid)`);
                    characterData.skills[skill] = { level: 0, specialty: '' };
                }
            });
            if (!characterData.skills.fifthSkill) {
                characterData.skills.fifthSkill = { type: 'none', skill: '' };
            }
        }
        
        if (issues.length > 0 && retries < maxRetries) {
            retries++;
            console.warn(`Export retry ${retries}: Missing fields: ${issues.join(', ')}`);
            updateCharacterDataWithoutValidation();
            setTimeout(validateAndRetry, 100);
        } else if (issues.length > 0) {
            console.error('CRITICAL: Some fields still missing after retries:', issues);
        } else {
            console.log('✓ Character data finalized for export:', {
                humanDefinition: characterData.humanDefinition,
                voiceID: characterData.voiceID,
                standingLevel: characterData.standingLevel,
                leaderType: characterData.leaderType,
                skills: characterData.skills
            });
        }
    };
    
    validateAndRetry();
}

// Finalize character data - ensures all fields are set correctly
function finalizeCharacterData(char, options) {
    // Final validation: ensure all critical fields are set
    ensureHumanDefinitionSet();
    
    // Ensure standingLevel and leaderType are valid
    const standingSelect = document.getElementById('standingLevel');
    if (standingSelect) {
        if (!standingSelect.value || standingSelect.value.trim() === '') {
            standingSelect.value = char.standingLevel || 'Citizen';
        }
    }
    
    const leaderSelect = document.getElementById('leaderType');
    if (leaderSelect) {
        if (!leaderSelect.value || leaderSelect.value.trim() === '') {
            leaderSelect.value = char.leaderType || 'None';
        }
    }
    
    // CRITICAL: Ensure skills are always set in form, even if not randomized
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        const levelInput = document.getElementById(`${skill}Level`);
        if (levelInput) {
            const currentValue = parseInt(levelInput.value);
            if (isNaN(currentValue) || levelInput.value === '') {
                levelInput.value = 0;
                const levelDisplay = document.getElementById(`${skill}LevelDisplay`);
                if (levelDisplay) levelDisplay.textContent = '0';
            }
        }
    });
    
    // Ensure 5th skill is set
    const fifthSkillRadio = document.querySelector(`input[name="fifthSkillType"]:checked`);
    if (!fifthSkillRadio) {
        const noneRadio = document.querySelector(`input[name="fifthSkillType"][value="none"]`);
        if (noneRadio) {
            noneRadio.checked = true;
            noneRadio.dispatchEvent(new Event('change'));
        }
    }
    
    // Update all character data
    updateCharacterDataWithoutValidation();
    
    // Final validation check - retry if critical fields are missing
    let retries = 0;
    const maxRetries = 3;
    const validateAndRetry = () => {
        const issues = [];
        
        if (!characterData.humanDefinition || characterData.humanDefinition.trim() === '') {
            issues.push('humanDefinition');
            ensureHumanDefinitionSet();
        }
        
        if (!characterData.voiceID || characterData.voiceID.trim() === '') {
            issues.push('voiceID');
            const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
            const voices = dataLoader.getVoices(gender);
            if (voices && voices.length > 0) {
                const defaultVoice = voices[0]['Editor ID'] || 'Kee';
                if (voiceSelect) voiceSelect.value = defaultVoice;
                characterData.voiceID = defaultVoice;
            } else {
                characterData.voiceID = 'Kee';
                if (voiceSelect) voiceSelect.value = 'Kee';
            }
        }
        
        if (!characterData.standingLevel || characterData.standingLevel.trim() === '') {
            issues.push('standingLevel');
            if (standingSelect) standingSelect.value = 'Citizen';
        }
        
        if (!characterData.leaderType || characterData.leaderType.trim() === '') {
            issues.push('leaderType');
            if (leaderSelect) leaderSelect.value = 'None';
        }
        
        // Validate skills are properly initialized
        if (!characterData.skills) {
            issues.push('skills (missing object)');
            characterData.skills = {
                cardio: { level: 0, specialty: '' },
                wits: { level: 0, specialty: '' },
                fighting: { level: 0, specialty: '' },
                shooting: { level: 0, specialty: '' },
                fifthSkill: { type: 'none', skill: '' }
            };
        } else {
            // Ensure each skill has a valid level (at least 0)
            ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
                if (!characterData.skills[skill] || typeof characterData.skills[skill].level !== 'number') {
                    issues.push(`skills.${skill} (invalid)`);
                    characterData.skills[skill] = { level: 0, specialty: '' };
                }
            });
            if (!characterData.skills.fifthSkill) {
                characterData.skills.fifthSkill = { type: 'none', skill: '' };
            }
        }
        
        if (issues.length > 0 && retries < maxRetries) {
            retries++;
            console.warn(`Retry ${retries}: Missing fields: ${issues.join(', ')}`);
            updateCharacterDataWithoutValidation();
            setTimeout(validateAndRetry, 100);
        } else if (issues.length > 0) {
            console.error('CRITICAL: Some fields still missing after retries:', issues);
        } else {
            console.log('✓ Character data finalized successfully:', {
                humanDefinition: characterData.humanDefinition,
                standingLevel: characterData.standingLevel,
                leaderType: characterData.leaderType,
                voiceID: characterData.voiceID,
                firstName: characterData.firstName,
                lastName: characterData.lastName,
                skills: characterData.skills
            });
        }
    };
    
    validateAndRetry();
}

function populateFormFromCharacter(char, options = {}) {
    try {
        // Name and age
        if (options.name !== false) {
            document.getElementById('firstName').value = char.firstName || '';
            document.getElementById('lastName').value = char.lastName || '';
            document.getElementById('nickname').value = char.nickname || '';
            document.getElementById('ageRange').value = char.ageRange || 'MiddleAged';
            document.getElementById('gender').value = char.gender || 'Female';
            document.getElementById('pronoun').value = char.pronoun || 'She';
            // Trigger change events to update dependent fields
            document.getElementById('gender').dispatchEvent(new Event('change'));
            
            // Wait for gender change to process, then update options
            setTimeout(() => {
                updateVoiceOptions();
                updateHumanDefinitionOptions();
                
                // Wait for options to be populated before continuing
                waitForCondition(() => {
                    const humanDefSelect = document.getElementById('humanDefinition');
                    return humanDefSelect && humanDefSelect.options.length > 1;
                }, 2000, 50).then(() => {
                    // Continue with setting values after options are ready
                    continuePopulatingForm(char, options);
                }).catch(() => {
                    console.warn('Timeout waiting for options, continuing anyway');
                    continuePopulatingForm(char, options);
                });
            }, 150);
        } else {
            // Name not randomized, but still need to ensure everything is set
            continuePopulatingForm(char, options);
        }
    } catch (error) {
        console.error('Error populating form:', error);
        showNotification('Error populating form. Check console for details.', 'error');
    }
}

function continuePopulatingForm(char, options = {}) {
    try {
    
        // Attributes - need to wait for gender change to populate options
        if (options.culturalBackground !== false) {
            setTimeout(() => {
                const bgSelect = document.getElementById('culturalBackground');
                if (bgSelect && char.culturalBackground) {
                    bgSelect.value = char.culturalBackground;
                    bgSelect.dispatchEvent(new Event('change'));
                }
            }, 200);
        }
        if (options.voice !== false) {
            setTimeout(() => {
                const voiceSelect = document.getElementById('voiceID');
                if (voiceSelect && char.voiceID) {
                    // Wait a bit more to ensure options are populated
                    setTimeout(() => {
                        // Try to find matching option - check both value and text content
                        const options = Array.from(voiceSelect.options);
                        const voiceIDBase = char.voiceID.split('_')[0]; // Get base name (e.g., "Kee" from "Kee_Low")
                        const matchingOption = options.find(opt => {
                            const optValue = opt.value || '';
                            const optText = opt.textContent || '';
                            return optValue === char.voiceID || 
                                   optValue.includes(voiceIDBase) ||
                                   optText.includes(voiceIDBase) ||
                                   optValue === voiceIDBase ||
                                   optText.includes(char.voiceID);
                        });
                        if (matchingOption) {
                            voiceSelect.value = matchingOption.value;
                            voiceSelect.dispatchEvent(new Event('change'));
                        } else {
                            // If no match found, try to set it directly
                            console.warn('Voice ID not found in options:', char.voiceID);
                            // Try to create option if it doesn't exist
                            const newOption = document.createElement('option');
                            newOption.value = char.voiceID;
                            newOption.textContent = char.voiceID;
                            voiceSelect.appendChild(newOption);
                            voiceSelect.value = char.voiceID;
                            voiceSelect.dispatchEvent(new Event('change'));
                        }
                    }, 300);
                }
            }, 300);
        }
        // Always ensure humanDefinition is set - this is critical
        if (options.humanDefinition !== false && char.humanDefinition) {
            // Wait for updateHumanDefinitionOptions to complete, then set the value
            waitForCondition(() => {
                const modelSelect = document.getElementById('humanDefinition');
                return modelSelect && modelSelect.options.length > 1;
            }, 3000, 50).then(() => {
                const modelSelect = document.getElementById('humanDefinition');
                if (modelSelect && char.humanDefinition) {
                    const options = Array.from(modelSelect.options);
                    
                    // Try to find matching option
                    const matchingOption = options.find(opt => 
                        opt.value === char.humanDefinition ||
                        opt.value.includes(char.humanDefinition.split('_')[0]) ||
                        opt.textContent.includes(char.humanDefinition.split('_')[0])
                    );
                    
                    if (matchingOption && matchingOption.value) {
                        modelSelect.value = matchingOption.value;
                        characterData.humanDefinition = matchingOption.value;
                        modelSelect.dispatchEvent(new Event('change'));
                        console.log('✓ Set humanDefinition from randomized character:', matchingOption.value);
                    } else if (char.humanDefinition && options.length > 1) {
                        // Try to set it directly
                        modelSelect.value = char.humanDefinition;
                        characterData.humanDefinition = char.humanDefinition;
                        modelSelect.dispatchEvent(new Event('change'));
                        console.log('✓ Set humanDefinition directly:', char.humanDefinition);
                    } else {
                        // Fallback
                        console.warn('Could not set humanDefinition from randomized value, using fallback');
                        ensureHumanDefinitionSet();
                    }
                }
            }).catch(() => {
                console.warn('Timeout waiting for humanDefinition options, using fallback');
                ensureHumanDefinitionSet();
            });
        } else {
            // Not randomized or no value, but ensure it's set
            setTimeout(() => {
                ensureHumanDefinitionSet();
            }, 300);
        }
        
        // Philosophies
        const philo1Select = document.getElementById('philosophy1');
        const philo2Select = document.getElementById('philosophy2');
        if (philo1Select) philo1Select.value = char.philosophy1 || 'Prudent';
        if (philo2Select) philo2Select.value = char.philosophy2 || 'Pragmatic';
        
        // Standing and leader
        // Always ensure standingLevel and leaderType are set to valid values
        // Even if not randomized, they need to have valid defaults
        const standingSelect = document.getElementById('standingLevel');
        if (standingSelect) {
            if (options.standingLevel !== false) {
                // Set from randomized character
                standingSelect.value = char.standingLevel || 'Citizen';
            } else {
                // Not randomized, but ensure it has a valid value
                const currentValue = standingSelect.value;
                if (!currentValue || currentValue.trim() === '') {
                    standingSelect.value = 'Citizen';
                }
            }
        }
        
        const leaderSelect = document.getElementById('leaderType');
        if (leaderSelect) {
            if (options.leaderType !== false) {
                // Set from randomized character
                leaderSelect.value = char.leaderType || 'None';
            } else {
                // Not randomized, but ensure it has a valid value
                const currentValue = leaderSelect.value;
                if (!currentValue || currentValue.trim() === '') {
                    leaderSelect.value = 'None';
                }
            }
        }
        
        // Skills
        if (options.skills !== false && char.skills) {
            ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
                const level = char.skills[skill]?.level || 0;
                const levelInput = document.getElementById(`${skill}Level`);
                const levelDisplay = document.getElementById(`${skill}LevelDisplay`);
                if (levelInput) levelInput.value = level;
                if (levelDisplay) levelDisplay.textContent = level;
                
                // Show/hide specialty based on level
                const specialtyDiv = document.getElementById(`${skill}Specialty`);
                const specialtySelect = document.getElementById(`${skill}SpecialtySelect`);
                if (level >= 5 && specialtyDiv) {
                    specialtyDiv.style.display = 'block';
                    if (char.skills[skill].specialty && specialtySelect) {
                        specialtySelect.value = char.skills[skill].specialty;
                    }
                } else if (specialtyDiv) {
                    specialtyDiv.style.display = 'none';
                    if (specialtySelect) specialtySelect.value = '';
                }
            });
            
            // 5th skill
            if (char.skills.fifthSkill) {
                const fifthSkillType = char.skills.fifthSkill.type || 'none';
                const fifthSkillRadio = document.querySelector(`input[name="fifthSkillType"][value="${fifthSkillType}"]`);
                if (fifthSkillRadio) {
                    fifthSkillRadio.checked = true;
                    // Trigger change to populate options
                    fifthSkillRadio.dispatchEvent(new Event('change'));
                    if (fifthSkillType !== 'none' && char.skills.fifthSkill.skill) {
                        setTimeout(() => {
                            const fifthSkillSelect = document.getElementById('fifthSkill');
                            if (fifthSkillSelect) {
                                // Try to find matching option
                                const options = Array.from(fifthSkillSelect.options);
                                const matchingOption = options.find(opt => 
                                    opt.value === char.skills.fifthSkill.skill ||
                                    opt.textContent === char.skills.fifthSkill.skill ||
                                    opt.value.toLowerCase().includes(char.skills.fifthSkill.skill.toLowerCase())
                                );
                                if (matchingOption) {
                                    fifthSkillSelect.value = matchingOption.value;
                                } else {
                                    // If no match, try to set it directly
                                    fifthSkillSelect.value = char.skills.fifthSkill.skill;
                                }
                                fifthSkillSelect.dispatchEvent(new Event('change'));
                            }
                        }, 300);
                    } else if (fifthSkillType === 'none') {
                        // Make sure none is selected
                        const noneRadio = document.querySelector('input[name="fifthSkillType"][value="none"]');
                        if (noneRadio) noneRadio.checked = true;
                    }
                }
            }
        } else {
            // Skills not randomized - ensure form has default values (0)
            ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
                const levelInput = document.getElementById(`${skill}Level`);
                const levelDisplay = document.getElementById(`${skill}LevelDisplay`);
                if (levelInput && (!levelInput.value || levelInput.value === '')) {
                    levelInput.value = 0;
                }
                if (levelDisplay) levelDisplay.textContent = levelInput?.value || 0;
                
                // Ensure specialty is hidden if level < 5
                const specialtyDiv = document.getElementById(`${skill}Specialty`);
                const specialtySelect = document.getElementById(`${skill}SpecialtySelect`);
                const level = parseInt(levelInput?.value) || 0;
                if (level < 5 && specialtyDiv) {
                    specialtyDiv.style.display = 'none';
                    if (specialtySelect) specialtySelect.value = '';
                }
            });
            
            // Ensure 5th skill is set to 'none' if not set
            const fifthSkillRadio = document.querySelector(`input[name="fifthSkillType"][value="none"]`);
            if (fifthSkillRadio && !fifthSkillRadio.checked) {
                fifthSkillRadio.checked = true;
                fifthSkillRadio.dispatchEvent(new Event('change'));
            }
        }
        
        // Traits
        if (options.traits !== false && char.traits) {
            characterData.traits.optional = char.traits.optional || [];
            if (typeof updateSelectedTraitsDisplay === 'function') {
                updateSelectedTraitsDisplay();
            }
        }
        
        // Stats
        if (options.stats !== false && char.stats) {
            const healthInput = document.getElementById('currentHealth');
            const staminaInput = document.getElementById('currentStamina');
            if (healthInput) healthInput.value = char.stats.health || 100;
            if (staminaInput) staminaInput.value = char.stats.stamina || 100;
        }
        
        // Final validation and data sync - wait for all operations to complete
        // Use a longer delay to ensure all setTimeout operations have finished
        setTimeout(() => {
            finalizeCharacterData(char, options);
        }, 1000); // Increased delay to ensure all async operations complete
    } catch (error) {
        console.error('Error populating form:', error);
        showNotification('Error populating form. Check console for details.', 'error');
    }
}

// Ensure skills are initialized - called before XML generation
function ensureSkillsInitialized() {
    // Ensure all skill inputs have valid values (at least 0)
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        const levelInput = document.getElementById(`${skill}Level`);
        if (levelInput) {
            const value = levelInput.value;
            if (!value || value === '' || isNaN(parseInt(value))) {
                levelInput.value = 0;
                const levelDisplay = document.getElementById(`${skill}LevelDisplay`);
                if (levelDisplay) levelDisplay.textContent = '0';
            }
        }
    });
    
    // Ensure 5th skill is set
    const fifthSkillRadio = document.querySelector(`input[name="fifthSkillType"]:checked`);
    if (!fifthSkillRadio) {
        const noneRadio = document.querySelector(`input[name="fifthSkillType"][value="none"]`);
        if (noneRadio) {
            noneRadio.checked = true;
            noneRadio.dispatchEvent(new Event('change'));
        }
    }
    
    // Ensure characterData.skills is initialized
    if (!characterData.skills) {
        characterData.skills = {
            cardio: { level: 0, specialty: '' },
            wits: { level: 0, specialty: '' },
            fighting: { level: 0, specialty: '' },
            shooting: { level: 0, specialty: '' },
            fifthSkill: { type: 'none', skill: '' }
        };
    }
    
    // Sync from form to characterData
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        const levelInput = document.getElementById(`${skill}Level`);
        if (levelInput && characterData.skills[skill]) {
            const level = parseInt(levelInput.value) || 0;
            characterData.skills[skill].level = level;
            characterData.skills[skill].specialty = document.getElementById(`${skill}SpecialtySelect`)?.value || '';
        }
    });
    
    const fifthSkillType = document.querySelector('input[name="fifthSkillType"]:checked')?.value || 'none';
    if (characterData.skills.fifthSkill) {
        characterData.skills.fifthSkill.type = fifthSkillType;
        characterData.skills.fifthSkill.skill = document.getElementById('fifthSkill')?.value || '';
    }
    
    console.log('Skills initialized:', characterData.skills);
}

// Ensure humanDefinition is set - called before XML generation
function ensureHumanDefinitionSet() {
    const humanDefSelect = document.getElementById('humanDefinition');
    if (!humanDefSelect) {
        console.error('humanDefinition dropdown not found!');
        return;
    }
    
    // If dropdown has no value or empty value, force set one
    if (!humanDefSelect.value || humanDefSelect.value.trim() === '') {
        console.warn('HumanDefinition is empty, attempting to set a value...');
        
        // Try to use characterData value if it exists and is valid
        if (characterData.humanDefinition) {
            const option = Array.from(humanDefSelect.options).find(
                opt => opt.value === characterData.humanDefinition && opt.value !== ''
            );
            if (option) {
                humanDefSelect.value = characterData.humanDefinition;
                console.log('Set humanDefinition from characterData:', characterData.humanDefinition);
                return;
            }
        }
        
        // If no valid value, select first available option
        if (humanDefSelect.options.length > 1) {
            for (let i = 1; i < humanDefSelect.options.length; i++) {
                const option = humanDefSelect.options[i];
                if (option.value && option.value.trim() !== '') {
                    humanDefSelect.value = option.value;
                    characterData.humanDefinition = option.value;
                    console.log('Force-set humanDefinition to first available:', option.value);
                    // Dispatch change event to ensure everything is updated
                    humanDefSelect.dispatchEvent(new Event('change'));
                    return;
                }
            }
        }
        
        // Last resort: use default based on gender
        const gender = document.getElementById('gender')?.value || characterData.gender || 'Female';
        const defaultModel = gender === 'Male' 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        
        // Try to find default in dropdown
        const defaultOption = Array.from(humanDefSelect.options).find(
            opt => opt.value === defaultModel
        );
        if (defaultOption) {
            humanDefSelect.value = defaultModel;
            characterData.humanDefinition = defaultModel;
            console.log('Set humanDefinition to default:', defaultModel);
            humanDefSelect.dispatchEvent(new Event('change'));
        } else {
            console.error('CRITICAL: Could not set humanDefinition! This will cause issues.');
        }
    } else {
        // Value exists, ensure characterData is synced
        if (characterData.humanDefinition !== humanDefSelect.value) {
            characterData.humanDefinition = humanDefSelect.value;
            console.log('Synced humanDefinition from dropdown:', humanDefSelect.value);
        }
    }
}

// Update character data without triggering validation (used during form population)
function updateCharacterDataWithoutValidation() {
    // Update characterData object from form
    characterData.firstName = document.getElementById('firstName').value;
    characterData.lastName = document.getElementById('lastName').value;
    characterData.nickname = document.getElementById('nickname').value;
    characterData.gender = document.getElementById('gender').value;
    characterData.ageRange = document.getElementById('ageRange').value;
    characterData.pronoun = document.getElementById('pronoun').value;
    characterData.culturalBackground = document.getElementById('culturalBackground').value;
    // Only update voiceID if form has a value, otherwise preserve existing
    const voiceSelect = document.getElementById('voiceID');
    const voiceValue = voiceSelect?.value || '';
    if (voiceValue && voiceValue.trim() !== '') {
        characterData.voiceID = voiceValue;
    } else if (!characterData.voiceID) {
        // Only set to empty if characterData doesn't already have a value
        characterData.voiceID = '';
    }
    characterData.humanDefinition = document.getElementById('humanDefinition').value;
    characterData.philosophy1 = document.getElementById('philosophy1').value;
    characterData.philosophy2 = document.getElementById('philosophy2').value;
    
    // Ensure standingLevel and leaderType are always valid
    const standingSelect = document.getElementById('standingLevel');
    let standingLevel = standingSelect ? standingSelect.value : '';
    if (!standingLevel || standingLevel.trim() === '') {
        standingLevel = 'Citizen';
        if (standingSelect) standingSelect.value = standingLevel;
    }
    // If it's an object, extract the value
    if (typeof standingLevel === 'object' && standingLevel.value) {
        standingLevel = standingLevel.value;
    }
    characterData.standingLevel = standingLevel;
    
    const leaderSelect = document.getElementById('leaderType');
    let leaderType = leaderSelect ? leaderSelect.value : '';
    if (!leaderType || leaderType.trim() === '') {
        leaderType = 'None';
        if (leaderSelect) leaderSelect.value = leaderType;
    }
    // If it's an object, extract the value
    if (typeof leaderType === 'object' && leaderType.value) {
        leaderType = leaderType.value;
    }
    characterData.leaderType = leaderType;
    
    characterData.heroBonus = document.getElementById('heroBonus').value;
    characterData.stats.health = parseInt(document.getElementById('currentHealth').value) || 100;
    characterData.stats.stamina = parseInt(document.getElementById('currentStamina').value) || 100;
    
    // Update skills - ensure skills object exists
    if (!characterData.skills) {
        characterData.skills = {
            cardio: { level: 0, specialty: '' },
            wits: { level: 0, specialty: '' },
            fighting: { level: 0, specialty: '' },
            shooting: { level: 0, specialty: '' },
            fifthSkill: { type: 'none', skill: '' }
        };
    }
    
    ['cardio', 'wits', 'fighting', 'shooting'].forEach(skill => {
        const levelInput = document.getElementById(`${skill}Level`);
        if (levelInput) {
            const level = parseInt(levelInput.value);
            characterData.skills[skill].level = isNaN(level) ? 0 : level;
            characterData.skills[skill].specialty = document.getElementById(`${skill}SpecialtySelect`)?.value || '';
        } else {
            // Input doesn't exist, ensure default
            characterData.skills[skill].level = 0;
            characterData.skills[skill].specialty = '';
        }
    });
    
    // Update 5th skill
    const fifthSkillType = document.querySelector('input[name="fifthSkillType"]:checked')?.value || 'none';
    if (!characterData.skills.fifthSkill) {
        characterData.skills.fifthSkill = { type: 'none', skill: '' };
    }
    characterData.skills.fifthSkill.type = fifthSkillType;
    characterData.skills.fifthSkill.skill = document.getElementById('fifthSkill')?.value || '';
    
    console.log('Skills updated in characterData:', characterData.skills);
    
    updateDescriptorTraits();
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const bgColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions available globally
window.removeTrait = removeTrait;

