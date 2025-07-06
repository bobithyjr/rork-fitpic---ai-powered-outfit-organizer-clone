import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import CategorySelector from "@/components/CategorySelector";
import ClothingItem from "@/components/ClothingItem";
import EmptyClothingItem from "@/components/EmptyClothingItem";
import { CLOSET_CATEGORIES } from "@/constants/categories";

export default function ClosetScreen() {
  const router = useRouter();
  const { items, removeItem } = useClosetStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>("all");

  const getFilteredItems = () => {
    if (selectedCategory === "all") {
      return items;
    } else if (selectedCategory === "accessories") {
      return items.filter((item) => 
        item.categoryId === "accessories"
      );
    } else {
      return items.filter((item) => item.categoryId === selectedCategory);
    }
  };

  const filteredItems = getFilteredItems();

  const handleAddItem = () => {
    let targetCategory = selectedCategory === "all" ? "shirts" : selectedCategory;
    if (selectedCategory === "accessories") {
      targetCategory = "accessories";
    }
    
    router.push({
      pathname: "/closet/add",
      params: { category: targetCategory },
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleItemPress = (itemId: string) => {
    console.log("Item pressed:", itemId);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.id === "add") {
      return (
        <View style={styles.itemContainer}>
          <EmptyClothingItem
            categoryName={`ADD ${
              selectedCategory === "all"
                ? "ITEM"
                : selectedCategory === "accessories"
                ? "ACCESSORY"
                : CLOSET_CATEGORIES.find((c) => c.id === selectedCategory)?.name || "ITEM"
            }`}
            onPress={handleAddItem}
          />
        </View>
      );
    }
    return (
      <View style={styles.itemContainer}>
        <ClothingItem
          item={item}
          onPress={() => handleItemPress(item.id)}
          onRemove={() => handleRemoveItem(item.id)}
          showRemoveButton
        />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {selectedCategory === "all" ? "NO ITEMS IN YOUR CLOSET YET." : "NO ITEMS IN THIS CATEGORY YET."}
      </Text>
      <Pressable style={styles.emptyAddButton} onPress={handleAddItem}>
        <Text style={styles.emptyAddButtonText}>ADD ITEM</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <CategorySelector
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <View style={styles.contentContainer}>
        {filteredItems.length === 0 && selectedCategory === "all" ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={selectedCategory === "all" ? filteredItems : [{ id: "add" }, ...filteredItems]}
            renderItem={renderItem}
            keyExtractor={(item) => (item.id === "add" ? "add" : item.id)}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              selectedCategory !== "all" ? (
                <View style={styles.categoryEmptyState}>
                  <Text style={styles.emptyStateText}>
                    NO ITEMS IN THIS CATEGORY YET.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      <Pressable style={styles.fab} onPress={handleAddItem}>
        <Plus size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  categoryEmptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});