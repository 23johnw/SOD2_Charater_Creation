// XML Generation Logic
function generateCharacterXML() {
    // Generate unique ID
    const characterID = Math.floor(Math.random() * 10000) + 1000;
    
    // Build XML structure
    let xml = `<?xml version="1.0"?>
<SurvivorExport xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SurvivorData xsi:type="StructProperty">
    <Index>0</Index>
    <PropertyName>SurvivorSaves</PropertyName>
    <PropertyType>SurvivorSave</PropertyType>
    <SubStruct>SurvivorSave</SubStruct>
    <TheStats>`;
    
    // Basic properties - must match exact order and indices from reference
    xml += generateIntProperty(0, 'ID', characterID);
    xml += generateStructProperty(1, 'NarrativeEntityId', 'NarrativeEntityId', '');
    xml += generateTextProperty(2, 'FirstName', '');
    xml += generateTextProperty(3, 'LastName', '');
    xml += generateTextProperty(4, 'NickName', '');
    xml += generateNameProperty(5, 'VoiceID', `${characterData.voiceID || 'Kee'}_Low`);
    xml += generateNameProperty(6, 'CulturalBackgroundName', characterData.culturalBackground || 'AfricanAmerican');
    xml += generateArrayProperty(7, 'FamilyRelationships', 'StructProperty', '');
    // HumanDefinition is required - read directly from form to ensure we have the latest value
    // Also check characterData as fallback, then use default based on gender
    const humanDefSelect = document.getElementById('humanDefinition');
    let humanDefValue = '';
    
    // First, try to get value from form dropdown (most reliable source)
    if (humanDefSelect) {
        humanDefValue = humanDefSelect.value || '';
        
        // Validate the value exists in the dropdown options
        if (humanDefValue) {
            const optionExists = Array.from(humanDefSelect.options).some(
                opt => opt.value === humanDefValue && opt.value !== ''
            );
            if (!optionExists) {
                console.warn('HumanDefinition value not found in dropdown options:', humanDefValue);
                humanDefValue = ''; // Reset to force fallback
            }
        }
        
        // If dropdown value is empty but has options, try to select the first valid option
        if (!humanDefValue && humanDefSelect.options.length > 1) {
            // Skip the first option (usually "Select model...")
            for (let i = 1; i < humanDefSelect.options.length; i++) {
                const option = humanDefSelect.options[i];
                if (option.value && option.value.trim() !== '') {
                    humanDefValue = option.value;
                    humanDefSelect.value = humanDefValue;
                    // Update characterData to keep in sync
                    characterData.humanDefinition = humanDefValue;
                    console.log('Auto-selected first available HumanDefinition:', humanDefValue);
                    break;
                }
            }
        }
    }
    
    // Fallback to characterData
    if (!humanDefValue && characterData.humanDefinition) {
        humanDefValue = characterData.humanDefinition;
        console.log('Using HumanDefinition from characterData:', humanDefValue);
        // Try to set it in dropdown if it exists
        if (humanDefSelect) {
            const option = Array.from(humanDefSelect.options).find(
                opt => opt.value === humanDefValue
            );
            if (option) {
                humanDefSelect.value = humanDefValue;
            }
        }
    }
    
    // If still empty, use default based on gender
    if (!humanDefValue || humanDefValue.trim() === '') {
        const isMale = characterData.gender === 'Male';
        humanDefValue = isMale 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        console.warn('HumanDefinition not found, using default based on gender:', humanDefValue);
        
        // Try to set it in the dropdown if it exists
        if (humanDefSelect) {
            const defaultOption = Array.from(humanDefSelect.options).find(
                opt => opt.value === humanDefValue
            );
            if (defaultOption) {
                humanDefSelect.value = humanDefValue;
                characterData.humanDefinition = humanDefValue;
            } else {
                // If default not found, use first available option
                if (humanDefSelect.options.length > 1) {
                    for (let i = 1; i < humanDefSelect.options.length; i++) {
                        const option = humanDefSelect.options[i];
                        if (option.value && option.value.trim() !== '') {
                            humanDefValue = option.value;
                            humanDefSelect.value = humanDefValue;
                            characterData.humanDefinition = humanDefValue;
                            console.log('Using first available option as fallback:', humanDefValue);
                            break;
                        }
                    }
                }
            }
        }
    } else {
        console.log('HumanDefinition value being used:', humanDefValue);
        // Ensure characterData is synced
        if (characterData.humanDefinition !== humanDefValue) {
            characterData.humanDefinition = humanDefValue;
        }
    }
    
    // Final validation - ensure we have a valid non-empty value
    if (!humanDefValue || humanDefValue.trim() === '') {
        console.error('CRITICAL: HumanDefinition is empty! This will cause game crashes.');
        const isMale = characterData.gender === 'Male';
        humanDefValue = isMale 
            ? 'HumanMaleVest_01_v_01' 
            : 'HumanFemaleVest_01_v_01';
        characterData.humanDefinition = humanDefValue;
    }
    
    console.log('Final HumanDefinition for XML:', humanDefValue);
    console.log('HumanDefinition validation:', {
        value: humanDefValue,
        length: humanDefValue.length,
        inDropdown: humanDefSelect ? Array.from(humanDefSelect.options).some(opt => opt.value === humanDefValue) : 'N/A',
        inCharacterData: characterData.humanDefinition === humanDefValue,
        gender: characterData.gender
    });
    xml += generateNameProperty(8, 'HumanDefinition', humanDefValue);
    xml += generateStructProperty(9, 'outfit', 'DaytonCharacterOutfit', '');
    
    // Boolean properties
    xml += generateBoolProperty(10, 'bIsDead', false);
    xml += generateBoolProperty(11, 'bIsDeparted', false);
    xml += generateBoolProperty(12, 'bIsTaggedForDimiss', false);
    xml += generateBoolProperty(13, 'bIsTaggedForDemotion', false);
    xml += generateBoolProperty(14, 'bIsTaggedForSendingToLegacyPool', false);
    xml += generateBoolProperty(15, 'IsMale', characterData.gender === 'Male');
    xml += generateBoolProperty(16, 'IsHomosexual', false);
    xml += generateBoolProperty(17, 'HasBisexualVO', false);
    
    // Byte properties for enums
    xml += generateByteProperty(18, 'AgeRange', `ECharacterAge::${characterData.ageRange || 'MiddleAged'}`, 'ECharacterAge');
    xml += generateByteProperty(19, 'Pronoun', `EPronoun::${characterData.pronoun || 'She'}`, 'EPronoun');
    xml += generateByteProperty(20, 'Philosophy1', `ECharacterPhilosophy::${characterData.philosophy1 || 'Prudent'}`, 'ECharacterPhilosophy');
    xml += generateByteProperty(21, 'Philosophy2', `ECharacterPhilosophy::${characterData.philosophy2 || 'Pragmatic'}`, 'ECharacterPhilosophy');
    // Validate and normalize standingLevel
    let standingLevel = characterData.standingLevel || 'Citizen';
    // If it's an object, extract the value
    if (typeof standingLevel === 'object' && standingLevel.value) {
        standingLevel = standingLevel.value;
    }
    // Ensure it's a valid value
    const validStandingLevels = ['Stranger', 'Recruit', 'Citizen', 'Hero', 'Leader'];
    if (!validStandingLevels.includes(standingLevel)) {
        console.warn('Invalid standingLevel:', standingLevel, 'defaulting to Citizen');
        standingLevel = 'Citizen';
    }
    xml += generateByteProperty(22, 'StandingLevel', `ECharacterStanding::${standingLevel}`, 'ECharacterStanding');
    
    // Hero bonus and leader type
    if (characterData.heroBonus) {
        xml += generateNameProperty(23, 'HeroBonusID', characterData.heroBonus);
    }
    
    // Validate and normalize leaderType
    let leaderType = characterData.leaderType || 'None';
    // If it's an object, extract the value
    if (typeof leaderType === 'object' && leaderType.value) {
        leaderType = leaderType.value;
    }
    // Ensure it's a valid value
    const validLeaderTypes = ['None', 'Builder', 'Warlord', 'Sheriff', 'Trader'];
    if (!validLeaderTypes.includes(leaderType)) {
        console.warn('Invalid leaderType:', leaderType, 'defaulting to None');
        leaderType = 'None';
    }
    xml += generateNameProperty(24, 'LeaderTypeID', leaderType);
    
    // Stats
    xml += generateFloatProperty(25, 'ProgressToNextStandingLevel', 0);
    xml += generateFloatProperty(26, 'CurrentHealth', characterData.stats?.health || 100);
    xml += generateFloatProperty(27, 'CurrentStamina', characterData.stats?.stamina || 100);
    xml += generateFloatProperty(28, 'FatigueCounter', 0);
    xml += generateFloatProperty(29, 'PainkillerAddictionCounter', 0);
    xml += generateFloatProperty(30, 'SicknessCounter', 0);
    xml += generateFloatProperty(31, 'PlagueTimer', 0);
    xml += generateFloatProperty(32, 'PlagueRate', 1);
    xml += generateFloatProperty(33, 'StimulantAddictionCounter', 0);
    xml += generateFloatProperty(34, 'TraumaCounter', 0);
    xml += generateFloatProperty(35, 'InjuryRecoveryCounter', 0);
    xml += generateIntProperty(36, 'ZombiesKilled', 0);
    xml += generateNameProperty(37, 'AssignedMemory', 'None');
    
    // Skills array
    xml += generateSkillsArray(38, characterData.skills);
    
    // Traits array
    xml += generateTraitsArray(39, characterData.traits);
    
    // Equipment (empty - using Inventory Items section instead)
    xml += generateEquipmentStruct(40, {});
    
    // Active weapon slot
    xml += generateByteProperty(41, 'ActiveRangedWeaponSlot', 'EEquipmentSlot::Ranged', 'EEquipmentSlot');
    
    // Inventory
    xml += generateStructProperty(42, 'Inventory', 'InventorySave', '');
    
    // Additional properties
    xml += generateBoolProperty(43, 'bHasStandingUpgradeToDisplay', false);
    xml += generateStructProperty(44, 'TimedBuffSaves', 'TimedCharacterBuffSaveCollection', '');
    xml += generateIntProperty(45, 'NumLegaciesParticipatedIn', 0);
    xml += generateIntProperty(46, 'NumCommunitiesLedToLegacy', 0);
    xml += generateTextProperty(47, 'LastLegacyEnclaveName', '');
    xml += generateIntProperty(48, 'LastLegacySequenceId', 0);
    xml += generateBoolProperty(49, 'bIsFavoriteLegacySurvivor', false);
    xml += generateIntProperty(50, 'OriginEnclaveID', -1);
    xml += generateByteProperty(51, 'OriginEnclaveStandingLevel', 'ECharacterStanding::Stranger', 'ECharacterStanding');
    xml += generateFloatProperty(52, 'OriginEnclaveStandingProgress', 0);
    xml += generateBoolProperty(53, 'bIsRecruitable', true);
    xml += generateByteProperty(54, 'MortalityFlags', '0', 'None');
    xml += generateDoubleProperty(55, 'TimeInEnclave', 0);
    xml += generateBoolProperty(56, 'bHasAnnouncedNewRecruit', true);
    xml += generateNameProperty(57, 'ArchetypeID', 'None');
    
    xml += `    </TheStats>
    <TheSubs>`;
    
    // NarrativeEntityId subsection
    xml += generateNarrativeEntityIdSubsection(1);
    
    // TextProperty subsections for names (complex structure)
    // Read nickname directly from form to ensure we have the latest value
    const nicknameValue = document.getElementById('nickname')?.value || characterData.nickname || '';
    console.log('XML Generation - nickname value:', nicknameValue);
    
    xml += generateTextPropertySubsection(2, 'FirstName', characterData.firstName || '');
    xml += generateTextPropertySubsection(3, 'LastName', characterData.lastName || '');
    xml += generateTextPropertySubsection(4, 'NickName', nicknameValue);
    
    // FamilyRelationships array
    xml += generateFamilyRelationshipsSubsection(7);
    
    // Outfit subsection
    xml += generateOutfitSubsection(9);
    
    // Skills subsection
    xml += generateSkillsSubsection(characterData.skills);
    
    // Traits subsection
    xml += generateTraitsSubsection(characterData.traits);
    
    // Equipment subsection
    xml += generateEquipmentSubsection({});
    
    // Inventory subsection
    xml += generateInventorySubsection(42);
    
    // TimedBuffSaves subsection
    xml += generateTimedBuffSavesSubsection(44);
    
    // LastLegacyEnclaveName TextProperty
    xml += generateTextPropertySubsection(47, 'LastLegacyEnclaveName', '');
    
    xml += `    </TheSubs>
    <Terminated>true</Terminated>
  </SurvivorData>`;
    
    // Equipment section (separate from SurvivorData)
    xml += generateEquipmentSection({});
    
    // Slots section (inventory items)
    xml += generateSlotsSection();
    
    xml += `\n</SurvivorExport>`;
    
    return xml;
}

function generateIntProperty(index, name, value) {
    return `
      <SaveObject xsi:type="IntProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>IntProperty</PropertyType>
        <Value>${value}</Value>
        <TheType>0</TheType>
      </SaveObject>`;
}

function generateTextProperty(index, name, value) {
    return `
      <SaveObject>
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>TextProperty</PropertyType>
        <Value />
      </SaveObject>`;
}

function generateNameProperty(index, name, value) {
    return `
      <SaveObject xsi:type="NameProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>NameProperty</PropertyType>
        <Value>${escapeXML(value)}</Value>
        <TheType>0</TheType>
      </SaveObject>`;
}

function generateBoolProperty(index, name, value) {
    return `
      <SaveObject xsi:type="BoolProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>BoolProperty</PropertyType>
        <Value>${value ? 1 : 0}</Value>
        <TheType>0</TheType>
      </SaveObject>`;
}

function generateFloatProperty(index, name, value) {
    return `
      <SaveObject xsi:type="FloatProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>FloatProperty</PropertyType>
        <Value>${value}</Value>
        <TheType>0</TheType>
      </SaveObject>`;
}

function generateDoubleProperty(index, name, value) {
    return `
      <SaveObject xsi:type="DoubleProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>DoubleProperty</PropertyType>
        <Value>${value}</Value>
        <TheType>0</TheType>
      </SaveObject>`;
}

function generateArrayProperty(index, name, type, value) {
    return `
      <SaveObject>
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>ArrayProperty</PropertyType>
        <Value />
        <TheType>${type}</TheType>
      </SaveObject>`;
}

function generateStructProperty(index, name, type, value) {
    return `
      <SaveObject>
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>StructProperty</PropertyType>
        <Value />
        <TheType>${type}</TheType>
      </SaveObject>`;
}

function generateByteProperty(index, name, value, enumType) {
    return `
      <SaveObject xsi:type="ByteProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <PropertyType>ByteProperty</PropertyType>
        <Value>${escapeXML(value)}</Value>
        <TheType>0</TheType>
        <Value2>${escapeXML(enumType)}</Value2>
      </SaveObject>`;
}

// Subsection generators
function generateNarrativeEntityIdSubsection(index) {
    return `
      <StructObject xsi:type="StructProperty">
        <Index>${index}</Index>
        <PropertyName>NarrativeEntityId</PropertyName>
        <PropertyType>NarrativeEntityId</PropertyType>
        <SubStruct>NarrativeEntityId</SubStruct>
        <TheStats>
          <SaveObject xsi:type="NameProperty">
            <Index>0</Index>
            <PropertyName>NarrativeId</PropertyName>
            <PropertyType>NameProperty</PropertyType>
            <Value>None</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="NameProperty">
            <Index>1</Index>
            <PropertyName>EntityId</PropertyName>
            <PropertyType>NameProperty</PropertyType>
            <Value>None</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
        <Terminated>true</Terminated>
      </StructObject>`;
}

function generateTextPropertySubsection(index, name, value) {
    // Generate TextProperty subsection with correct ID format based on character data
    const culturalBg = characterData.culturalBackground || 'AngloAmerican';
    const isMale = characterData.gender === 'Male'; // Use gender field from characterData
    const ageRange = characterData.ageRange || 'MiddleAged';
    
    // Map age range to ID format
    const ageMap = {
        'Young': 'Young',
        'MiddleAged': 'Middle',
        'Old': 'Old'
    };
    const ageSuffix = ageMap[ageRange] || 'Middle';
    
    // Map gender to ID format
    const genderSuffix = isMale ? 'Male' : 'Female';
    
    // Generate ID based on name type
    let nameListID;
    if (name === 'FirstName') {
        // FirstName format: DNL.NameList.Default__{CulturalBg}_Common_{Gender}{Age}_C.Names.0.Name
        nameListID = `DNL.NameList.Default__${culturalBg}_Common_${genderSuffix}${ageSuffix}_C.Names.0.Name`;
    } else if (name === 'LastName') {
        // LastName format: DNL.NameList.Default__{CulturalBg}_Surnames_C.Names.0.Name
        nameListID = `DNL.NameList.Default__${culturalBg}_Surnames_C.Names.0.Name`;
    } else if (name === 'NickName') {
        // NickName uses same format as FirstName
        nameListID = `DNL.NameList.Default__${culturalBg}_Common_${genderSuffix}${ageSuffix}_C.Names.0.Name`;
    } else {
        // Fallback for other text properties
        nameListID = `DNL.NameList.Default__${culturalBg}_Common_${genderSuffix}${ageSuffix}_C.Names.0.Name`;
    }
    
    // For empty names, use empty TheStats (like the game does)
    if (!value || value.trim() === '') {
        return `
      <StructObject xsi:type="TextProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <SubStruct>0</SubStruct>
        <TheStats />
        <TheSubs />
      </StructObject>`;
    }
    
    // For all names with values (FirstName, LastName, NickName), generate full structure
    // Custom names require ID, Type, and the name value to display correctly in-game
    return `
      <StructObject xsi:type="TextProperty">
        <Index>${index}</Index>
        <PropertyName>${name}</PropertyName>
        <SubStruct>0</SubStruct>
        <TheStats>
          <SaveObject xsi:type="StringProperty">
            <Index>0</Index>
            <PropertyName>ID</PropertyName>
            <PropertyType>StringProperty</PropertyType>
            <Value>${escapeXML(nameListID)}</Value>
          </SaveObject>
          <SaveObject xsi:type="StringProperty">
            <Index>1</Index>
            <PropertyName>Type</PropertyName>
            <PropertyType>StringProperty</PropertyType>
            <Value>Name</Value>
          </SaveObject>
          <SaveObject xsi:type="StringProperty">
            <Index>2</Index>
            <PropertyName>${name}</PropertyName>
            <PropertyType>StringProperty</PropertyType>
            <Value>${escapeXML(value)}</Value>
          </SaveObject>
        </TheStats>
        <TheSubs />
      </StructObject>`;
}

function generateFamilyRelationshipsSubsection(index) {
    return `
      <StructObject xsi:type="ArrayProperty">
        <Index>${index}</Index>
        <PropertyName>FamilyRelationships</PropertyName>
        <PropertyType>FullRelationship</PropertyType>
        <SubStruct>StructProperty</SubStruct>
        <TheStats />
        <TheSubs />
      </StructObject>`;
}

function generateOutfitSubsection(index) {
    return `
      <StructObject xsi:type="StructProperty">
        <Index>${index}</Index>
        <PropertyName>outfit</PropertyName>
        <PropertyType>DaytonCharacterOutfit</PropertyType>
        <SubStruct>DaytonCharacterOutfit</SubStruct>
        <TheStats>
          <SaveObject xsi:type="BoolProperty">
            <Index>0</Index>
            <PropertyName>bRemoveDefaultHat</PropertyName>
            <PropertyType>BoolProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="NameProperty">
            <Index>1</Index>
            <PropertyName>HatOutfitItemID</PropertyName>
            <PropertyType>NameProperty</PropertyType>
            <Value>None</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="NameProperty">
            <Index>2</Index>
            <PropertyName>BodyOutfitItemID</PropertyName>
            <PropertyType>NameProperty</PropertyType>
            <Value>None</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
        <Terminated>true</Terminated>
      </StructObject>`;
}

function generateSkillsArray(index, skills) {
    return generateArrayProperty(index, 'Skills', 'StructProperty', '');
}

function generateSkillsSubsection(skills) {
    const skillList = [];
    
    // Ensure skills object exists
    if (!skills) {
        console.warn('Skills object is missing in generateSkillsSubsection, using defaults');
        skills = {
            cardio: { level: 0, specialty: '' },
            wits: { level: 0, specialty: '' },
            fighting: { level: 0, specialty: '' },
            shooting: { level: 0, specialty: '' },
            fifthSkill: { type: 'none', skill: '' }
        };
    }
    
    // Core 4 skills
    const coreSkills = [
        { name: 'Cardio', key: 'cardio' },
        { name: 'Wits', key: 'wits' },
        { name: 'Fighting', key: 'fighting' },
        { name: 'Shooting', key: 'shooting' }
    ];
    
    coreSkills.forEach((skill) => {
        const skillData = skills[skill.key];
        // Include skills even if level is 0 - the game may need the structure
        // Only skip if skillData doesn't exist at all
        if (skillData && typeof skillData.level === 'number') {
            skillList.push({
                name: skill.name,
                level: skillData.level || 0,
                specialty: skillData.specialty || '',
                grantingTrait: 'Default'
            });
        } else {
            // Skill data missing, add with default level 0
            console.warn(`Skill data missing for ${skill.key}, adding with level 0`);
            skillList.push({
                name: skill.name,
                level: 0,
                specialty: '',
                grantingTrait: 'Default'
            });
        }
    });
    
    console.log('Generating skills XML with', skillList.length, 'skills:', skillList.map(s => `${s.name}:${s.level}`).join(', '));
    
    // 5th skill
    if (skills.fifthSkill && skills.fifthSkill.type !== 'none' && skills.fifthSkill.skill) {
        skillList.push({
            name: skills.fifthSkill.skill,
            level: 1,
            specialty: '',
            grantingTrait: 'Default'
        });
    }
    
    let xml = `
      <StructObject xsi:type="ArrayProperty">
        <Index>38</Index>
        <PropertyName>Skills</PropertyName>
        <PropertyType>SurvivorSkillSave</PropertyType>
        <SubStruct>StructProperty</SubStruct>
        <TheStats>`;
    
    skillList.forEach((skill, idx) => {
        xml += `
          <SaveObject>
            <Index>${idx}</Index>
            <PropertyName>Skills</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>SurvivorSkillSave</TheType>
          </SaveObject>`;
    });
    
    xml += `
        </TheStats>
        <TheSubs>`;
    
    skillList.forEach((skill, idx) => {
        xml += `
          <StructObject xsi:type="StructProperty">
            <Index>${idx}</Index>
            <PropertyName>Skills</PropertyName>
            <PropertyType>SurvivorSkillSave</PropertyType>
            <SubStruct>SurvivorSkillSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="NameProperty">
                <Index>0</Index>
                <PropertyName>SkillResourceID</PropertyName>
                <PropertyType>NameProperty</PropertyType>
                <Value>${escapeXML(skill.name)}</Value>
                <TheType>0</TheType>
              </SaveObject>
              <SaveObject xsi:type="IntProperty">
                <Index>1</Index>
                <PropertyName>CurrentLevel</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${skill.level}</Value>
                <TheType>0</TheType>
              </SaveObject>
              <SaveObject xsi:type="FloatProperty">
                <Index>2</Index>
                <PropertyName>CurrentXP</PropertyName>
                <PropertyType>FloatProperty</PropertyType>
                <Value>0</Value>
                <TheType>0</TheType>
              </SaveObject>
              <SaveObject xsi:type="NameProperty">
                <Index>3</Index>
                <PropertyName>GrantingTraitID</PropertyName>
                <PropertyType>NameProperty</PropertyType>
                <Value>${escapeXML(skill.grantingTrait)}</Value>
                <TheType>0</TheType>
              </SaveObject>`;
        
        if (skill.specialty) {
            xml += `
              <SaveObject xsi:type="NameProperty">
                <Index>4</Index>
                <PropertyName>SpecializationResourceID</PropertyName>
                <PropertyType>NameProperty</PropertyType>
                <Value>${escapeXML(skill.specialty)}</Value>
                <TheType>0</TheType>
              </SaveObject>`;
        }
        
        xml += `
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>`;
    });
    
    xml += `
        </TheSubs>
      </StructObject>`;
    
    return xml;
}

function generateTraitsArray(index, traits) {
    return generateArrayProperty(index, 'Traits', 'StructProperty', '');
}

function generateTraitsSubsection(traits) {
    // Rebuild required traits to ensure they're correct
    // Get current values directly from characterData (don't call updateCharacterData to avoid DOM manipulation during XML generation)
    const ageRange = characterData.ageRange || document.getElementById('ageRange')?.value || 'MiddleAged';
    const pronoun = characterData.pronoun || document.getElementById('pronoun')?.value || 'She';
    const philosophy1 = characterData.philosophy1 || document.getElementById('philosophy1')?.value || 'Prudent';
    const philosophy2 = characterData.philosophy2 || document.getElementById('philosophy2')?.value || 'Pragmatic';
    
    const ageDescriptorName = ageRange === 'MiddleAged' ? 'MiddleAge' : ageRange;
    const requiredTraits = [
        { name: 'Default', traitResourceID: 'Default' },
        { name: `Descriptor_Age_${ageDescriptorName}`, traitResourceID: `Descriptor_Age_${ageDescriptorName}` },
        { name: `Descriptor_Pronoun_${pronoun}`, traitResourceID: `Descriptor_Pronoun_${pronoun}` },
        { name: `Descriptor_Philosophy_${philosophy1}`, traitResourceID: `Descriptor_Philosophy_${philosophy1}` },
        { name: `Descriptor_Philosophy_${philosophy2}`, traitResourceID: `Descriptor_Philosophy_${philosophy2}` }
    ];
    
    const allTraits = [...requiredTraits, ...(traits.optional || [])];
    
    // Filter out invalid traits before generating XML
    const validTraits = allTraits.filter(trait => {
        const traitID = trait.traitResourceID || trait.name || '';
        return traitID && 
               !traitID.includes('▶') && 
               !traitID.includes('much worse') &&
               traitID.trim().length >= 2 &&
               traitID !== 'Descriptor_Philosophy_' &&
               !(traitID.startsWith('Descriptor_') && traitID.split('_').length < 3);
    });
    
    let xml = `
      <StructObject xsi:type="ArrayProperty">
        <Index>39</Index>
        <PropertyName>Traits</PropertyName>
        <PropertyType>SurvivorTraitSave</PropertyType>
        <SubStruct>StructProperty</SubStruct>
        <TheStats>`;
    
    validTraits.forEach((trait, idx) => {
        xml += `
          <SaveObject>
            <Index>${idx}</Index>
            <PropertyName>Traits</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>SurvivorTraitSave</TheType>
          </SaveObject>`;
    });
    
    xml += `
        </TheStats>
        <TheSubs>`;
    
    validTraits.forEach((trait, idx) => {
        // Always use traitResourceID - check mapping if not set or if it looks like a display name
        let traitID = trait.traitResourceID || trait.name || 'Default';
        
        // If traitID looks like a display name (has spaces, special chars, or doesn't match ID pattern),
        // try to look it up in the mapping
        if (traitID && traitID !== 'Default' && 
            (traitID.includes(' ') || traitID.includes('-') || 
             (!traitID.includes('_') && !traitID.startsWith('Descriptor_')))) {
            // Check if we have a mapping for this trait name
            if (dataLoader && dataLoader.data && dataLoader.data.traitIdMapping) {
                if (dataLoader.data.traitIdMapping[traitID]) {
                    traitID = dataLoader.data.traitIdMapping[traitID];
                } else if (trait.name && dataLoader.data.traitIdMapping[trait.name]) {
                    // Try using the trait's name property
                    traitID = dataLoader.data.traitIdMapping[trait.name];
                } else {
                    // Log warning for unmapped traits
                    console.warn(`Trait "${traitID}" not found in mapping, using as-is`);
                }
            }
        }
        
        xml += `
          <StructObject xsi:type="StructProperty">
            <Index>${idx}</Index>
            <PropertyName>Traits</PropertyName>
            <PropertyType>SurvivorTraitSave</PropertyType>
            <SubStruct>SurvivorTraitSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="NameProperty">
                <Index>0</Index>
                <PropertyName>TraitResourceID</PropertyName>
                <PropertyType>NameProperty</PropertyType>
                <Value>${escapeXML(traitID)}</Value>
                <TheType>0</TheType>
              </SaveObject>
              <SaveObject>
                <Index>1</Index>
                <PropertyName>CharacterBuffRecords</PropertyName>
                <PropertyType>ArrayProperty</PropertyType>
                <Value />
                <TheType>StructProperty</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs>
              <StructObject xsi:type="ArrayProperty">
                <Index>1</Index>
                <PropertyName>CharacterBuffRecords</PropertyName>
                <PropertyType>TraitCharacterBuffSave</PropertyType>
                <SubStruct>StructProperty</SubStruct>
                <TheStats />
                <TheSubs />
              </StructObject>
            </TheSubs>
            <Terminated>true</Terminated>
          </StructObject>`;
    });
    
    xml += `
        </TheSubs>
      </StructObject>`;
    
    return xml;
}

function generateEquipmentStruct(index, unused) {
    return generateStructProperty(index, 'Equipment', 'EquipmentSave', '');
}

function generateEquipmentSubsection(unused) {
    // Equipment is now empty - using Inventory Items section instead
    const backpack = '';
    const melee = '';
    const closeCombat = '';
    const ranged = '';
    const sidearm = '';
    const rucksack = '';
    
    // Determine Index values: Equipment section items are at positions 0-5
    // Index should be the position in Equipment section if item exists, -1 if empty
    const getIndex = (item) => {
        if (!item || item === '' || item === 'None') return -1;
        // Equipment section order: Backpack(0), Melee(1), CloseCombat(2), Ranged(3), Sidearm(4), Rucksack(5)
        return item === backpack && backpack ? 0 :
               item === melee && melee ? 1 :
               item === closeCombat && closeCombat ? 2 :
               item === ranged && ranged ? 3 :
               item === sidearm && sidearm ? 4 :
               item === rucksack && rucksack ? 5 : -1;
    };
    
    // But actually, each slot has a fixed position in Equipment section
    const backpackIndex = backpack && backpack !== 'None' ? 0 : -1;
    const meleeIndex = melee && melee !== 'None' ? 1 : -1;
    const closeCombatIndex = closeCombat && closeCombat !== 'None' ? 2 : -1;
    const rangedIndex = ranged && ranged !== 'None' ? 3 : -1;
    const sidearmIndex = sidearm && sidearm !== 'None' ? 4 : -1;
    const rucksackIndex = rucksack && rucksack !== 'None' ? 5 : -1;
    
    return `
      <StructObject xsi:type="StructProperty">
        <Index>40</Index>
        <PropertyName>Equipment</PropertyName>
        <PropertyType>EquipmentSave</PropertyType>
        <SubStruct>EquipmentSave</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>BackpackItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
          <SaveObject>
            <Index>1</Index>
            <PropertyName>MeleeItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
          <SaveObject>
            <Index>2</Index>
            <PropertyName>CloseCombatItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
          <SaveObject>
            <Index>3</Index>
            <PropertyName>RangedItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
          <SaveObject>
            <Index>4</Index>
            <PropertyName>SidearmItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
          <SaveObject>
            <Index>5</Index>
            <PropertyName>RucksackItem</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceSave</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs>
          <StructObject xsi:type="StructProperty">
            <Index>0</Index>
            <PropertyName>BackpackItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${backpackIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
          <StructObject xsi:type="StructProperty">
            <Index>1</Index>
            <PropertyName>MeleeItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${meleeIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
          <StructObject xsi:type="StructProperty">
            <Index>2</Index>
            <PropertyName>CloseCombatItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${closeCombatIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
          <StructObject xsi:type="StructProperty">
            <Index>3</Index>
            <PropertyName>RangedItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${rangedIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
          <StructObject xsi:type="StructProperty">
            <Index>4</Index>
            <PropertyName>SidearmItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${sidearmIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
          <StructObject xsi:type="StructProperty">
            <Index>5</Index>
            <PropertyName>RucksackItem</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>ItemInstanceSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>Index</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${rucksackIndex}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
        </TheSubs>
        <Terminated>true</Terminated>
      </StructObject>`;
}

function generateInventorySubsection(index) {
    const inventory = characterData.inventory || [];
    const maxSlots = 30; // Match the maxSlots in generateSlotsSection
    const numSlots = maxSlots; // Always generate maxSlots to match the Slots section
    
    // Generate SaveObjects for TheStats (one per slot)
    let statsXML = '';
    for (let i = 0; i < numSlots; i++) {
        statsXML += `
              <SaveObject>
                <Index>${i}</Index>
                <PropertyName>Slots</PropertyName>
                <PropertyType>StructProperty</PropertyType>
                <Value />
                <TheType>ItemInstanceSave</TheType>
              </SaveObject>`;
    }
    
    // Generate StructObjects for TheSubs (one per slot)
    let subsXML = '';
    for (let i = 0; i < numSlots; i++) {
        const isFilled = i < inventory.length;
        subsXML += `
              <StructObject xsi:type="StructProperty">
                <Index>${i}</Index>
                <PropertyName>Slots</PropertyName>
                <PropertyType>ItemInstanceSave</PropertyType>
                <SubStruct>ItemInstanceSave</SubStruct>
                <TheStats>
                  <SaveObject xsi:type="IntProperty">
                    <Index>0</Index>
                    <PropertyName>Index</PropertyName>
                    <PropertyType>IntProperty</PropertyType>
                    <Value>${isFilled ? i : -1}</Value>
                    <TheType>0</TheType>
                  </SaveObject>
                </TheStats>
                <TheSubs />
                <Terminated>true</Terminated>
              </StructObject>`;
    }
    
    return `
      <StructObject xsi:type="StructProperty">
        <Index>${index}</Index>
        <PropertyName>Inventory</PropertyName>
        <PropertyType>InventorySave</PropertyType>
        <SubStruct>InventorySave</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>Slots</PropertyName>
            <PropertyType>ArrayProperty</PropertyType>
            <Value />
            <TheType>StructProperty</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs>
          <StructObject xsi:type="ArrayProperty">
            <Index>0</Index>
            <PropertyName>Slots</PropertyName>
            <PropertyType>ItemInstanceSave</PropertyType>
            <SubStruct>StructProperty</SubStruct>
            <TheStats>${statsXML}
            </TheStats>
            <TheSubs>${subsXML}
            </TheSubs>
          </StructObject>
        </TheSubs>
        <Terminated>true</Terminated>
      </StructObject>`;
}

function generateTimedBuffSavesSubsection(index) {
    return `
      <StructObject xsi:type="StructProperty">
        <Index>${index}</Index>
        <PropertyName>TimedBuffSaves</PropertyName>
        <PropertyType>TimedCharacterBuffSaveCollection</PropertyType>
        <SubStruct>TimedCharacterBuffSaveCollection</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>TimedBuffSaves</PropertyName>
            <PropertyType>ArrayProperty</PropertyType>
            <Value />
            <TheType>StructProperty</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs>
          <StructObject xsi:type="ArrayProperty">
            <Index>0</Index>
            <PropertyName>TimedBuffSaves</PropertyName>
            <PropertyType>TimedCharacterBuffSave</PropertyType>
            <SubStruct>StructProperty</SubStruct>
            <TheStats />
            <TheSubs />
          </StructObject>
        </TheSubs>
        <Terminated>true</Terminated>
      </StructObject>`;
}

function generateEquipmentSection(unused) {
    // Equipment section is separate from SurvivorData
    // Order: Backpack, Melee, CloseCombat, Ranged, Sidearm, Rucksack
    // Non-Null items need xsi:type and StackData structure
    const getClassString = (itemName, category) => {
        if (!itemName || itemName === '' || itemName === 'None') {
            return { classString: 'Null', hasItem: false };
        }
        
        let classString = 'Null';
        
        // Try to find in weapon mapping
        if (category === 'weapon' && dataLoader && dataLoader.data && dataLoader.data.weaponIdMapping) {
            const mapping = dataLoader.data.weaponIdMapping[itemName];
            if (mapping && mapping.classString) {
                classString = mapping.classString;
            }
        }
        
        // Try to find in backpack mapping
        if (category === 'backpack' && dataLoader && dataLoader.data && dataLoader.data.backpackIdMapping) {
            const mapping = dataLoader.data.backpackIdMapping[itemName];
            if (mapping && mapping.classString) {
                classString = mapping.classString;
            }
        }
        
        // Try to find in weapon data files
        if (category === 'weapon' && classString === 'Null' && dataLoader && dataLoader.data) {
            const allWeapons = [
                ...(dataLoader.data.weapons?.assault || []),
                ...(dataLoader.data.weapons?.rifles || []),
                ...(dataLoader.data.weapons?.shotguns || []),
                ...(dataLoader.data.weapons?.pistols || []),
                ...(dataLoader.data.weapons?.revolvers || []),
                ...(dataLoader.data.weapons?.crossbows || [])
            ];
            const weapon = allWeapons.find(w => (w.Name === itemName || w.DisplayName === itemName || w['Weapon Name'] === itemName));
            if (weapon && weapon.ClassString) {
                classString = weapon.ClassString;
            }
        }
        
        // Try to find in backpack data
        if (category === 'backpack' && classString === 'Null' && dataLoader && dataLoader.data && dataLoader.data.backpacks) {
            const backpack = dataLoader.data.backpacks.find(b => {
                const name = b.DisplayName || b['All columns are the back pack name'] || b.Name || '';
                return name === itemName;
            });
            if (backpack && backpack.ClassString) {
                classString = backpack.ClassString;
            }
        }
        
        return { classString, hasItem: classString !== 'Null' };
    };
    
    const generateEquipmentItem = (itemName, category, itemType) => {
        const { classString, hasItem } = getClassString(itemName, category);
        
        if (!hasItem) {
            // Null items - simple structure
            return `    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>`;
        }
        
        // Non-null items need xsi:type and StackData
        let xsiType = 'ItemExport';
        let stackDataProperty = 'ItemInstances';
        let instanceSaveType = 'ItemInstanceSave';
        
        if (category === 'backpack') {
            xsiType = 'BackpackExport';
            stackDataProperty = 'BackpackItemInstances';
            instanceSaveType = 'BackpackItemInstanceSave';
        } else if (itemType === 'melee') {
            xsiType = 'MeleeWeaponExport';
            stackDataProperty = 'MeleeWeaponItemInstances';
            instanceSaveType = 'MeleeWeaponItemInstanceSave';
        } else if (itemType === 'closeCombat') {
            xsiType = 'CloseCombatExport';
            stackDataProperty = 'CloseCombatItemInstances';
            instanceSaveType = 'CloseCombatItemInstanceSave';
        } else if (itemType === 'ranged' || itemType === 'sidearm') {
            xsiType = 'RangedWeaponExport';
            stackDataProperty = 'RangedWeaponItemInstances';
            instanceSaveType = 'RangedWeaponItemInstanceSave';
        }
        
        // Generate StackData based on item type
        let stackDataContent = '';
        if (category === 'backpack') {
            stackDataContent = `      <StackData xsi:type="StructProperty">
        <Index>0</Index>
        <PropertyName>${stackDataProperty}</PropertyName>
        <PropertyType>${instanceSaveType}</PropertyType>
        <SubStruct>${instanceSaveType}</SubStruct>
        <TheStats>
          <SaveObject xsi:type="IntProperty">
            <Index>0</Index>
            <PropertyName>ClassIndex</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="DoubleProperty">
            <Index>1</Index>
            <PropertyName>TimeAddedToInventory</PropertyName>
            <PropertyType>DoubleProperty</PropertyType>
            <Value>-1</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
        <Terminated>true</Terminated>
      </StackData>`;
        } else if (itemType === 'melee' || itemType === 'ranged' || itemType === 'sidearm') {
            stackDataContent = `      <StackData xsi:type="StructProperty">
        <Index>0</Index>
        <PropertyName>${stackDataProperty}</PropertyName>
        <PropertyType>${instanceSaveType}</PropertyType>
        <SubStruct>${instanceSaveType}</SubStruct>
        <TheStats>
          <SaveObject xsi:type="IntProperty">
            <Index>0</Index>
            <PropertyName>Durability</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>240</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="IntProperty">
            <Index>1</Index>
            <PropertyName>PreviousMaxDurability</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>240</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="IntProperty">
            <Index>2</Index>
            <PropertyName>BlowsSincePreviousStateChange</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="IntProperty">
            <Index>3</Index>
            <PropertyName>ClassIndex</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="DoubleProperty">
            <Index>4</Index>
            <PropertyName>TimeAddedToInventory</PropertyName>
            <PropertyType>DoubleProperty</PropertyType>
            <Value>-1</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
        <Terminated>true</Terminated>
      </StackData>`;
        } else if (itemType === 'closeCombat') {
            stackDataContent = `      <StackData xsi:type="StructProperty">
        <Index>0</Index>
        <PropertyName>${stackDataProperty}</PropertyName>
        <PropertyType>${instanceSaveType}</PropertyType>
        <SubStruct>${instanceSaveType}</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>StackInfo</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceStackInfoSave</TheType>
          </SaveObject>
          <SaveObject xsi:type="IntProperty">
            <Index>1</Index>
            <PropertyName>ClassIndex</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="DoubleProperty">
            <Index>2</Index>
            <PropertyName>TimeAddedToInventory</PropertyName>
            <PropertyType>DoubleProperty</PropertyType>
            <Value>-1</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs>
          <StructObject xsi:type="StructProperty">
            <Index>0</Index>
            <PropertyName>StackInfo</PropertyName>
            <PropertyType>ItemInstanceStackInfoSave</PropertyType>
            <SubStruct>ItemInstanceStackInfoSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>StackCount</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>1</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
        </TheSubs>
        <Terminated>true</Terminated>
      </StackData>`;
        }
        
        return `    <ItemExport xsi:type="${xsiType}">
      <ClassString>${classString}</ClassString>
${stackDataContent}
    </ItemExport>`;
    };
    
    // Equipment is now empty - using Inventory Items section instead
    // Equipment is now empty - using Inventory Items section instead
    const backpack = '';
    const melee = '';
    const closeCombat = '';
    const ranged = '';
    const sidearm = '';
    const rucksack = '';
    
    return `
  <Equipment>
${generateEquipmentItem(backpack, 'backpack', 'backpack')}
${generateEquipmentItem(melee, 'weapon', 'melee')}
${generateEquipmentItem(closeCombat, 'weapon', 'closeCombat')}
${generateEquipmentItem(ranged, 'weapon', 'ranged')}
${generateEquipmentItem(sidearm, 'weapon', 'sidearm')}
${generateEquipmentItem(rucksack, 'backpack', 'backpack')}
  </Equipment>
`;
}

function generateSlotsSection() {
    // Slots section for inventory items
    // Generate ItemExport entries for each inventory item
    const inventory = characterData.inventory || [];
    const maxSlots = 30; // Standard inventory size (can be adjusted)
    
    let slotsXML = '  <Slots>\n';
    
    // Generate entries for inventory items
    inventory.forEach((item, index) => {
        if (index >= maxSlots) return; // Don't exceed max slots
        
        const classString = item.classString || 'Null';
        const quantity = item.quantity || 1;
        const category = item.category || '';
        
        // Determine xsi:type based on category
        let xsiType = 'ItemExport';
        let stackDataProperty = 'ItemInstances';
        let instanceSaveType = 'ItemInstanceSave';
        
        if (category === 'consumable') {
            xsiType = 'ConsumableExport';
            stackDataProperty = 'ConsumableItemInstances';
            instanceSaveType = 'ConsumableItemInstanceSave';
        } else if (category === 'ammo') {
            xsiType = 'AmmoExport';
            stackDataProperty = 'AmmoItemInstances';
            instanceSaveType = 'AmmoItemInstanceSave';
        } else if (category === 'resource') {
            xsiType = 'ResourceExport';
            stackDataProperty = 'ResourceItemInstances';
            instanceSaveType = 'ResourceItemInstanceSave';
        } else if (category === 'miscellaneous') {
            xsiType = 'MiscellaneousExport';
            stackDataProperty = 'MiscellaneousItemInstances';
            instanceSaveType = 'MiscellaneousItemInstanceSave';
        } else if (category === 'backpack') {
            xsiType = 'BackpackExport';
            stackDataProperty = 'BackpackItemInstances';
            instanceSaveType = 'BackpackItemInstanceSave';
        }
        
        // Generate StackData for non-null items
        if (classString !== 'Null') {
            // Backpacks use a simpler StackData structure (no StackInfo)
            if (category === 'backpack') {
                slotsXML += `    <ItemExport xsi:type="${xsiType}">
      <ClassString>${escapeXML(classString)}</ClassString>
      <StackData xsi:type="StructProperty">
        <Index>0</Index>
        <PropertyName>${stackDataProperty}</PropertyName>
        <PropertyType>${instanceSaveType}</PropertyType>
        <SubStruct>${instanceSaveType}</SubStruct>
        <TheStats>
          <SaveObject xsi:type="IntProperty">
            <Index>0</Index>
            <PropertyName>ClassIndex</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>${index}</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="DoubleProperty">
            <Index>1</Index>
            <PropertyName>TimeAddedToInventory</PropertyName>
            <PropertyType>DoubleProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
        <Terminated>true</Terminated>
      </StackData>
    </ItemExport>\n`;
            } else {
                // Other items use StackData with StackInfo and StackCount
                slotsXML += `    <ItemExport xsi:type="${xsiType}">
      <ClassString>${escapeXML(classString)}</ClassString>
      <StackData xsi:type="StructProperty">
        <Index>0</Index>
        <PropertyName>${stackDataProperty}</PropertyName>
        <PropertyType>${instanceSaveType}</PropertyType>
        <SubStruct>${instanceSaveType}</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>StackInfo</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemInstanceStackInfoSave</TheType>
          </SaveObject>
          <SaveObject xsi:type="IntProperty">
            <Index>1</Index>
            <PropertyName>ClassIndex</PropertyName>
            <PropertyType>IntProperty</PropertyType>
            <Value>${index}</Value>
            <TheType>0</TheType>
          </SaveObject>
          <SaveObject xsi:type="DoubleProperty">
            <Index>2</Index>
            <PropertyName>TimeAddedToInventory</PropertyName>
            <PropertyType>DoubleProperty</PropertyType>
            <Value>0</Value>
            <TheType>0</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs>
          <StructObject xsi:type="StructProperty">
            <Index>0</Index>
            <PropertyName>StackInfo</PropertyName>
            <PropertyType>ItemInstanceStackInfoSave</PropertyType>
            <SubStruct>ItemInstanceStackInfoSave</SubStruct>
            <TheStats>
              <SaveObject xsi:type="IntProperty">
                <Index>0</Index>
                <PropertyName>StackCount</PropertyName>
                <PropertyType>IntProperty</PropertyType>
                <Value>${quantity}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
            <Terminated>true</Terminated>
          </StructObject>
        </TheSubs>
        <Terminated>true</Terminated>
      </StackData>
    </ItemExport>\n`;
            }
        } else {
            // Null item
            slotsXML += `    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>\n`;
        }
    });
    
    // Fill remaining slots with Null entries
    for (let i = inventory.length; i < maxSlots; i++) {
        slotsXML += `    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>\n`;
    }
    
    slotsXML += '  </Slots>\n';
    
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/13dd2c27-a79e-4847-8a99-f0332c922906',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xmlGenerator.js:1158',message:'Slots section generated',data:{inventoryLength:inventory.length,slotsGenerated:inventory.length+Math.max(0,maxSlots-inventory.length),xmlLength:slotsXML.length},timestamp:Date.now(),sessionId:'debug-session',runId:'test1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    return slotsXML;
}

function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
