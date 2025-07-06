import { Platform } from "react-native";
import { ClothingItem, Outfit } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

export async function generateOutfit(
  items: ClothingItem[],
  enabledCategories: Record<string, boolean>
): Promise<Record<string, ClothingItem | null>> {
  // Filter items by enabled categories
  const availableItems = items.filter(
    (item) => enabledCategories[item.categoryId] ?? true
  );

  // Group items by category
  const itemsByCategory: Record<string, ClothingItem[]> = {};
  availableItems.forEach((item) => {
    if (!itemsByCategory[item.categoryId]) {
      itemsByCategory[item.categoryId] = [];
    }
    itemsByCategory[item.categoryId].push(item);
  });

  // Initialize outfit with all positions as null
  const outfit: Record<string, ClothingItem | null> = {};
  CLOTHING_CATEGORIES.forEach((category) => {
    outfit[category.id] = null;
  });

  // For each category, randomly select an item if available
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
      const randomIndex = Math.floor(Math.random() * categoryItems.length);
      outfit[category.id] = categoryItems[randomIndex];
    }
  });

  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return outfit;
}

export async function generateAIOutfit(
  items: ClothingItem[],
  enabledCategories: Record<string, boolean>
): Promise<Record<string, ClothingItem | null>> {
  try {
    // Filter items by enabled categories
    const availableItems = items.filter(
      (item) => enabledCategories[item.categoryId] ?? true
    );

    // If we have fewer than 3 items, fall back to simple random selection
    if (availableItems.length < 3) {
      return await generateOutfit(items, enabledCategories);
    }

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
      tags: item.tags || []
    }));

    // Prepare the AI prompt
    const prompt = `You are a professional fashion stylist. I need you to create a stylish, cohesive outfit from the following clothing items. Consider color coordination, style compatibility, seasonal appropriateness, and current fashion trends.

Available clothing items:
${JSON.stringify(itemDescriptions, null, 2)}

Available categories and their requirements:
- shirts: REQUIRED (core piece)
- pants: REQUIRED (core piece) 
- shoes: REQUIRED (core piece)
- belts: REQUIRED (essential accessory)
- hats: OPTIONAL (add if it enhances the look)
- jackets: OPTIONAL (add for layering or style)
- accessories: OPTIONAL (add for personality and flair)

Fashion guidelines to follow:
1. Color coordination: Match or complement colors thoughtfully
2. Style consistency: Ensure pieces work together (casual with casual, formal with formal, etc.)
3. Visual balance: Consider proportions and silhouettes
4. Intentional contrast: If mixing styles/colors, make it purposeful and fashionable
5. Seasonal appropriateness: Consider layering and weather-appropriate choices
6. Current trends: Incorporate modern fashion sensibilities

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
  "reasoning": "Brief explanation of why this combination works well together"
}

Only include item IDs that exist in the provided list. Use null for categories where you choose not to include an item or where no items are available.`;

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
            content: 'You are a professional fashion stylist with expertise in color theory, style coordination, and current fashion trends. Always respond with valid JSON.'
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
      return await generateOutfit(items, enabledCategories);
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

    // Ensure we have at least the required items, fall back to random if AI didn't select them
    const requiredCategories = ['shirts', 'pants', 'shoes', 'belts'];
    requiredCategories.forEach(categoryId => {
      if (enabledCategories[categoryId] && !finalOutfit[categoryId] && itemsByCategory[categoryId]?.length > 0) {
        const randomIndex = Math.floor(Math.random() * itemsByCategory[categoryId].length);
        finalOutfit[categoryId] = itemsByCategory[categoryId][randomIndex];
      }
    });

    console.log('AI Outfit Reasoning:', aiOutfit.reasoning);
    
    return finalOutfit;

  } catch (error) {
    console.error("Error generating AI outfit:", error);
    // Fall back to the original random generation
    return await generateOutfit(items, enabledCategories);
  }
}