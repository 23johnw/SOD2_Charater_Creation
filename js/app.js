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
    humanDefinition: '',
    philosophy1: 'Prudent',
    philosophy2: 'Pragmatic',
    standingLevel: 'Citizen',
    leaderType: 'None',
    heroBonus: '',
    skills: {
        cardio: { level: 0, specialty: '' },
        wits: { level: 0, specialty: '' },
        fighting: { level: 0, specialty: '' },
        shooting: { level: 0, specialty: '' },
        fifthSkill: { type: 'none', skill: '' }
    },
    traits: {
        required: [],
        optional: []
    },
    stats: {
        health: 100,
        stamina: 100
    },
    loadout: {
        preset: 'custom',
        equipment: {}
    }
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
    
    // Initialize loadout UI
    initializeLoadoutUI();
    
    // Update voice and human definition based on gender
    updateVoiceOptions();
    updateHumanDefinitionOptions();
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

function initializeLoadoutUI() {
    const equipmentSlots = document.getElementById('equipmentSlots');
    equipmentSlots.innerHTML = `
        <div class="equipment-slot">
            <label>Backpack</label>
            <select id="equipmentBackpack">
                <option value="">None</option>
            </select>
        </div>
        <div class="equipment-slot">
            <label>Melee Weapon</label>
            <select id="equipmentMelee">
                <option value="">None</option>
            </select>
        </div>
        <div class="equipment-slot">
            <label>Close Combat Weapon</label>
            <select id="equipmentCloseCombat">
                <option value="">None</option>
            </select>
        </div>
        <div class="equipment-slot">
            <label>Ranged Weapon</label>
            <select id="equipmentRanged">
                <option value="">None</option>
            </select>
        </div>
        <div class="equipment-slot">
            <label>Sidearm</label>
            <select id="equipmentSidearm">
                <option value="">None</option>
            </select>
        </div>
    `;
    
    // Populate equipment dropdowns (simplified for now)
    // Equipment will be handled by loadouts.js
}

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
}

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
    characterData.voiceID = document.getElementById('voiceID').value;
    characterData.humanDefinition = document.getElementById('humanDefinition').value;
    characterData.philosophy1 = document.getElementById('philosophy1').value;
    characterData.philosophy2 = document.getElementById('philosophy2').value;
    characterData.standingLevel = document.getElementById('standingLevel').value;
    characterData.leaderType = document.getElementById('leaderType').value;
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
    const xml = generateCharacterXML();
    const previewArea = document.getElementById('previewArea');
    const xmlPreview = document.getElementById('xmlPreview');
    xmlPreview.textContent = xml;
    previewArea.style.display = 'block';
    previewArea.scrollIntoView({ behavior: 'smooth' });
}

function exportCharacter() {
    const xml = generateCharacterXML();
    const firstName = characterData.firstName || 'Character';
    const lastName = characterData.lastName || '';
    const nickname = characterData.nickname || '';
    const filename = `${firstName} ${lastName}${nickname ? ` (${nickname})` : ''}.xml`;
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            setTimeout(() => {
                updateVoiceOptions();
                updateHumanDefinitionOptions();
            }, 100);
        }
    
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
        if (options.humanDefinition !== false) {
            setTimeout(() => {
                const modelSelect = document.getElementById('humanDefinition');
                if (modelSelect && char.humanDefinition) {
                    // Try to find matching option
                    const options = Array.from(modelSelect.options);
                    const matchingOption = options.find(opt => 
                        opt.value === char.humanDefinition ||
                        opt.value.includes(char.humanDefinition.split('_')[0]) ||
                        opt.textContent.includes(char.humanDefinition.split('_')[0])
                    );
                    if (matchingOption) {
                        modelSelect.value = matchingOption.value;
                    } else if (char.humanDefinition) {
                        modelSelect.value = char.humanDefinition;
                    }
                    modelSelect.dispatchEvent(new Event('change'));
                }
            }, 200);
        }
        
        // Philosophies
        const philo1Select = document.getElementById('philosophy1');
        const philo2Select = document.getElementById('philosophy2');
        if (philo1Select) philo1Select.value = char.philosophy1 || 'Prudent';
        if (philo2Select) philo2Select.value = char.philosophy2 || 'Pragmatic';
        
        // Standing and leader
        if (options.standingLevel !== false) {
            const standingSelect = document.getElementById('standingLevel');
            if (standingSelect) standingSelect.value = char.standingLevel || 'Citizen';
        }
        if (options.leaderType !== false) {
            const leaderSelect = document.getElementById('leaderType');
            if (leaderSelect) leaderSelect.value = char.leaderType || 'None';
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
        
        // Update all character data (but skip validation during form population to avoid DOM errors)
        // We'll manually update characterData without triggering validation
        updateCharacterDataWithoutValidation();
    } catch (error) {
        console.error('Error populating form:', error);
        showNotification('Error populating form. Check console for details.', 'error');
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
    characterData.voiceID = document.getElementById('voiceID').value;
    characterData.humanDefinition = document.getElementById('humanDefinition').value;
    characterData.philosophy1 = document.getElementById('philosophy1').value;
    characterData.philosophy2 = document.getElementById('philosophy2').value;
    characterData.standingLevel = document.getElementById('standingLevel').value;
    characterData.leaderType = document.getElementById('leaderType').value;
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

