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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Camera, X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

export default function AddItemScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();
  const { addItem } = useClosetStore();

  const [name, setName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedCategory = CLOTHING_CATEGORIES.find((c) => c.id === category);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      alert("Sorry, we need camera permissions to make this work!");
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
      alert("Sorry, we need camera roll permissions to make this work!");
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

  const handleSave = () => {
    if (!name.trim() || !imageUri || !category) {
      alert("Please provide a name and image for your item");
      return;
    }

    setIsLoading(true);
    
    // All data is stored locally - no server upload needed
    setTimeout(() => {
      addItem({
        name: name.trim(),
        imageUri,
        categoryId: category,
      });
      
      setIsLoading(false);
      router.back();
    }, 500);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={`Enter ${selectedCategory?.name || "item"} name`}
          placeholderTextColor={Colors.darkGray}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>
            {selectedCategory?.name || "Unknown"}
          </Text>
        </View>

        <Text style={styles.label}>Image</Text>
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
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.imagePickerButton} onPress={handlePickImage}>
              <Text style={styles.imagePickerText}>Choose from Library</Text>
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
            <Text style={styles.saveButtonText}>Save Item</Text>
          )}
        </Pressable>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  categoryContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
});