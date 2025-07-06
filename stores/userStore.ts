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
  hasAutoLoaded: boolean;
  initializeUser: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => void;
  toggleCloudSync: () => void;
  setLastSyncTime: (time: number) => void;
  setHasAutoLoaded: (loaded: boolean) => void;
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
      hasAutoLoaded: false,
      
      initializeUser: async () => {
        const state = get();
        
        // If we have an Apple User ID stored, try to restore the session
        if (state.appleUserId && Platform.OS === 'ios') {
          try {
            // Check if the user is still signed in with Apple
            const credentialState = await AppleAuthentication.getCredentialStateAsync(state.appleUserId);
            
            if (credentialState === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED) {
              // User is still authorized, restore their session
              console.log('Restoring Apple ID session for user:', state.appleUserId);
              set({ 
                userId: state.appleUserId,
                isAuthenticated: true,
                hasAutoLoaded: false // Reset to allow auto-loading
              });
              return;
            } else {
              // User is no longer authorized, clear Apple ID data but keep fallback
              console.log('Apple ID authorization expired, falling back to device ID');
              const fallbackId = await generateFallbackUserId();
              set({
                userId: fallbackId,
                appleUserId: null,
                userEmail: null,
                isAuthenticated: true,
                hasAutoLoaded: false
              });
              return;
            }
          } catch (error) {
            console.log('Error checking Apple ID credential state:', error);
            // Fall through to fallback ID
          }
        }
        
        // If already authenticated with fallback ID, keep it
        if (state.isAuthenticated && state.userId && !state.appleUserId) {
          return;
        }
        
        // Generate fallback ID for new users or when Apple ID is not available
        const fallbackId = await generateFallbackUserId();
        set({ 
          userId: fallbackId,
          isAuthenticated: true,
          hasAutoLoaded: false
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
          
          console.log('Successfully signed in with Apple ID:', user);
          
          set({
            userId: user,
            userEmail: email || null,
            appleUserId: user,
            isAuthenticated: true,
            hasAutoLoaded: false, // Reset auto-load flag for new sign-in
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
          hasAutoLoaded: false,
        });
      },
      
      toggleCloudSync: () => {
        const currentState = get();
        const newSyncState = !currentState.isCloudSyncEnabled;
        
        set({
          isCloudSyncEnabled: newSyncState,
          hasAutoLoaded: false, // Reset auto-load flag when toggling sync
        });
        
        // If enabling sync and user is authenticated, trigger auto-load
        if (newSyncState && currentState.userId) {
          setTimeout(async () => {
            try {
              const { useClosetStore } = await import('./closetStore');
              const closetStore = useClosetStore.getState();
              await closetStore.autoLoadFromCloud();
            } catch (error) {
              console.error('Failed to auto-load after enabling sync:', error);
            }
          }, 100);
        }
      },
      
      setLastSyncTime: (time) => {
        set({ lastSyncTime: time });
      },
      
      setHasAutoLoaded: (loaded) => {
        set({ hasAutoLoaded: loaded });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);