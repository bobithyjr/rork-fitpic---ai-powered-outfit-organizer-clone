import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

interface UserState {
  userId: string | null;
  isCloudSyncEnabled: boolean;
  lastSyncTime: number | null;
  initializeUser: () => Promise<void>;
  toggleCloudSync: () => void;
  setLastSyncTime: (time: number) => void;
}

// Generate a unique user ID based on device info
const generateUserId = async (): Promise<string> => {
  if (Platform.OS === 'web') {
    // For web, use a combination of user agent and timestamp
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    return `web_${btoa(userAgent).slice(0, 10)}_${timestamp}`;
  }
  
  try {
    // For mobile, use application instance ID or installation ID
    const installationId = Application.applicationId || 'unknown';
    const instanceId = await Application.getInstallationTimeAsync();
    return `${Platform.OS}_${installationId}_${instanceId}`;
  } catch (error) {
    // Fallback to timestamp-based ID
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      isCloudSyncEnabled: true, // Default to enabled
      lastSyncTime: null,
      
      initializeUser: async () => {
        const currentUserId = get().userId;
        if (!currentUserId) {
          const newUserId = await generateUserId();
          set({ userId: newUserId });
        }
      },
      
      toggleCloudSync: () => {
        set((state) => ({
          isCloudSyncEnabled: !state.isCloudSyncEnabled,
        }));
      },
      
      setLastSyncTime: (time) => {
        set({ lastSyncTime: time });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);