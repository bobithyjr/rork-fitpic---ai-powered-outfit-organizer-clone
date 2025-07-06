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
        set((state) => ({
          savedOutfits: state.savedOutfits.filter((outfit) => outfit.id !== id),
        }));
      },
      
      clearHistory: () => {
        set({ outfitHistory: [] });
      },
    }),
    {
      name: "closet-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);