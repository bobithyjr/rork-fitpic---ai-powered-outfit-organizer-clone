import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClothingItem, Outfit } from "@/types/clothing";

interface ClosetState {
  items: ClothingItem[];
  outfits: Outfit[];
  addItem: (item: Omit<ClothingItem, "id" | "createdAt">) => void;
  removeItem: (id: string) => void;
  getItemsByCategory: (categoryId: string) => ClothingItem[];
  saveOutfit: (outfit: Omit<Outfit, "id" | "createdAt">) => void;
  removeOutfit: (id: string) => void;
}

export const useClosetStore = create<ClosetState>()(
  persist(
    (set, get) => ({
      items: [],
      outfits: [],
      
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
          outfits: [...state.outfits, newOutfit],
        }));
      },
      
      removeOutfit: (id) => {
        set((state) => ({
          outfits: state.outfits.filter((outfit) => outfit.id !== id),
        }));
      },
    }),
    {
      name: "closet-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);