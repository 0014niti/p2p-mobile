import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const hasNative = !!(
  (NativeModules && (NativeModules.RNAsyncStorage || NativeModules.AsyncStorage)) ||
  false
);

const storage = {
  async getItem(key: string) {
    if (!hasNative || typeof AsyncStorage.getItem !== 'function') return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    if (!hasNative || typeof AsyncStorage.setItem !== 'function') return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  },
  async removeItem(key: string) {
    if (!hasNative || typeof AsyncStorage.removeItem !== 'function') return;
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
  },
};

export default storage;
