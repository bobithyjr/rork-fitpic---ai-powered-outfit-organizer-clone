import React, { useState } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, TextInput, Alert } from "react-native";
import { Stack } from "expo-router";
import { Trash2, Edit3, Check, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { Outfit } from "@/types/clothing";
import OutfitModal from "./outfit-modal";

export default function FavoriteOutfitsScreen() {
  const { savedOutfits, removeSavedOutfit, renameOutfit } = useClosetStore();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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

  const handleRemoveOutfit = (outfitId: string) => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeSavedOutfit(outfitId) },
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
              onPress={() => handleRemoveOutfit(item.id)}
              style={styles.actionButton}
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
        }}
      />

      <FlatList
        data={savedOutfits}
        renderItem={renderOutfit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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