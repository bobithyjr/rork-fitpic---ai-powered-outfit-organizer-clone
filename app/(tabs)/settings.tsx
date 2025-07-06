import React from "react";
import { StyleSheet, View, Text, Switch, ScrollView, Pressable } from "react-native";
import { useSettingsStore } from "@/stores/settingsStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const { enabledCategories, toggleCategory, resetToDefaults } = useSettingsStore();

  // Filter out required categories that shouldn't be toggleable
  const toggleableCategories = CLOTHING_CATEGORIES.filter(
    category => !["all", "shirts", "pants", "shoes", "belts"].includes(category.id)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OUTFIT PREFERENCES</Text>
        <Text style={styles.sectionDescription}>
          CHOOSE WHICH CLOTHING CATEGORIES TO INCLUDE IN YOUR OUTFIT SUGGESTIONS
        </Text>

        {toggleableCategories.map((category) => (
          <View key={category.id} style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>{category.name}</Text>
              {category.optional && (
                <Text style={styles.optionalLabel}>OPTIONAL</Text>
              )}
            </View>
            <Switch
              value={enabledCategories[category.id] !== false}
              onValueChange={() => toggleCategory(category.id)}
              trackColor={{ false: Colors.mediumGray, true: Colors.primary }}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT FITPIC</Text>
        <Text style={styles.aboutText}>
          FITPIC IS YOUR PERSONAL AI STYLIST THAT HELPS YOU CREATE OUTFITS FROM YOUR OWN WARDROBE.
          SIMPLY ADD YOUR CLOTHING ITEMS TO YOUR VIRTUAL CLOSET, AND LET FITPIC SUGGEST STYLISH COMBINATIONS.
          ALL DATA IS STORED LOCALLY ON YOUR DEVICE - NO ACCOUNTS OR INTERNET REQUIRED.
        </Text>
        <Text style={styles.versionText}>VERSION 1.0.0</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>RESET TO DEFAULTS</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  optionalLabel: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 2,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: "center",
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
  },
  resetButton: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.error,
  },
  resetButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "500",
  },
});