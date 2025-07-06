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
    return await generateOutfit(items, enabledCategories);
  } catch (error) {
    console.error("Error generating AI outfit:", error);
    throw error;
  }
}