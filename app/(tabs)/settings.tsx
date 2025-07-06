import React, { useState } from "react";
import { StyleSheet, View, Text, Switch, ScrollView, Pressable } from "react-native";
import { useSettingsStore } from "@/stores/settingsStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import Colors from "@/constants/colors";

export default function SettingsScreen() {
  const { enabledCategories, toggleCategory, resetToDefaults } = useSettingsStore();
  const [selectedTab, setSelectedTab] = useState<"preferences" | "about" | "privacy">("preferences");

  // Filter out required categories that shouldn't be toggleable
  const toggleableCategories = CLOTHING_CATEGORIES.filter(
    category => !["all", "shirts", "pants", "shoes", "belts"].includes(category.id)
  );

  const renderPreferences = () => (
    <ScrollView style={styles.tabContent}>
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

      <View style={styles.buttonContainer}>
        <Pressable style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetButtonText}>RESET TO DEFAULTS</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderAbout = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT FITPIC</Text>
        <Text style={styles.aboutText}>
          FITPIC IS YOUR PERSONAL AI STYLIST THAT HELPS YOU CREATE OUTFITS FROM YOUR OWN WARDROBE.
          SIMPLY ADD YOUR CLOTHING ITEMS TO YOUR VIRTUAL CLOSET, AND LET FITPIC SUGGEST STYLISH COMBINATIONS.
          ALL DATA IS STORED LOCALLY ON YOUR DEVICE - NO ACCOUNTS OR INTERNET REQUIRED.
        </Text>
        <Text style={styles.versionText}>VERSION 1.0.0</Text>
      </View>
    </ScrollView>
  );

  const renderPrivacy = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIVACY POLICY</Text>
        
        <Text style={styles.privacySubtitle}>DATA COLLECTION</Text>
        <Text style={styles.privacyText}>
          FITPIC COLLECTS AND STORES THE FOLLOWING INFORMATION LOCALLY ON YOUR DEVICE:
          {"\n"}• CLOTHING ITEM IMAGES YOU UPLOAD OR CAPTURE
          {"\n"}• CLOTHING ITEM NAMES AND CATEGORIES YOU ASSIGN
          {"\n"}• YOUR OUTFIT PREFERENCES AND SETTINGS
          {"\n"}• SAVED OUTFIT COMBINATIONS
          {"\n\n"}ALL DATA IS STORED EXCLUSIVELY ON YOUR DEVICE USING LOCAL STORAGE. NO INFORMATION IS TRANSMITTED TO EXTERNAL SERVERS OR THIRD PARTIES.
        </Text>

        <Text style={styles.privacySubtitle}>DATA USAGE</Text>
        <Text style={styles.privacyText}>
          YOUR DATA IS USED SOLELY TO:
          {"\n"}• DISPLAY YOUR VIRTUAL CLOSET
          {"\n"}• GENERATE OUTFIT SUGGESTIONS USING AI ALGORITHMS
          {"\n"}• REMEMBER YOUR PREFERENCES AND SETTINGS
          {"\n"}• SAVE YOUR FAVORITE OUTFIT COMBINATIONS
        </Text>

        <Text style={styles.privacySubtitle}>DATA SHARING</Text>
        <Text style={styles.privacyText}>
          FITPIC DOES NOT SHARE, SELL, OR TRANSMIT ANY OF YOUR PERSONAL DATA TO THIRD PARTIES. ALL PROCESSING OCCURS LOCALLY ON YOUR DEVICE.
        </Text>

        <Text style={styles.privacySubtitle}>CAMERA AND PHOTO LIBRARY ACCESS</Text>
        <Text style={styles.privacyText}>
          FITPIC REQUESTS ACCESS TO YOUR CAMERA AND PHOTO LIBRARY SOLELY TO ALLOW YOU TO ADD CLOTHING ITEMS TO YOUR VIRTUAL CLOSET. IMAGES ARE STORED LOCALLY AND NEVER UPLOADED OR SHARED.
        </Text>

        <Text style={styles.privacySubtitle}>DATA RETENTION</Text>
        <Text style={styles.privacyText}>
          YOUR DATA REMAINS ON YOUR DEVICE UNTIL YOU CHOOSE TO DELETE THE APP OR MANUALLY REMOVE ITEMS FROM YOUR CLOSET. UNINSTALLING THE APP WILL PERMANENTLY DELETE ALL YOUR DATA.
        </Text>

        <Text style={styles.privacySubtitle}>YOUR RIGHTS</Text>
        <Text style={styles.privacyText}>
          YOU HAVE COMPLETE CONTROL OVER YOUR DATA:
          {"\n"}• DELETE INDIVIDUAL CLOTHING ITEMS AT ANY TIME
          {"\n"}• RESET ALL PREFERENCES TO DEFAULTS
          {"\n"}• UNINSTALL THE APP TO REMOVE ALL DATA
        </Text>

        <Text style={styles.privacySubtitle}>CONTACT INFORMATION</Text>
        <Text style={styles.privacyText}>
          IF YOU HAVE QUESTIONS ABOUT THIS PRIVACY POLICY OR THE APP, PLEASE CONTACT US:
          {"\n\n"}EMAIL: ILOVEYOUMRBUBZ@GMAIL.COM
          {"\n"}PHONE: 512-994-9512
        </Text>

        <Text style={styles.privacySubtitle}>POLICY UPDATES</Text>
        <Text style={styles.privacyText}>
          THIS PRIVACY POLICY MAY BE UPDATED OCCASIONALLY. CONTINUED USE OF THE APP CONSTITUTES ACCEPTANCE OF ANY CHANGES.
          {"\n\n"}LAST UPDATED: JANUARY 2025
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, selectedTab === "preferences" && styles.activeTab]}
          onPress={() => setSelectedTab("preferences")}
        >
          <Text style={[styles.tabText, selectedTab === "preferences" && styles.activeTabText]}>
            PREFERENCES
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === "about" && styles.activeTab]}
          onPress={() => setSelectedTab("about")}
        >
          <Text style={[styles.tabText, selectedTab === "about" && styles.activeTabText]}>
            ABOUT
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, selectedTab === "privacy" && styles.activeTab]}
          onPress={() => setSelectedTab("privacy")}
        >
          <Text style={[styles.tabText, selectedTab === "privacy" && styles.activeTabText]}>
            PRIVACY
          </Text>
        </Pressable>
      </View>

      {selectedTab === "preferences" && renderPreferences()}
      {selectedTab === "about" && renderAbout()}
      {selectedTab === "privacy" && renderPrivacy()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.lightGray,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.darkGray,
  },
  activeTabText: {
    color: "white",
  },
  tabContent: {
    flex: 1,
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
  privacySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
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