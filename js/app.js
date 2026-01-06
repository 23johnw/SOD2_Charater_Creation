// Main Application Logic
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
    traitSearch.addEventListener('input', filterTraits);
    
    const traitMode = document.getElementById('traitMode');
    traitMode.addEventListener('change', () => {
        filterTraits();
        updateCharacterData();
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

function loadAvailableTraits() {
    const availableTraitsList = document.getElementById('availableTraitsList');
    const traitMode = document.getElementById('traitMode').value;
    
    let traits = dataLoader.getTraitsByType(traitMode);
    
    // Filter out required/descriptor traits from optional list
    traits = traits.filter(t => 
        !t.name.includes('Descriptor_') && 
        t.name !== 'Default' && 
        t.category !== 'required'
    );
    
    availableTraitsList.innerHTML = '';
    traits.forEach(trait => {
        const traitDiv = document.createElement('div');
        traitDiv.className = `trait-item ${trait.traitType}`;
        traitDiv.innerHTML = `
            <div class="trait-item-name">${trait.name}</div>
            <div class="trait-item-effects">${trait.description || 'No description'}</div>
        `;
        traitDiv.addEventListener('click', () => addTrait(trait));
        availableTraitsList.appendChild(traitDiv);
    });
}

function filterTraits() {
    const searchTerm = document.getElementById('traitSearch').value.toLowerCase();
    const traitItems = document.querySelectorAll('.trait-item');
    
    traitItems.forEach(item => {
        const name = item.querySelector('.trait-item-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addTrait(trait) {
    const traitLimit = parseInt(document.getElementById('traitLimit').value);
    const currentCount = characterData.traits.required.length + characterData.traits.optional.length;
    
    if (currentCount >= traitLimit) {
        alert(`Maximum trait limit (${traitLimit}) reached. Remove a trait first.`);
        return;
    }
    
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

function updateSelectedTraitsDisplay() {
    const selectedTraitsList = document.getElementById('selectedTraitsList');
    selectedTraitsList.innerHTML = '';
    
    characterData.traits.optional.forEach(trait => {
        const tag = document.createElement('div');
        tag.className = 'trait-tag';
        tag.innerHTML = `
            ${trait.name}
            <span class="remove" onclick="removeTrait('${trait.name}')">×</span>
        `;
        selectedTraitsList.appendChild(tag);
    });
    
    // Update trait counter
    const totalTraits = characterData.traits.required.length + characterData.traits.optional.length;
    const traitLimit = parseInt(document.getElementById('traitLimit').value);
    const counter = document.querySelector('.trait-counter') || document.createElement('div');
    counter.className = 'trait-counter';
    counter.textContent = `Traits: ${totalTraits} / ${traitLimit}`;
    if (totalTraits >= traitLimit) {
        counter.classList.add('error');
    } else if (totalTraits >= traitLimit - 2) {
        counter.classList.add('warning');
    }
    if (!document.querySelector('.trait-counter')) {
        document.getElementById('optionalTraits').insertBefore(counter, document.getElementById('selectedTraitsList'));
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
    const philosophy2Descriptor = `Descriptor_Philosophy_${characterData.philosophy2}`;
    
    document.getElementById('ageDescriptorValue').textContent = characterData.ageRange;
    document.getElementById('pronounDescriptorValue').textContent = characterData.pronoun;
    document.getElementById('philosophy1DescriptorValue').textContent = characterData.philosophy1;
    document.getElementById('philosophy2DescriptorValue').textContent = characterData.philosophy2;
    
    // Update character data required traits
    characterData.traits.required = [
        { name: 'Default', traitResourceID: 'Default' },
        { name: ageDescriptor, traitResourceID: ageDescriptor },
        { name: pronounDescriptor, traitResourceID: pronounDescriptor },
        { name: philosophy1Descriptor, traitResourceID: philosophy1Descriptor },
        { name: philosophy2Descriptor, traitResourceID: philosophy2Descriptor }
    ];
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
            traitLimit: parseInt(document.getElementById('traitLimit')?.value || 12)
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
        traitLimit: parseInt(document.getElementById('traitLimit')?.value || 12)
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
    
        // Attributes
        if (options.culturalBackground !== false) {
            const bgSelect = document.getElementById('culturalBackground');
            if (bgSelect) bgSelect.value = char.culturalBackground || '';
        }
        if (options.voice !== false) {
            const voiceSelect = document.getElementById('voiceID');
            if (voiceSelect) voiceSelect.value = char.voiceID || '';
        }
        if (options.humanDefinition !== false) {
            const modelSelect = document.getElementById('humanDefinition');
            if (modelSelect) modelSelect.value = char.humanDefinition || '';
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
                            if (fifthSkillSelect) fifthSkillSelect.value = char.skills.fifthSkill.skill;
                        }, 100);
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

