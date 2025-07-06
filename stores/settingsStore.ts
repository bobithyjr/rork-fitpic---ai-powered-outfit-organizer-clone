import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

interface SettingsState {
  enabledCategories: Record<string, boolean>;
  toggleCategory: (categoryId: string) => void;
  isCategoryEnabled: (categoryId: string) => boolean;
  resetToDefaults: () => void;
}

const createDefaultEnabledCategories = () => {
  const defaults: Record<string, boolean> = {};
  CLOTHING_CATEGORIES.forEach((category) => {
    defaults[category.id] = true;
  });
  return defaults;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      enabledCategories: createDefaultEnabledCategories(),
      
      toggleCategory: (categoryId) => {
        set((state) => ({
          enabledCategories: {
            ...state.enabledCategories,
            [categoryId]: !state.enabledCategories[categoryId],
          },
        }));
      },
      
      isCategoryEnabled: (categoryId) => {
        return get().enabledCategories[categoryId] ?? true;
      },
      
      resetToDefaults: () => {
        set({
          enabledCategories: createDefaultEnabledCategories(),
        });
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);