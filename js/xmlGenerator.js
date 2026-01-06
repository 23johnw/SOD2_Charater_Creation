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
    
    // Basic properties
    xml += generateIntProperty(0, 'ID', characterID);
    xml += generateStructProperty(1, 'NarrativeEntityId', 'NarrativeEntityId', '');
    xml += generateTextProperty(2, 'FirstName', characterData.firstName || '');
    xml += generateTextProperty(3, 'LastName', characterData.lastName || '');
    xml += generateTextProperty(4, 'NickName', characterData.nickname || '');
    xml += generateNameProperty(5, 'VoiceID', `${characterData.voiceID}_Low`);
    xml += generateNameProperty(6, 'CulturalBackgroundName', characterData.culturalBackground || 'AfricanAmerican');
    xml += generateArrayProperty(7, 'FamilyRelationships', 'StructProperty', '');
    xml += generateNameProperty(8, 'HumanDefinition', characterData.humanDefinition || '');
    xml += generateStructProperty(9, 'outfit', 'DaytonCharacterOutfit', '');
    
    // Boolean properties
    xml += generateBoolProperty(10, 'bIsDead', false);
    xml += generateBoolProperty(11, 'bIsDeparted', false);
    xml += generateBoolProperty(12, 'bIsTaggedForDimiss', false);
    xml += generateBoolProperty(13, 'bIsTaggedForDemotion', false);
    
    // Stats and other properties (simplified - using defaults)
    xml += generateFloatProperty(14, 'CurrentHealth', characterData.stats.health || 100);
    xml += generateFloatProperty(15, 'CurrentStamina', characterData.stats.stamina || 100);
    xml += generateFloatProperty(16, 'MaxHealth', 100);
    xml += generateFloatProperty(17, 'MaxStamina', 100);
    xml += generateFloatProperty(18, 'MaxHealthBonus', 0);
    xml += generateFloatProperty(19, 'MaxStaminaBonus', 0);
    xml += generateFloatProperty(20, 'CurrentInjury', 0);
    xml += generateFloatProperty(21, 'CurrentTrauma', 0);
    xml += generateFloatProperty(22, 'CurrentBloodPlague', 0);
    xml += generateFloatProperty(23, 'MaxBloodPlague', 100);
    xml += generateFloatProperty(24, 'CurrentFatigue', 0);
    xml += generateFloatProperty(25, 'MaxFatigue', 100);
    xml += generateFloatProperty(26, 'CurrentHealth', characterData.stats.health || 100);
    xml += generateFloatProperty(27, 'CurrentStamina', characterData.stats.stamina || 100);
    xml += generateFloatProperty(28, 'FatigueCounter', 0);
    xml += generateFloatProperty(29, 'PainkillerAddictionCounter', 0);
    xml += generateFloatProperty(30, 'SicknessCounter', 0);
    xml += generateFloatProperty(31, 'PlagueTimer', 0);
    xml += generateFloatProperty(32, 'PlagueRate', 17.95);
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
    
    // Standing and leader info
    xml += generateNameProperty(49, 'StandingLevel', characterData.standingLevel || 'Citizen');
    xml += generateNameProperty(50, 'LeaderTypeID', characterData.leaderType || 'None');
    if (characterData.heroBonus) {
        xml += generateNameProperty(51, 'HeroBonusID', characterData.heroBonus);
    }
    
    xml += `    </TheStats>
    <TheSubs>
      <StructObject xsi:type="StructProperty">
        <Index>2</Index>
        <PropertyName>FirstName</PropertyName>
        <PropertyType>TextProperty</PropertyType>
        <Value>${escapeXML(characterData.firstName || '')}</Value>
      </StructObject>
      <StructObject xsi:type="StructProperty">
        <Index>3</Index>
        <PropertyName>LastName</PropertyName>
        <PropertyType>TextProperty</PropertyType>
        <Value>${escapeXML(characterData.lastName || '')}</Value>
      </StructObject>
      <StructObject xsi:type="StructProperty">
        <Index>4</Index>
        <PropertyName>NickName</PropertyName>
        <PropertyType>TextProperty</PropertyType>
        <Value>${escapeXML(characterData.nickname || '')}</Value>
      </StructObject>`;
    
    // Add Skills subsection
    xml += generateSkillsSubsection(characterData.skills);
    
    // Add Traits subsection
    xml += generateTraitsSubsection(characterData.traits);
    
    // Add Equipment subsection (simplified for now)
    xml += generateEquipmentSubsection(characterData.loadout);
    
    xml += `    </TheSubs>
  </SurvivorData>
</SurvivorExport>`;
    
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
        <TheType>${escapeXML(enumType)}</TheType>
      </SaveObject>`;
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
    
    coreSkills.forEach((skill, idx) => {
        const skillData = skills[skill.key];
        if (skillData && skillData.level > 0) {
            skillList.push({
                name: skill.name,
                level: skillData.level,
                specialty: skillData.specialty || ''
            });
        }
    });
    
    // 5th skill
    if (skills.fifthSkill.type !== 'none' && skills.fifthSkill.skill) {
        skillList.push({
            name: skills.fifthSkill.skill,
            level: 1,
            specialty: ''
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
              </SaveObject>`;
        
        if (skill.specialty) {
            xml += `
              <SaveObject xsi:type="NameProperty">
                <Index>3</Index>
                <PropertyName>SpecializationResourceID</PropertyName>
                <PropertyType>NameProperty</PropertyType>
                <Value>${escapeXML(skill.specialty)}</Value>
                <TheType>0</TheType>
              </SaveObject>`;
        }
        
        xml += `
            </TheStats>
            <TheSubs />
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
    const allTraits = [...traits.required, ...traits.optional];
    
    let xml = `
      <StructObject xsi:type="ArrayProperty">
        <Index>39</Index>
        <PropertyName>Traits</PropertyName>
        <PropertyType>SurvivorTraitSave</PropertyType>
        <SubStruct>StructProperty</SubStruct>
        <TheStats>`;
    
    allTraits.forEach((trait, idx) => {
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
    
    allTraits.forEach((trait, idx) => {
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
                <Value>${escapeXML(trait.traitResourceID || trait.name)}</Value>
                <TheType>0</TheType>
              </SaveObject>
            </TheStats>
            <TheSubs />
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
    // Simplified equipment section - can be expanded later
    return `
      <StructObject xsi:type="StructProperty">
        <Index>40</Index>
        <PropertyName>Equipment</PropertyName>
        <PropertyType>EquipmentSave</PropertyType>
        <SubStruct>EquipmentSave</SubStruct>
        <TheStats>
          <SaveObject>
            <Index>0</Index>
            <PropertyName>Backpack</PropertyName>
            <PropertyType>StructProperty</PropertyType>
            <Value />
            <TheType>ItemSave</TheType>
          </SaveObject>
        </TheStats>
        <TheSubs />
      </StructObject>`;
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

