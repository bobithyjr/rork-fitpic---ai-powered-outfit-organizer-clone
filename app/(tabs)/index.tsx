import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Shuffle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { generateAIOutfit } from "@/utils/outfitGenerator";
import OutfitGrid from "@/components/OutfitGrid";
import { ClothingItem } from "@/types/clothing";

export default function HomeScreen() {
  const router = useRouter();
  const { items, saveOutfit, addToHistory, outfitHistory } = useClosetStore();
  const { enabledCategories } = useSettingsStore();
  const [currentOutfit, setCurrentOutfit] = useState<Record<string, ClothingItem | null>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState("");

  const handleGenerateOutfit = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsGenerating(true);
    try {
      // Pass outfit history and theme to ensure variety
      const outfit = await generateAIOutfit(items, enabledCategories, outfitHistory, theme.trim());
      setCurrentOutfit(outfit);
      
      // Add to history automatically when outfit is generated
      addToHistory({ items: outfit });
    } catch (error) {
      console.error("Failed to generate outfit:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveOutfit = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    saveOutfit({ items: currentOutfit });
  };

  const handleOutfitHistory = () => {
    router.push("/outfit-history");
  };

  const handleFavoriteOutfits = () => {
    router.push("/favorite-outfits");
  };

  const handleItemPress = (categoryId: string) => {
    // Map accessories to the accessories category for closet navigation
    const targetCategory = categoryId === "accessories" 
      ? "accessories" 
      : categoryId;
    router.push(`/closet/category/${targetCategory}`);
  };

  const hasItems = items.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.outfitContainer}>
        {!hasItems ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              ADD CLOTHES TO GET STARTED
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/closet")}
            >
              <Text style={styles.addButtonText}>GO TO CLOSET</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.themeContainer}>
              <TextInput
                style={styles.themeInput}
                placeholder="TYPE THEME HERE"
                placeholderTextColor={Colors.darkGray}
                value={theme}
                onChangeText={setTheme}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>
            <OutfitGrid
              outfit={currentOutfit}
              onItemPress={handleItemPress}
              enabledCategories={enabledCategories}
            />
          </>
        )}
      </View>

      <View style={styles.actionContainer}>
        <Pressable
          style={[styles.generateButton, !hasItems && styles.disabledButton]}
          onPress={handleGenerateOutfit}
          disabled={!hasItems || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Shuffle size={20} color="white" />
              <Text style={styles.generateButtonText}>PICK MY FIT</Text>
            </>
          )}
        </Pressable>

        {Object.keys(currentOutfit).length > 0 && (
          <View style={styles.buttonRow}>
            <Pressable style={styles.actionButton} onPress={handleOutfitHistory}>
              <Text style={styles.actionButtonText}>HISTORY</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={handleSaveOutfit}>
              <Text style={styles.actionButtonText}>SAVE OUTFIT</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton} onPress={handleFavoriteOutfits}>
              <Text style={styles.actionButtonText}>FAVORITES</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  outfitContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 20,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  actionContainer: {
    padding: 24,
    gap: 12,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  generateButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  themeContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  themeInput: {
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: "center",
  },
});