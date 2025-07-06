import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

interface UserState {
  userId: string | null;
  userEmail: string | null;
  appleUserId: string | null;
  isAuthenticated: boolean;
  isCloudSyncEnabled: boolean;
  lastSyncTime: number | null;
  initializeUser: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  toggleCloudSync: () => void;
  setLastSyncTime: (time: number) => void;
}

// Generate a fallback user ID for web or when Apple Sign-In is not available
const generateFallbackUserId = async (): Promise<string> => {
  if (Platform.OS === 'web') {
    // For web, try to get a persistent identifier
    const stored = await AsyncStorage.getItem('fallback-user-id');
    if (stored) return stored;
    
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const fallbackId = `web_${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, userAgent + timestamp)}`;
    await AsyncStorage.setItem('fallback-user-id', fallbackId);
    return fallbackId;
  }
  
  // For mobile without Apple Sign-In, create a persistent fallback ID
  const stored = await AsyncStorage.getItem('fallback-user-id');
  if (stored) return stored;
  
  const fallbackId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await AsyncStorage.setItem('fallback-user-id', fallbackId);
  return fallbackId;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      userEmail: null,
      appleUserId: null,
      isAuthenticated: false,
      isCloudSyncEnabled: true, // Default to enabled
      lastSyncTime: null,
      
      initializeUser: async () => {
        const state = get();
        
        // If already authenticated, no need to re-initialize
        if (state.isAuthenticated && state.userId) {
          return;
        }
        
        // Try to use existing Apple authentication if available
        if (state.appleUserId) {
          set({ 
            userId: state.appleUserId,
            isAuthenticated: true 
          });
          return;
        }
        
        // Check if Apple Sign-In is available
        if (Platform.OS === 'ios') {
          try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (isAvailable) {
              // Don't auto-sign in, let user choose
              return;
            }
          } catch (error) {
            console.log('Apple Sign-In not available:', error);
          }
        }
        
        // Fallback to device-based ID for web or when Apple Sign-In is not available
        const fallbackId = await generateFallbackUserId();
        set({ 
          userId: fallbackId,
          isAuthenticated: true 
        });
      },
      
      signInWithApple: async () => {
        if (Platform.OS !== 'ios') {
          throw new Error('Apple Sign-In is only available on iOS');
        }
        
        try {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });
          
          const { user, email, fullName } = credential;
          
          set({
            userId: user,
            userEmail: email || null,
            appleUserId: user,
            isAuthenticated: true,
          });
          
        } catch (error: any) {
          if (error.code === 'ERR_CANCELED') {
            // User canceled the sign-in
            return;
          }
          throw error;
        }
      },
      
      signOut: () => {
        set({
          userId: null,
          userEmail: null,
          appleUserId: null,
          isAuthenticated: false,
          lastSyncTime: null,
        });
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