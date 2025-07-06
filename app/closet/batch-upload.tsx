import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Upload, X, Check, Edit3, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useClosetStore } from "@/stores/closetStore";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

interface BatchItem {
  id: string;
  imageUri: string;
  name: string;
  categoryId: string;
  isProcessing: boolean;
  isEditing: boolean;
}

export default function BatchUploadScreen() {
  const router = useRouter();
  const { addItem } = useClosetStore();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectableCategories = CLOTHING_CATEGORIES.filter(
    (c) => !["all"].includes(c.id)
  );

  const handleSelectImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need photo library permissions to select images of your clothing items.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 20, // Reasonable limit for batch processing
    });

    if (!result.canceled && result.assets) {
      const newItems: BatchItem[] = result.assets.map((asset, index) => ({
        id: `batch_${Date.now()}_${index}`,
        imageUri: asset.uri,
        name: "",
        categoryId: "shirts", // Default category
        isProcessing: true,
        isEditing: false,
      }));

      setItems(newItems);
      processImagesWithAI(newItems);
    }
  };

  const processImagesWithAI = async (itemsToProcess: BatchItem[]) => {
    setIsProcessing(true);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      
      try {
        // Convert image to base64
        const response = await fetch(item.imageUri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(blob);
        });

        // Call AI API for categorization and naming
        const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are an expert at identifying and categorizing clothing items. Analyze the image and return a JSON response with the clothing category and a very short name.

Available categories: ${selectableCategories.map(c => c.id).join(', ')}

Return ONLY a JSON object in this exact format:
{
  "category": "category_id",
  "name": "Short Name"
}

Category guidelines:
- hats: any headwear (caps, beanies, hats)
- shirts: t-shirts, button-ups, blouses, tops, sweaters
- jackets: coats, blazers, hoodies, cardigans, outerwear
- accessories: jewelry, watches, bags, scarves, ties
- pants: jeans, trousers, shorts, leggings, skirts
- belts: any type of belt
- shoes: sneakers, boots, sandals, heels, any footwear

Name guidelines:
- Use 1-3 words maximum
- Include color if obvious (Blue Jeans, Red Shirt)
- Be descriptive but concise (Black Sneakers, Denim Jacket)
- Focus on the main characteristics`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Categorize this clothing item and give it a short name.'
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

        if (aiResponse.ok) {
          const result = await aiResponse.json();
          
          try {
            // Try to extract JSON from the completion
            const completion = result.completion;
            const jsonMatch = completion.match(/\{[\s\S]*\}/);
            let aiData;
            
            if (jsonMatch) {
              aiData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in AI response');
            }

            // Validate category exists
            const validCategory = selectableCategories.find(c => c.id === aiData.category);
            const finalCategory = validCategory ? aiData.category : 'shirts';
            const finalName = aiData.name || 'Clothing Item';

            // Update the item
            setItems(prevItems => 
              prevItems.map(prevItem => 
                prevItem.id === item.id 
                  ? { 
                      ...prevItem, 
                      name: finalName,
                      categoryId: finalCategory,
                      isProcessing: false 
                    }
                  : prevItem
              )
            );

          } catch (parseError) {
            console.error('Failed to parse AI response for item:', item.id, parseError);
            // Fallback to default values
            setItems(prevItems => 
              prevItems.map(prevItem => 
                prevItem.id === item.id 
                  ? { 
                      ...prevItem, 
                      name: 'Clothing Item',
                      categoryId: 'shirts',
                      isProcessing: false 
                    }
                  : prevItem
              )
            );
          }
        } else {
          throw new Error('AI API request failed');
        }

      } catch (error) {
        console.error('Failed to process image with AI:', error);
        // Fallback to default values
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id 
              ? { 
                  ...prevItem, 
                  name: 'Clothing Item',
                  categoryId: 'shirts',
                  isProcessing: false 
                }
              : prevItem
          )
        );
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleEditItem = (itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, isEditing: true }
          : { ...item, isEditing: false }
      )
    );
  };

  const handleSaveEdit = (itemId: string, newName: string, newCategory: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, name: newName, categoryId: newCategory, isEditing: false }
          : item
      )
    );
  };

  const handleCancelEdit = (itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, isEditing: false }
          : item
      )
    );
  };

  const handleSaveAll = async () => {
    const validItems = items.filter(item => !item.isProcessing && item.name.trim());
    
    if (validItems.length === 0) {
      Alert.alert("No Items", "No valid items to save. Please wait for processing to complete or add some items.");
      return;
    }

    setIsSaving(true);

    try {
      // Add all items to the closet
      for (const item of validItems) {
        addItem({
          name: item.name.trim(),
          imageUri: item.imageUri,
          categoryId: item.categoryId,
        });
      }

      Alert.alert(
        "Success", 
        `Successfully added ${validItems.length} items to your closet!`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Failed to save items:", error);
      Alert.alert("Error", "Failed to save some items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (items.length > 0) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard all selected items?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const processingCount = items.filter(item => item.isProcessing).length;
  const readyCount = items.filter(item => !item.isProcessing).length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "BATCH UPLOAD",
          headerLeft: () => (
            <Pressable onPress={handleCancel} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>CANCEL</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Upload size={48} color={Colors.darkGray} />
            <Text style={styles.emptyTitle}>BATCH UPLOAD CLOTHING</Text>
            <Text style={styles.emptyDescription}>
              Select multiple images from your photo library. AI will automatically categorize and name each item for you.
            </Text>
            <Pressable style={styles.selectButton} onPress={handleSelectImages}>
              <Text style={styles.selectButtonText}>SELECT IMAGES</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>
                {processingCount > 0 
                  ? `Processing ${processingCount} items...`
                  : `${readyCount} items ready`
                }
              </Text>
              {processingCount === 0 && (
                <Pressable style={styles.addMoreButton} onPress={handleSelectImages}>
                  <Text style={styles.addMoreText}>ADD MORE</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.itemsList}>
              {items.map((item) => (
                <BatchItemCard
                  key={item.id}
                  item={item}
                  categories={selectableCategories}
                  onRemove={() => handleRemoveItem(item.id)}
                  onEdit={() => handleEditItem(item.id)}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={() => handleCancelEdit(item.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.saveAllButton,
              (processingCount > 0 || isSaving) && styles.disabledButton
            ]}
            onPress={handleSaveAll}
            disabled={processingCount > 0 || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveAllButtonText}>
                SAVE ALL ({readyCount})
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

interface BatchItemCardProps {
  item: BatchItem;
  categories: typeof CLOTHING_CATEGORIES;
  onRemove: () => void;
  onEdit: () => void;
  onSaveEdit: (itemId: string, name: string, category: string) => void;
  onCancelEdit: () => void;
}

function BatchItemCard({ 
  item, 
  categories, 
  onRemove, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit 
}: BatchItemCardProps) {
  const [editName, setEditName] = useState(item.name);
  const [editCategory, setEditCategory] = useState(item.categoryId);

  const handleSave = () => {
    onSaveEdit(item.id, editName, editCategory);
  };

  const selectedCategory = categories.find(c => c.id === item.categoryId);

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.imageUri }} style={styles.itemImage} contentFit="cover" />
      
      <View style={styles.itemContent}>
        {item.isProcessing ? (
          <View style={styles.processingState}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.processingText}>Analyzing...</Text>
          </View>
        ) : item.isEditing ? (
          <View style={styles.editingState}>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Item name"
              placeholderTextColor={Colors.darkGray}
            />
            <View style={styles.categorySelector}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      editCategory === category.id && styles.selectedCategoryChip
                    ]}
                    onPress={() => setEditCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        editCategory === category.id && styles.selectedCategoryChipText
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.editActions}>
              <Pressable onPress={handleSave} style={styles.saveEditButton}>
                <Check size={16} color={Colors.success} />
              </Pressable>
              <Pressable onPress={onCancelEdit} style={styles.cancelEditButton}>
                <X size={16} color={Colors.darkGray} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{selectedCategory?.name}</Text>
          </View>
        )}
      </View>

      {!item.isProcessing && !item.isEditing && (
        <View style={styles.itemActions}>
          <Pressable onPress={onEdit} style={styles.actionButton}>
            <Edit3 size={16} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={onRemove} style={styles.actionButton}>
            <Trash2 size={16} color={Colors.error} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  addMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addMoreText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  itemsList: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.mediumGray,
  },
  itemContent: {
    flex: 1,
  },
  processingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processingText: {
    fontSize: 14,
    color: Colors.darkGray,
    fontStyle: "italic",
  },
  editingState: {
    gap: 8,
  },
  editInput: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
  },
  categorySelector: {
    gap: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: Colors.darkGray,
    fontWeight: "500",
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    marginRight: 6,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: "500",
  },
  selectedCategoryChipText: {
    color: "white",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
  },
  saveEditButton: {
    padding: 6,
  },
  cancelEditButton: {
    padding: 6,
  },
  itemInfo: {
    gap: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  itemCategory: {
    fontSize: 12,
    color: Colors.darkGray,
    textTransform: "uppercase",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  saveAllButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveAllButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: Colors.darkGray,
  },
});