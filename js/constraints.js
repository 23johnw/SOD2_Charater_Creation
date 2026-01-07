// Validation and Constraint Enforcement
class ConstraintValidator {
    validateSkills(skills) {
        const errors = [];
        const warnings = [];
        
        // Validate core skills
        const coreSkills = ['cardio', 'wits', 'fighting', 'shooting'];
        coreSkills.forEach(skill => {
            const level = skills[skill]?.level || 0;
            if (level < 0 || level > 7) {
                errors.push(`${skill} level must be between 0 and 7`);
            }
            
            // Check specialization
            const specialty = skills[skill]?.specialty || '';
            if (specialty && level < 5) {
                errors.push(`${skill} specialization requires level 5 or higher`);
            }
        });
        
        // Validate 5th skill
        const fifthSkill = skills.fifthSkill;
        if (fifthSkill.type !== 'none' && !fifthSkill.skill) {
            errors.push('5th skill type selected but no skill chosen');
        }
        
        // Check mutual exclusivity (handled by UI, but validate here too)
        if (fifthSkill.type === 'community' && fifthSkill.type === 'quirk') {
            errors.push('Cannot have both community and quirk skills');
        }
        
        return { valid: errors.length === 0, errors, warnings };
    }

    validateTraits(requiredTraits, optionalTraits, limit) {
        return traitManager.validateTraits(requiredTraits, optionalTraits, limit);
    }

    validateCharacter(characterData) {
        const errors = [];
        const warnings = [];
        
        // Basic info validation
        if (!characterData.firstName) {
            errors.push('First name is required');
        }
        if (!characterData.gender) {
            errors.push('Gender is required');
        }
        
        // Check voiceID - if characterData doesn't have it, check the form
        let voiceID = characterData.voiceID;
        if (!voiceID) {
            const voiceSelect = document.getElementById('voiceID');
            voiceID = voiceSelect?.value || '';
        }
        if (!voiceID || voiceID.trim() === '') {
            errors.push('Voice ID is required');
        }
        if (!characterData.humanDefinition) {
            errors.push('Character model is required');
        }
        if (!characterData.culturalBackground) {
            errors.push('Cultural background is required');
        }
        
        // Skills validation
        const skillsValidation = this.validateSkills(characterData.skills);
        errors.push(...skillsValidation.errors);
        warnings.push(...skillsValidation.warnings);
        
        // Traits validation (no limit check)
        const traitsValidation = this.validateTraits(
            characterData.traits.required,
            characterData.traits.optional,
            999 // No practical limit
        );
        errors.push(...traitsValidation.errors);
        warnings.push(...traitsValidation.warnings);
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    enforceSkillConstraints(skillName, level, specialty) {
        // Enforce that specialty can only be selected at level 5+
        if (specialty && level < 5) {
            return { level, specialty: '' };
        }
        return { level, specialty };
    }
}

const constraintValidator = new ConstraintValidator();

// Add validation feedback to form
function showValidationFeedback(validation) {
    // Remove existing feedback
    document.querySelectorAll('.validation-error, .validation-success').forEach(el => el.remove());
    
    // Find the export section (last form section with button-group)
    const exportSection = document.querySelector('.form-section:last-child');
    const buttonGroup = exportSection?.querySelector('.button-group');
    
    // If elements don't exist, skip validation feedback (might be called during XML generation or form population)
    if (!exportSection || !buttonGroup) {
        return;
    }
    
    // Verify buttonGroup is actually a child of exportSection before using insertBefore
    if (!exportSection.contains(buttonGroup)) {
        // If buttonGroup is not a child, append to exportSection instead
        if (validation.valid) {
            const success = document.createElement('div');
            success.className = 'validation-success';
            success.textContent = '✓ Character is valid and ready to export';
            exportSection.appendChild(success);
        } else {
            validation.errors.forEach(error => {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'validation-error';
                errorDiv.textContent = `✗ ${error}`;
                exportSection.appendChild(errorDiv);
            });
        }
        
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'validation-error';
                warningDiv.style.color = '#ff9800';
                warningDiv.textContent = `⚠ ${warning}`;
                exportSection.appendChild(warningDiv);
            });
        }
        return;
    }
    
    if (validation.valid) {
        const success = document.createElement('div');
        success.className = 'validation-success';
        success.textContent = '✓ Character is valid and ready to export';
        exportSection.insertBefore(success, buttonGroup);
    } else {
        validation.errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = `✗ ${error}`;
            exportSection.insertBefore(errorDiv, buttonGroup);
        });
    }
    
    if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'validation-error';
            warningDiv.style.color = '#ff9800';
            warningDiv.textContent = `⚠ ${warning}`;
            exportSection.insertBefore(warningDiv, buttonGroup);
        });
    }
}

// Hook into updateCharacterData function
// This will be called after app.js defines updateCharacterData
document.addEventListener('DOMContentLoaded', () => {
    // Store original function
    const originalUpdateCharacterData = window.updateCharacterData;
    
    // Override with validation
    window.updateCharacterData = function() {
        if (originalUpdateCharacterData) {
            originalUpdateCharacterData();
        }
        const validation = constraintValidator.validateCharacter(characterData);
        showValidationFeedback(validation);
    };
});

