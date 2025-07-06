import React from "react";
import { StyleSheet, View } from "react-native";
import { ClothingItem as ClothingItemType } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import ClothingItem from "./ClothingItem";
import EmptyClothingItem from "./EmptyClothingItem";

type Props = {
  outfit: Record<string, ClothingItemType | null>;
  onItemPress?: (categoryId: string) => void;
  enabledCategories: Record<string, boolean>;
};

export default function OutfitGrid({
  outfit,
  onItemPress,
  enabledCategories,
}: Props) {
  // Create a symmetric grid layout matching the image
  // Position mapping:
  // 0: empty, 1: hat, 2: empty
  // 3: accessory1, 4: shirt, 5: jacket
  // 6: accessory2, 7: pants, 8: belt
  // 9: empty, 10: shoes, 11: empty
  const grid = Array(12).fill(null);

  // Place items in their designated positions
  CLOTHING_CATEGORIES.forEach((category) => {
    if (enabledCategories[category.id] !== false && category.position >= 0) {
      grid[category.position] = {
        categoryId: category.id,
        item: outfit[category.id],
        name: category.name,
      };
    }
  });

  const renderGridItem = (cell: any, index: number) => {
    // Empty positions
    if (!cell) {
      return <View key={index} style={styles.cell} />;
    }

    return (
      <View key={index} style={styles.cell}>
        {cell.item ? (
          <ClothingItem
            item={cell.item}
            size="medium"
            onPress={() => onItemPress?.(cell.categoryId)}
          />
        ) : (
          <EmptyClothingItem
            categoryName={cell.name}
            size="medium"
            onPress={() => onItemPress?.(cell.categoryId)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {grid.map((cell, index) => renderGridItem(cell, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 360,
  },
  cell: {
    width: "33.33%",
    aspectRatio: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});