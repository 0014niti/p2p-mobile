import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const hasNative = !!(
  (NativeModules && (NativeModules.RNAsyncStorage || NativeModules.AsyncStorage || NativeModules.RNC_AsyncSQLiteDBStorage)) ||
  true // Expo Go sometimes hides NativeModules. Just assume true and catch errors.
);

const memStorage: Record<string, string> = {};

const storage = {
  async getItem(key: string) {
    if (!hasNative || typeof AsyncStorage.getItem !== 'function') return memStorage[key] || null;
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return memStorage[key] || null;
    }
  },
  async setItem(key: string, value: string) {
    memStorage[key] = value;
    if (!hasNative || typeof AsyncStorage.setItem !== 'function') return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },
  async removeItem(key: string) {
    delete memStorage[key];
    if (!hasNative || typeof AsyncStorage.removeItem !== 'function') return;
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },

  // Helpers for index.tsx
  async getString(key: string) {
    return await this.getItem(key);
  },
  async setString(key: string, value: string) {
    return await this.setItem(key, value);
  },
  async getObject<T>(key: string): Promise<T | null> {
    const val = await this.getItem(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  },
  async setObject(key: string, value: any) {
    try {
      const val = JSON.stringify(value);
      await this.setItem(key, val);
    } catch {}
  }
};

export default storage;
