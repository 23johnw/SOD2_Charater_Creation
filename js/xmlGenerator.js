// XML Generation Logic
function generateCharacterXML() {
    // Generate unique ID
    const characterID = Math.floor(Math.random() * 10000) + 1000;
    
    // Build XML structure
    let xml = `<?xml version="1.0"?>
<SurvivorExport xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <SurvivorData xsi:type="StructProperty">
    <Index>2</Index>
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
    xml += generateNameProperty(8, 'HumanDefinition', characterData.humanDefinition || '');
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
    xml += generateByteProperty(22, 'StandingLevel', `ECharacterStanding::${characterData.standingLevel || 'Citizen'}`, 'ECharacterStanding');
    
    // Hero bonus and leader type
    if (characterData.heroBonus) {
        xml += generateNameProperty(23, 'HeroBonusID', characterData.heroBonus);
    }
    xml += generateNameProperty(24, 'LeaderTypeID', characterData.leaderType || 'None');
    
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
    
    // Equipment
    xml += generateEquipmentStruct(40, characterData.loadout);
    
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
    xml += generateTextPropertySubsection(2, 'FirstName', characterData.firstName || '');
    xml += generateTextPropertySubsection(3, 'LastName', characterData.lastName || '');
    xml += generateTextPropertySubsection(4, 'NickName', characterData.nickname || '');
    
    // FamilyRelationships array
    xml += generateFamilyRelationshipsSubsection(7);
    
    // Outfit subsection
    xml += generateOutfitSubsection(9);
    
    // Skills subsection
    xml += generateSkillsSubsection(characterData.skills);
    
    // Traits subsection
    xml += generateTraitsSubsection(characterData.traits);
    
    // Equipment subsection
    xml += generateEquipmentSubsection(characterData.loadout);
    
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
    xml += generateEquipmentSection(characterData.loadout);
    
    // Slots section (inventory items)
    xml += generateSlotsSection();
    
    xml += `</SurvivorExport>`;
    
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
    // Generate a simple TextProperty subsection (simplified version)
    // The full version has complex nested StringProperty structures, but this should work
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
            <Value>DNL.NameList.Default__AngloAmerican_Common_FemaleMiddle_C.Names.0.Name</Value>
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
    
    // Core 4 skills
    const coreSkills = [
        { name: 'Cardio', key: 'cardio' },
        { name: 'Wits', key: 'wits' },
        { name: 'Fighting', key: 'fighting' },
        { name: 'Shooting', key: 'shooting' }
    ];
    
    coreSkills.forEach((skill) => {
        const skillData = skills[skill.key];
        if (skillData && skillData.level > 0) {
            skillList.push({
                name: skill.name,
                level: skillData.level,
                specialty: skillData.specialty || '',
                grantingTrait: 'Default'
            });
        }
    });
    
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

function generateEquipmentStruct(index, loadout) {
    return generateStructProperty(index, 'Equipment', 'EquipmentSave', '');
}

function generateEquipmentSubsection(loadout) {
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
                <Value>-1</Value>
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
                <Value>-1</Value>
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
                <Value>-1</Value>
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
                <Value>-1</Value>
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
                <Value>-1</Value>
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
                <Value>-1</Value>
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
            <TheStats />
            <TheSubs />
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

function generateEquipmentSection(loadout) {
    // Equipment section is separate from SurvivorData
    return `
  <Equipment>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
  </Equipment>`;
}

function generateSlotsSection() {
    // Slots section for inventory items
    return `
  <Slots>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
    <ItemExport>
      <ClassString>Null</ClassString>
    </ItemExport>
  </Slots>`;
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
