# Unmatched Traits Summary

**Total:** 27 unmatched traits out of 972 (97.2% match rate)

## ✅ EXACT MATCHES FOUND IN UILists.cs

These traits exist in UILists.cs with exact names. They should be matched but aren't due to CSV parsing or name formatting issues:

### "Learned" Traits (5 traits)
1. **"Learned Computing"** → `Computers_FromConsumable`
2. **"Learned Medicine"** → `Medicine_FromConsumable`
3. **"Learned to Cook"** → `Cooking_FromConsumable`
4. **"Learned to Garden"** → `Gardening_FromConsumable`
5. **"Learned Utilities"** → `Utilities_FromConsumable`

### "Trained" Traits (4 traits)
6. **"Mentally Trained"** → `Wits_Respec`
7. **"Physically Trained"** → `Cardio_Respec`
8. **"Trained at Fighting"** → `Fighting_Respec`
9. **"Trained at Shooting"** → `Shooting_Respec`

### Red Talon Traits (6 traits - names have extra formatting in CSV)
10. **"Cooked for the Squad \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_SquadCook`
11. **"Facilities Engineer \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_Infrastructure`
12. **"Firearms Enthusiast \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_Enthusiast`
13. **"Front Line Experience \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_Heroism_2`
14. **"Practices at the Range \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_Warfighting_1`
15. **"Worked as a Pioneer \n\n*(Red Talon Contractors only)*"** → `DLC2_RedTalon_Pioneer`

### Other Traits (6 traits)
16. **"Always Vigilant"** → `Philosophy_Prudent_AlwaysVigilant`
17. **"Filthy"** → `Standing_Attribute_Filthy`
18. **"Hated Camping"** → `Minor_Before_HatedCamping`
19. **"Lacks Boundaries"** → `Morale_Attribute_NoBoundaries`
20. **"Left for Dead"** → `Frustration_After_LeftForDead`
21. **"No Filter"** → `Standing_Attribute_NoFilter`
22. **"Noisy"** → `Noise_Attribute_Noisy`
23. **"Talks Loudly"** → `Noise_Attribute_TalksLoudly`
24. **"Taxidermist"** → `Fighting_Career_Taxidermist`

## ❓ TRAITS NOT FOUND IN UILists.cs

These traits don't appear to exist in UILists.cs (may not be in the game, or have different names):

1. **"Flatuent"** - No match found
2. **"Goes by Last Name"** - No match found
3. **"Short Change Hero"** - No match found

## Summary

- **21 traits** have exact matches in UILists.cs (should be easy to fix)
- **3 traits** don't appear to exist in UILists.cs (may need different names or may not be in game)
- **3 traits** are Red Talon traits with formatting issues (newlines and asterisks in CSV name)

## Recommended Actions

1. **Fix the 21 exact matches** - Update the extraction script to handle these cases
2. **Fix Red Talon trait names** - Strip the `\n\n*(Red Talon Contractors only)*` suffix when matching
3. **Investigate the 3 missing traits** - Check if they exist with different names or if they're not in the game

