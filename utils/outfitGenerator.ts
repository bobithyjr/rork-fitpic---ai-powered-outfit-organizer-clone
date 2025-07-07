import { Platform } from "react-native";
import { ClothingItem, Outfit } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

// Helper function to get recently used items from outfit history
const getRecentlyUsedItems = (outfitHistory: Outfit[], lookBackCount: number = 3): Set<string> => {
  const recentlyUsed = new Set<string>();
  
  // Look at the last few outfits
  const recentOutfits = outfitHistory.slice(0, lookBackCount);
  
  recentOutfits.forEach(outfit => {
    Object.values(outfit.items).forEach(item => {
      if (item) {
        recentlyUsed.add(item.id);
      }
    });
  });
  
  return recentlyUsed;
};

// Helper function to calculate outfit similarity
const calculateOutfitSimilarity = (outfit1: Record<string, ClothingItem | null>, outfit2: Record<string, ClothingItem | null>): number => {
  let matches = 0;
  let totalSlots = 0;
  
  CLOTHING_CATEGORIES.forEach(category => {
    if (category.id === 'all') return;
    
    totalSlots++;
    const item1 = outfit1[category.id];
    const item2 = outfit2[category.id];
    
    if (item1 && item2 && item1.id === item2.id) {
      matches++;
    }
  });
  
  return totalSlots > 0 ? matches / totalSlots : 0;
};

// Helper function to check if outfit is too similar to recent ones
const isOutfitTooSimilar = (newOutfit: Record<string, ClothingItem | null>, outfitHistory: Outfit[], threshold: number = 0.5): boolean => {
  const recentOutfits = outfitHistory.slice(0, 3); // Check last 3 outfits
  
  return recentOutfits.some(recentOutfit => {
    const similarity = calculateOutfitSimilarity(newOutfit, recentOutfit.items);
    return similarity >= threshold;
  });
};

export async function generateOutfit(
  items: ClothingItem[],
  enabledCategories: Record<string, boolean>,
  outfitHistory: Outfit[] = []
): Promise<Record<string, ClothingItem | null>> {
  // Filter items by enabled categories
  const availableItems = items.filter(
    (item) => enabledCategories[item.categoryId] ?? true
  );

  // Get recently used items to avoid repetition
  const recentlyUsed = getRecentlyUsedItems(outfitHistory, 3);

  // Group items by category
  const itemsByCategory: Record<string, ClothingItem[]> = {};
  availableItems.forEach((item) => {
    if (!itemsByCategory[item.categoryId]) {
      itemsByCategory[item.categoryId] = [];
    }
    itemsByCategory[item.categoryId].push(item);
  });

  // Try to generate a diverse outfit (up to 5 attempts)
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    // Initialize outfit with all positions as null
    const outfit: Record<string, ClothingItem | null> = {};
    CLOTHING_CATEGORIES.forEach((category) => {
      outfit[category.id] = null;
    });

    // For each category, select an item with bias against recently used
    CLOTHING_CATEGORIES.forEach((category) => {
      // Skip if category is disabled
      if (!enabledCategories[category.id]) {
        return;
      }

      const categoryItems = itemsByCategory[category.id] || [];
      
      // Required categories: shirts, pants, shoes, belts - always pick if available
      // Optional categories: 70% chance to pick an item if available
      const isRequired = !category.optional;
      const shouldPickItem = isRequired || Math.random() < 0.7;
      
      if (categoryItems.length > 0 && shouldPickItem) {
        // Separate items into recently used and fresh items
        const freshItems = categoryItems.filter(item => !recentlyUsed.has(item.id));
        const usedItems = categoryItems.filter(item => recentlyUsed.has(item.id));
        
        let selectedItem: ClothingItem;
        
        if (freshItems.length > 0) {
          // Prefer fresh items (80% chance if available)
          if (Math.random() < 0.8 || usedItems.length === 0) {
            const randomIndex = Math.floor(Math.random() * freshItems.length);
            selectedItem = freshItems[randomIndex];
          } else {
            const randomIndex = Math.floor(Math.random() * usedItems.length);
            selectedItem = usedItems[randomIndex];
          }
        } else {
          // Only recently used items available
          const randomIndex = Math.floor(Math.random() * categoryItems.length);
          selectedItem = categoryItems[randomIndex];
        }
        
        outfit[category.id] = selectedItem;
      }
    });

    // Check if this outfit is too similar to recent ones
    if (!isOutfitTooSimilar(outfit, outfitHistory, 0.6)) {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return outfit;
    }
    
    attempts++;
  }

  // If we couldn't generate a sufficiently different outfit, return the last attempt
  // This can happen if the user has very few items
  const outfit: Record<string, ClothingItem | null> = {};
  CLOTHING_CATEGORIES.forEach((category) => {
    outfit[category.id] = null;
  });

  CLOTHING_CATEGORIES.forEach((category) => {
    if (!enabledCategories[category.id]) {
      return;
    }

    const categoryItems = itemsByCategory[category.id] || [];
    const isRequired = !category.optional;
    const shouldPickItem = isRequired || Math.random() < 0.7;
    
    if (categoryItems.length > 0 && shouldPickItem) {
      const randomIndex = Math.floor(Math.random() * categoryItems.length);
      outfit[category.id] = categoryItems[randomIndex];
    }
  });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return outfit;
}

export async function generateAIOutfit(
  items: ClothingItem[],
  enabledCategories: Record<string, boolean>,
  outfitHistory: Outfit[] = []
): Promise<Record<string, ClothingItem | null>> {
  try {
    // Filter items by enabled categories
    const availableItems = items.filter(
      (item) => enabledCategories[item.categoryId] ?? true
    );

    // If we have fewer than 3 items, fall back to simple random selection
    if (availableItems.length < 3) {
      return await generateOutfit(items, enabledCategories, outfitHistory);
    }

    // Get recently used items to provide context to AI
    const recentlyUsed = getRecentlyUsedItems(outfitHistory, 3);
    const recentlyUsedItems = availableItems.filter(item => recentlyUsed.has(item.id));

    // Group items by category for AI analysis
    const itemsByCategory: Record<string, ClothingItem[]> = {};
    availableItems.forEach((item) => {
      if (!itemsByCategory[item.categoryId]) {
        itemsByCategory[item.categoryId] = [];
      }
      itemsByCategory[item.categoryId].push(item);
    });

    // Create a description of available items for the AI
    const itemDescriptions = availableItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.categoryId,
      tags: item.tags || [],
      recentlyUsed: recentlyUsed.has(item.id)
    }));

    // Create context about recent outfits for variety
    const recentOutfitContext = outfitHistory.slice(0, 3).map((outfit, index) => {
      const usedItems = Object.values(outfit.items)
        .filter(item => item !== null)
        .map(item => item!.name);
      return `Recent outfit ${index + 1}: ${usedItems.join(', ')}`;
    }).join('\n');

    // Prepare the AI prompt
    const prompt = `You are a world-class fashion stylist with expertise in color theory, style coordination, and current fashion trends. Your goal is to create visually stunning, well-coordinated outfits that are both stylish and practical.

Available clothing items:
${JSON.stringify(itemDescriptions, null, 2)}

${recentOutfitContext ? `Recent outfit history (AVOID creating similar combinations):
${recentOutfitContext}` : ''}

Available categories and their requirements:
- shirts: REQUIRED (core piece)
- pants: REQUIRED (core piece) 
- shoes: REQUIRED (core piece)
- belts: REQUIRED (essential accessory)
- hats: OPTIONAL (add if it enhances the look)
- jackets: OPTIONAL (add for layering or style)
- accessories: OPTIONAL (add for personality and flair)

Fashion guidelines to follow:
1. COLOR HARMONY: Create pleasing color combinations using:
   - Complementary colors (opposite on color wheel)
   - Analogous colors (adjacent on color wheel)
   - Monochromatic schemes (different shades of same color)
   - Neutral bases with accent colors
   - Classic combinations (navy/white, black/white, denim/white, etc.)

2. STYLE CONSISTENCY: Ensure pieces work cohesively:
   - Match formality levels (casual with casual, formal with formal)
   - Consider silhouettes and proportions
   - Balance fitted and loose pieces
   - Maintain consistent aesthetic (minimalist, bohemian, classic, etc.)

3. VISUAL APPEAL: Create outfits that are:
   - Balanced and proportioned
   - Interesting without being overwhelming
   - Flattering and well-structured
   - Instagram-worthy and photogenic

4. VARIETY AND FRESHNESS: 
   - PRIORITIZE items that are NOT marked as "recentlyUsed: true"
   - Create combinations that feel fresh and different from recent outfits
   - Avoid repeating the same item combinations from recent history
   - Mix and match in new, creative ways

5. INTENTIONAL CHOICES: Every piece should have a purpose:
   - If mixing patterns, ensure they complement each other
   - If using bold colors, balance with neutrals
   - If adding accessories, ensure they enhance the overall look
   - Consider texture mixing (smooth with textured, matte with shiny)

6. CURRENT TRENDS: Incorporate modern fashion sensibilities while maintaining timeless appeal

IMPORTANT: Put real thought into each selection. Avoid random combinations. Each outfit should tell a cohesive style story and be something someone would genuinely want to wear and feel confident in. PRIORITIZE creating variety by using different items than those recently worn.

Please select ONE item from each category (if available) to create the best possible outfit. Return your response as a JSON object with this exact structure:

{
  "outfit": {
    "shirts": "item_id_or_null",
    "pants": "item_id_or_null", 
    "shoes": "item_id_or_null",
    "belts": "item_id_or_null",
    "hats": "item_id_or_null",
    "jackets": "item_id_or_null",
    "accessories": "item_id_or_null"
  },
  "reasoning": "Detailed explanation of the color coordination, style choices, variety considerations, and why this combination creates a cohesive, fashionable look that's different from recent outfits"
}

Only include item IDs that exist in the provided list. Use null for categories where you choose not to include an item or where no items are available.`;

    // Try to generate a diverse outfit (up to 3 attempts with AI)
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      // Call the AI API
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional fashion stylist with expertise in color theory, style coordination, and current fashion trends. Always respond with valid JSON. Focus on creating variety and avoiding repetitive outfit combinations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('AI API request failed');
      }

      const aiResult = await response.json();
      
      // Parse the AI response
      let aiOutfit;
      try {
        // Try to extract JSON from the completion
        const completion = aiResult.completion;
        const jsonMatch = completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiOutfit = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.log('Failed to parse AI response, falling back to random selection');
        return await generateOutfit(items, enabledCategories, outfitHistory);
      }

      // Convert AI selection to our outfit format
      const finalOutfit: Record<string, ClothingItem | null> = {};
      
      CLOTHING_CATEGORIES.forEach((category) => {
        finalOutfit[category.id] = null;
        
        if (!enabledCategories[category.id]) {
          return;
        }

        const selectedItemId = aiOutfit.outfit?.[category.id];
        if (selectedItemId && selectedItemId !== 'null') {
          const selectedItem = availableItems.find(item => item.id === selectedItemId);
          if (selectedItem) {
            finalOutfit[category.id] = selectedItem;
          }
        }
      });

      // Check if this AI-generated outfit is sufficiently different
      if (!isOutfitTooSimilar(finalOutfit, outfitHistory, 0.5)) {
        // Ensure we have at least the required items, fall back to random if AI didn't select them
        const requiredCategories = ['shirts', 'pants', 'shoes', 'belts'];
        requiredCategories.forEach(categoryId => {
          if (enabledCategories[categoryId] && !finalOutfit[categoryId] && itemsByCategory[categoryId]?.length > 0) {
            const randomIndex = Math.floor(Math.random() * itemsByCategory[categoryId].length);
            finalOutfit[categoryId] = itemsByCategory[categoryId][randomIndex];
          }
        });

        console.log('✨ AI Outfit Generated Successfully with Variety!');
        console.log('🎨 AI Reasoning:', aiOutfit.reasoning);
        console.log('👔 Selected Items:', Object.entries(finalOutfit)
          .filter(([_, item]) => item !== null)
          .map(([category, item]) => `${category}: ${item?.name}`)
          .join(', '));
        
        return finalOutfit;
      }
      
      attempts++;
      console.log(`AI outfit attempt ${attempts} was too similar to recent outfits, trying again...`);
    }

    // If AI couldn't generate a sufficiently different outfit, fall back to random with variety logic
    console.log('AI could not generate sufficiently different outfit, falling back to random with variety logic');
    return await generateOutfit(items, enabledCategories, outfitHistory);

  } catch (error) {
    console.error("❌ Error generating AI outfit:", error);
    console.log("🔄 Falling back to random generation with variety logic...");
    // Fall back to the random generation with variety
    return await generateOutfit(items, enabledCategories, outfitHistory);
  }
}