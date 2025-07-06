import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Camera, X, ChevronDown } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { useUserStore } from "@/stores/userStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import { uploadImageToCloud } from "@/utils/imageUpload";

export default function AddItemScreen() {
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams<{ category: string }>();
  const { addItem } = useClosetStore();
  const { userId, isCloudSyncEnabled } = useUserStore();

  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory || "shirts");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out categories that shouldn't be selectable for adding items
  const selectableCategories = CLOTHING_CATEGORIES.filter(
    (c) => !["all"].includes(c.id)
  );

  const selectedCategory = CLOTHING_CATEGORIES.find((c) => c.id === selectedCategoryId);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need camera permissions to take photos of your clothing items.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need photo library permissions to select images of your clothing items.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !imageUri || !selectedCategoryId) {
      Alert.alert("Missing Information", "Please provide a name and image for your item.");
      return;
    }

    setIsLoading(true);
    
    try {
      let finalImageUri = imageUri;
      
      // If cloud sync is enabled and we have a user ID, upload image to cloud
      if (isCloudSyncEnabled && userId) {
        try {
          console.log("Uploading image to cloud storage...");
          finalImageUri = await uploadImageToCloud(imageUri, userId);
          console.log("Image uploaded successfully:", finalImageUri);
        } catch (error) {
          console.error("Failed to upload image to cloud, using local URI:", error);
          // Continue with local URI if cloud upload fails
        }
      }
      
      // Add item to store
      addItem({
        name: name.trim(),
        imageUri: finalImageUri,
        categoryId: selectedCategoryId,
      });
      
      router.back();
    } catch (error) {
      console.error("Failed to save item:", error);
      Alert.alert("Error", "Failed to save item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>ITEM NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={`ENTER ${selectedCategory?.name || "ITEM"} NAME`}
          placeholderTextColor={Colors.darkGray}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <Pressable
          style={styles.categorySelector}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text style={styles.categoryText}>
            {selectedCategory?.name || "SELECT CATEGORY"}
          </Text>
          <ChevronDown size={20} color={Colors.darkGray} />
        </Pressable>

        <Text style={styles.label}>IMAGE</Text>
        {isCloudSyncEnabled && userId && (
          <Text style={styles.cloudInfo}>
            Images will be saved to your cloud storage for access across devices.
          </Text>
        )}
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              contentFit="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => setImageUri(null)}
            >
              <X size={20} color={Colors.error} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imagePickerContainer}>
            <Pressable style={styles.imagePickerButton} onPress={handleTakePhoto}>
              <Camera size={24} color={Colors.primary} />
              <Text style={styles.imagePickerText}>TAKE PHOTO</Text>
            </Pressable>
            <Pressable style={styles.imagePickerButton} onPress={handlePickImage}>
              <Text style={styles.imagePickerText}>CHOOSE FROM LIBRARY</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isLoading || !name || !imageUri}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE ITEM</Text>
          )}
        </Pressable>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </Pressable>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SELECT CATEGORY</Text>
            <ScrollView style={styles.categoryList}>
              {selectableCategories.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    selectedCategoryId === category.id && styles.selectedCategoryOption,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      selectedCategoryId === category.id && styles.selectedCategoryOptionText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  cloudInfo: {
    fontSize: 12,
    color: Colors.darkGray,
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  categorySelector: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 16,
    color: Colors.text,
  },
  imagePickerContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  imagePickerText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.error,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.darkGray,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  selectedCategoryOption: {
    backgroundColor: Colors.primary,
  },
  categoryOptionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
  selectedCategoryOptionText: {
    color: "white",
  },
});