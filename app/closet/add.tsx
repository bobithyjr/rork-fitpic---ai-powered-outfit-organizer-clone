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
import { CLOTHING_CATEGORIES } from "@/constants/categories";

export default function AddItemScreen() {
  const router = useRouter();
  const { category: initialCategory } = useLocalSearchParams<{ category: string }>();
  const { addItem } = useClosetStore();

  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory || "shirts");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);

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
      const uri = result.assets[0].uri;
      setImageUri(uri);
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
      const uri = result.assets[0].uri;
      setImageUri(uri);
    }
  };

  const generateImageDescription = async (imageUri: string): Promise<string> => {
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);
      });

      // Call AI API with image
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert at identifying clothing items. Provide very short, basic descriptions of clothing items in images. Use 1-3 words maximum. Examples: "Blue Jeans", "Red Shirt", "Black Sneakers", "Leather Belt". Be concise and focus on the main item and its most obvious characteristic.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'What clothing item is this? Provide a very short description (1-3 words maximum).'
                },
                {
                  type: 'image',
                  image: base64
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('AI API request failed');
      }

      const result = await aiResponse.json();
      return result.completion.trim() || "Clothing Item";
    } catch (error) {
      console.error('Failed to generate image description:', error);
      // Fallback to category-based name
      return selectedCategory?.name.toLowerCase() || "item";
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryPicker(false);
  };

  const handleSave = async () => {
    if (!imageUri || !selectedCategoryId) {
      Alert.alert("Missing Information", "Please provide an image for your item.");
      return;
    }

    setIsLoading(true);
    
    try {
      let itemName = name.trim();
      
      // If no name provided, generate one using AI
      if (!itemName) {
        setIsGeneratingName(true);
        itemName = await generateImageDescription(imageUri);
        setIsGeneratingName(false);
      }
      
      // Add item to store with local image URI
      addItem({
        name: itemName,
        imageUri: imageUri,
        categoryId: selectedCategoryId,
      });
      
      router.back();
    } catch (error) {
      console.error("Failed to save item:", error);
      Alert.alert("Error", "Failed to save item. Please try again.");
    } finally {
      setIsLoading(false);
      setIsGeneratingName(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const canSave = imageUri && selectedCategoryId;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>ITEM NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={`ENTER ${selectedCategory?.name || "ITEM"} NAME (OPTIONAL)`}
          placeholderTextColor={Colors.darkGray}
        />
        <Text style={styles.helperText}>
          Leave blank to let AI generate a name from the image
        </Text>

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
        <Text style={styles.localInfo}>
          Images are stored locally on your device. Only your preferences and outfit data are synced to the cloud.
        </Text>
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
          style={[styles.button, styles.saveButton, !canSave && styles.disabledButton]}
          onPress={handleSave}
          disabled={!canSave || isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" />
              {isGeneratingName && (
                <Text style={styles.loadingText}>GENERATING NAME...</Text>
              )}
            </View>
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
  helperText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginBottom: 16,
    fontStyle: "italic",
  },
  localInfo: {
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
    marginBottom: 4,
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
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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