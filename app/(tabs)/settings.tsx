import React, { useState } from "react";
import { StyleSheet, View, Text, Switch, ScrollView, Pressable, Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUserStore } from "@/stores/userStore";
import { useClosetStore } from "@/stores/closetStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import Colors from "@/constants/colors";
import { trpcClient } from "@/lib/trpc";

export default function SettingsScreen() {
  const { enabledCategories, toggleCategory, resetToDefaults } = useSettingsStore();
  const { 
    isCloudSyncEnabled, 
    toggleCloudSync, 
    userId, 
    userEmail,
    appleUserId,
    isAuthenticated,
    lastSyncTime,
    signInWithApple,
    signOut
  } = useUserStore();
  const { syncToCloud, loadFromCloud, isLoading } = useClosetStore();
  const [selectedTab, setSelectedTab] = useState<"preferences" | "about" | "privacy">("preferences");

  // Filter out required categories that shouldn't be toggleable
  const toggleableCategories = CLOTHING_CATEGORIES.filter(
    category => !["all", "shirts", "pants", "shoes", "belts"].includes(category.id)
  );

  const handleDeleteCloudData = async () => {
    Alert.alert(
      "Delete Cloud Data",
      "This will permanently delete all your closet data from the cloud. Your local data will remain unchanged. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (userId) {
                await trpcClient.closet.deleteUserData.mutate({ userId });
                Alert.alert("Success", "Your cloud data has been deleted.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete cloud data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      await syncToCloud();
      Alert.alert("Success", "Your data has been synced to the cloud.");
    } catch (error) {
      Alert.alert("Error", "Failed to sync data. Please try again.");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      Alert.alert("Success", "You have been signed in with Apple ID. Your data will now be synced using your Apple ID.");
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert("Error", "Failed to sign in with Apple. Please try again.");
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "This will sign you out and stop syncing your data with your Apple ID. Your local data will remain unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut();
            Alert.alert("Success", "You have been signed out.");
          },
        },
      ]
    );
  };

  const renderPreferences = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CLOUD SYNC</Text>
        <Text style={styles.sectionDescription}>
          SYNC YOUR CLOSET DATA ACROSS DEVICES USING YOUR APPLE ID OR DEVICE ID
        </Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Cloud Sync</Text>
            <Text style={styles.optionalLabel}>
              {isCloudSyncEnabled ? 'ENABLED' : 'DISABLED'}
            </Text>
          </View>
          <Switch
            value={isCloudSyncEnabled}
            onValueChange={toggleCloudSync}
            trackColor={{ false: Colors.mediumGray, true: Colors.primary }}
          />
        </View>
        
        {isCloudSyncEnabled && (
          <>
            {Platform.OS === 'ios' && !appleUserId && (
              <View style={styles.appleSignInContainer}>
                <Text style={styles.appleSignInDescription}>
                  Sign in with Apple ID for secure cloud sync that persists even if you uninstall the app.
                </Text>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleSignInButton}
                  onPress={handleAppleSignIn}
                />
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Type:</Text>
              <Text style={styles.infoValue}>
                {appleUserId ? 'Apple ID' : 'Device ID'}
              </Text>
            </View>
            
            {appleUserId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Apple ID:</Text>
                <Text style={styles.infoValue}>
                  {userEmail || 'Private Email'}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>{userId?.slice(-8) || 'Not set'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Sync:</Text>
              <Text style={styles.infoValue}>
                {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
              </Text>
            </View>
            
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.syncButton, isLoading && styles.disabledButton]} 
                onPress={handleManualSync}
                disabled={isLoading}
              >
                <Text style={styles.syncButtonText}>
                  {isLoading ? 'SYNCING...' : 'SYNC NOW'}
                </Text>
              </Pressable>
              
              <Pressable style={styles.deleteCloudButton} onPress={handleDeleteCloudData}>
                <Text style={styles.deleteCloudButtonText}>DELETE CLOUD DATA</Text>
              </Pressable>
            </View>
            
            {appleUserId && (
              <View style={styles.signOutContainer}>
                <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                  <Text style={styles.signOutButtonText}>SIGN OUT OF APPLE ID</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
      
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
          YOUR DATA IS STORED LOCALLY AND OPTIONALLY SYNCED TO THE CLOUD USING YOUR APPLE ID OR DEVICE ID FOR SEAMLESS ACCESS ACROSS DEVICES.
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
          FITPIC COLLECTS AND STORES THE FOLLOWING INFORMATION:
          {"\n"}• CLOTHING ITEM IMAGES YOU UPLOAD OR CAPTURE
          {"\n"}• CLOTHING ITEM NAMES AND CATEGORIES YOU ASSIGN
          {"\n"}• YOUR OUTFIT PREFERENCES AND CATEGORY SETTINGS
          {"\n"}• SAVED FAVORITE OUTFIT COMBINATIONS
          {"\n"}• OUTFIT GENERATION HISTORY (UP TO 50 RECENT OUTFITS)
          {"\n"}• CUSTOM NAMES FOR YOUR FAVORITE OUTFITS
          {"\n"}• YOUR APPLE ID (WHEN YOU SIGN IN WITH APPLE)
          {"\n"}• YOUR EMAIL ADDRESS (WHEN PROVIDED BY APPLE SIGN-IN)
          {"\n"}• A UNIQUE DEVICE IDENTIFIER FOR CLOUD SYNC (WHEN NOT USING APPLE ID)
          {"\n\n"}DATA IS STORED LOCALLY ON YOUR DEVICE AND OPTIONALLY SYNCED TO OUR SECURE CLOUD SERVERS WHEN CLOUD SYNC IS ENABLED.
        </Text>

        <Text style={styles.privacySubtitle}>DATA USAGE</Text>
        <Text style={styles.privacyText}>
          YOUR DATA IS USED SOLELY TO:
          {"\n"}• DISPLAY YOUR VIRTUAL CLOSET AND CLOTHING ITEMS
          {"\n"}• GENERATE OUTFIT SUGGESTIONS USING LOCAL ALGORITHMS
          {"\n"}• REMEMBER YOUR CATEGORY PREFERENCES AND APP SETTINGS
          {"\n"}• SAVE AND MANAGE YOUR FAVORITE OUTFIT COMBINATIONS
          {"\n"}• MAINTAIN A HISTORY OF GENERATED OUTFITS
          {"\n"}• ALLOW RENAMING AND ORGANIZING OF YOUR SAVED OUTFITS
          {"\n"}• SYNC YOUR DATA ACROSS DEVICES WHEN CLOUD SYNC IS ENABLED
          {"\n"}• RESTORE YOUR DATA IF YOU REINSTALL THE APP (WHEN CLOUD SYNC IS ENABLED)
        </Text>

        <Text style={styles.privacySubtitle}>CLOUD SYNC & DATA SHARING</Text>
        <Text style={styles.privacyText}>
          WHEN CLOUD SYNC IS ENABLED:
          {"\n"}• YOUR CLOSET DATA IS SECURELY TRANSMITTED TO AND STORED ON OUR SERVERS
          {"\n"}• DATA IS ASSOCIATED WITH YOUR APPLE ID (PREFERRED) OR DEVICE IDENTIFIER
          {"\n"}• APPLE ID AUTHENTICATION ALLOWS DATA RECOVERY EVEN AFTER APP REINSTALLATION
          {"\n"}• YOUR DATA IS ENCRYPTED IN TRANSIT AND AT REST
          {"\n"}• WE DO NOT SHARE, SELL, OR PROVIDE YOUR DATA TO THIRD PARTIES
          {"\n"}• YOU CAN DISABLE CLOUD SYNC AT ANY TIME IN SETTINGS
          {"\n"}• YOU CAN DELETE YOUR CLOUD DATA AT ANY TIME
          {"\n"}• YOU CAN SIGN OUT OF APPLE ID TO STOP APPLE ID-BASED SYNC
          {"\n\n"}WHEN CLOUD SYNC IS DISABLED, ALL DATA REMAINS EXCLUSIVELY ON YOUR DEVICE.
        </Text>

        <Text style={styles.privacySubtitle}>DEVICE PERMISSIONS</Text>
        <Text style={styles.privacyText}>
          FITPIC REQUESTS THE FOLLOWING DEVICE PERMISSIONS:
          {"\n"}• CAMERA ACCESS: TO TAKE PHOTOS OF CLOTHING ITEMS
          {"\n"}• PHOTO LIBRARY ACCESS: TO SELECT EXISTING IMAGES OF CLOTHING
          {"\n"}• HAPTIC FEEDBACK (MOBILE ONLY): TO PROVIDE TACTILE FEEDBACK WHEN GENERATING OUTFITS
          {"\n\n"}ALL IMAGES ARE STORED LOCALLY ON YOUR DEVICE AND NEVER UPLOADED, SHARED, OR TRANSMITTED TO ANY EXTERNAL SERVICES.
        </Text>

        <Text style={styles.privacySubtitle}>DATA RETENTION</Text>
        <Text style={styles.privacyText}>
          LOCAL DATA REMAINS ON YOUR DEVICE UNTIL YOU:
          {"\n"}• DELETE INDIVIDUAL CLOTHING ITEMS FROM YOUR CLOSET
          {"\n"}• DELETE INDIVIDUAL FAVORITE OUTFITS
          {"\n"}• CLEAR YOUR OUTFIT HISTORY
          {"\n"}• RESET YOUR PREFERENCES TO DEFAULTS
          {"\n"}• UNINSTALL THE APP
          {"\n\n"}CLOUD DATA (WHEN SYNC IS ENABLED):
          {"\n"}• PERSISTS EVEN IF YOU UNINSTALL THE APP (ESPECIALLY WITH APPLE ID)
          {"\n"}• ALLOWS DATA RECOVERY WHEN YOU REINSTALL AND SIGN IN AGAIN
          {"\n"}• CAN BE MANUALLY DELETED FROM SETTINGS
          {"\n"}• IS AUTOMATICALLY DELETED IF INACTIVE FOR 2 YEARS
          {"\n"}• APPLE ID-BASED DATA IS MORE PERSISTENT THAN DEVICE ID-BASED DATA
          {"\n\n"}OUTFIT HISTORY IS LIMITED TO 50 RECENT OUTFITS TO MANAGE STORAGE.
        </Text>

        <Text style={styles.privacySubtitle}>YOUR RIGHTS</Text>
        <Text style={styles.privacyText}>
          YOU HAVE COMPLETE CONTROL OVER YOUR DATA:
          {"\n"}• ENABLE OR DISABLE CLOUD SYNC AT ANY TIME
          {"\n"}• DELETE YOUR CLOUD DATA WHILE KEEPING LOCAL DATA
          {"\n"}• DELETE INDIVIDUAL CLOTHING ITEMS AT ANY TIME
          {"\n"}• DELETE INDIVIDUAL FAVORITE OUTFITS
          {"\n"}• RENAME YOUR FAVORITE OUTFITS
          {"\n"}• CLEAR YOUR ENTIRE OUTFIT HISTORY
          {"\n"}• TOGGLE CLOTHING CATEGORIES ON/OFF FOR OUTFIT GENERATION
          {"\n"}• RESET ALL PREFERENCES TO DEFAULTS
          {"\n"}• REQUEST COMPLETE DATA DELETION BY CONTACTING US
        </Text>

        <Text style={styles.privacySubtitle}>CONTACT INFORMATION</Text>
        <Text style={styles.privacyText}>
          IF YOU HAVE QUESTIONS ABOUT THIS PRIVACY POLICY OR THE APP, PLEASE CONTACT US:
          {"\n\n"}EMAIL: ILOVEYOUMRBUBZ@GMAIL.COM
          {"\n"}PHONE: 512-994-9512
        </Text>

        <Text style={styles.privacySubtitle}>POLICY UPDATES</Text>
        <Text style={styles.privacyText}>
          THIS PRIVACY POLICY MAY BE UPDATED OCCASIONALLY TO REFLECT CHANGES IN APP FUNCTIONALITY OR LEGAL REQUIREMENTS. CONTINUED USE OF THE APP CONSTITUTES ACCEPTANCE OF ANY CHANGES.
          {"\n\n"}LAST UPDATED: JANUARY 15, 2025
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  syncButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  syncButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteCloudButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteCloudButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});