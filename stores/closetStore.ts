import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClothingItem, Outfit } from "@/types/clothing";

interface ClosetState {
  items: ClothingItem[];
  savedOutfits: Outfit[];
  outfitHistory: Outfit[];
  addItem: (item: Omit<ClothingItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  getItemsByCategory: (categoryId: string) => ClothingItem[];
  saveOutfit: (outfit: Omit<Outfit, "id" | "createdAt">) => void;
  addToHistory: (outfit: Omit<Outfit, "id" | "createdAt">) => void;
  removeSavedOutfit: (id: string) => void;
  renameOutfit: (id: string, name: string) => void;
  clearHistory: () => void;
}

export const useClosetStore = create<ClosetState>()(
  persist(
    (set, get) => ({
      items: [],
      savedOutfits: [],
      outfitHistory: [],
      
      addItem: (item) => {
        const newItem: ClothingItem = {
          ...item,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      getItemsByCategory: (categoryId) => {
        return get().items.filter((item) => item.categoryId === categoryId);
      },
      
      saveOutfit: (outfit) => {
        const newOutfit: Outfit = {
          ...outfit,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          savedOutfits: [...state.savedOutfits, newOutfit],
        }));
      },
      
      addToHistory: (outfit) => {
        const newOutfit: Outfit = {
          ...outfit,
          id: Date.now().toString(),
          createdAt: Date.now(),
        };
        set((state) => ({
          outfitHistory: [newOutfit, ...state.outfitHistory].slice(0, 50), // Keep last 50 outfits
        }));
      },
      
      removeSavedOutfit: (id) => {
        console.log('removeSavedOutfit called with ID:', id);
        set((state) => {
          console.log('Before filter - savedOutfits count:', state.savedOutfits.length);
          const filteredOutfits = state.savedOutfits.filter((outfit) => outfit.id !== id);
          console.log('After filter - savedOutfits count:', filteredOutfits.length);
          return {
            ...state,
            savedOutfits: filteredOutfits,
          };
        });
      },
      
      renameOutfit: (id, name) => {
        set((state) => ({
          savedOutfits: state.savedOutfits.map((outfit) =>
            outfit.id === id ? { ...outfit, name: name.trim() || undefined } : outfit
          ),
        }));
      },
      
      clearHistory: () => {
        set({ outfitHistory: [] });
      },
    }),
    {
      name: "closet-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Migrate old accessory categories to new single accessories category
          state.items = state.items.map((item: ClothingItem) => {
            if (item.categoryId === 'accessory1' || item.categoryId === 'accessory2') {
              return { ...item, categoryId: 'accessories' };
            }
            return item;
          });
          
          // Migrate outfit history
          state.outfitHistory = state.outfitHistory.map((outfit: Outfit) => ({
            ...outfit,
            items: Object.fromEntries(
              Object.entries(outfit.items).map(([key, item]: [string, ClothingItem | null]) => [
                key,
                item && (item.categoryId === 'accessory1' || item.categoryId === 'accessory2')
                  ? { ...item, categoryId: 'accessories' }
                  : item
              ])
            )
          }));
          
          // Migrate saved outfits
          state.savedOutfits = state.savedOutfits.map((outfit: Outfit) => ({
            ...outfit,
            items: Object.fromEntries(
              Object.entries(outfit.items).map(([key, item]: [string, ClothingItem | null]) => [
                key,
                item && (item.categoryId === 'accessory1' || item.categoryId === 'accessory2')
                  ? { ...item, categoryId: 'accessories' }
                  : item
              ])
            )
          }));
        }
      },
    }
  )
);