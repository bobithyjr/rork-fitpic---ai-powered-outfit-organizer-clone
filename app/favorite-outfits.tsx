import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, TextInput, Alert, Platform } from "react-native";
import { Stack } from "expo-router";
import { Trash2, Edit3, Check, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { Outfit } from "@/types/clothing";
import OutfitModal from "./outfit-modal";

export default function FavoriteOutfitsScreen() {
  const store = useClosetStore();
  const { savedOutfits, removeSavedOutfit, renameOutfit } = store;
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  
  console.log('FavoriteOutfitsScreen render - savedOutfits count:', savedOutfits.length);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOutfitDisplayName = (outfit: Outfit) => {
    return outfit.name || formatDate(outfit.createdAt);
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      "Clear All Favorites",
      "Are you sure you want to delete all favorite outfits?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: () => {
            savedOutfits.forEach(outfit => {
              removeSavedOutfit(outfit.id);
            });
            setRefreshKey(prev => prev + 1);
          }
        },
      ]
    );
  };

  const handleRemoveOutfit = (outfitId: string) => {
    console.log('handleRemoveOutfit called with ID:', outfitId);
    
    const performDelete = () => {
      console.log('performDelete called - Deleting outfit with ID:', outfitId);
      console.log('Current outfits before delete:', savedOutfits.length);
      removeSavedOutfit(outfitId);
      console.log('Delete function completed');
      // Force a re-render
      setRefreshKey(prev => prev + 1);
    };

    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: performDelete
        },
      ]
    );
  };

  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOutfit(null);
  };

  const handleStartEditing = (outfit: Outfit) => {
    setEditingId(outfit.id);
    setEditingName(outfit.name || "");
  };

  const handleSaveEdit = () => {
    if (editingId) {
      renameOutfit(editingId, editingName);
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <View style={styles.outfitCard}>
      <Pressable
        onPress={() => handleViewOutfit(item)}
        style={styles.outfitButton}
      >
        {editingId === item.id ? (
          <TextInput
            style={styles.editInput}
            value={editingName}
            onChangeText={setEditingName}
            placeholder="Enter outfit name"
            placeholderTextColor={Colors.darkGray}
            autoFocus
            onSubmitEditing={handleSaveEdit}
          />
        ) : (
          <View>
            <Text style={styles.outfitName}>{getOutfitDisplayName(item)}</Text>
            {item.name && (
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            )}
          </View>
        )}
      </Pressable>
      
      <View style={styles.actionButtons}>
        {editingId === item.id ? (
          <>
            <Pressable onPress={handleSaveEdit} style={styles.actionButton}>
              <Check size={18} color={Colors.success} />
            </Pressable>
            <Pressable onPress={handleCancelEdit} style={styles.actionButton}>
              <X size={18} color={Colors.darkGray} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={() => handleStartEditing(item)}
              style={styles.actionButton}
            >
              <Edit3 size={18} color={Colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => {
                console.log('Delete button pressed for item:', item.id);
                handleRemoveOutfit(item.id);
              }}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color={Colors.error} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "FAVORITE OUTFITS",
          headerRight: () => (
            <Pressable onPress={handleClearAllFavorites} style={styles.clearButton}>
              <Trash2 size={20} color={Colors.error} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={savedOutfits}
        renderItem={renderOutfit}
        keyExtractor={(item) => `${item.id}-${refreshKey}`}
        contentContainerStyle={styles.listContent}
        extraData={refreshKey}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              NO FAVORITE OUTFITS YET.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              SAVE SOME OUTFITS TO SEE THEM HERE!
            </Text>
          </View>
        }
      />

      <OutfitModal
        visible={modalVisible}
        outfit={selectedOutfit}
        onClose={handleCloseModal}
        title="FAVORITE OUTFIT"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  outfitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  outfitButton: {
    flex: 1,
    padding: 20,
  },
  outfitName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  editInput: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.darkGray,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: "center",
  },
});