import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { SimplePool, Filter, nip04 } from 'nostr-tools';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

const BACKGROUND_FETCH_TASK = 'background-nostr-sync';
const LAST_SYNC_KEY = '@p2p_last_bg_sync';
const NOTIFIED_MESSAGES_KEY = '@p2p_notified_msgs';

// Define the headless background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const privKey = await AsyncStorage.getItem('nostr_burner_key');
    // We derive public key from private key if needed, or get it from storage if we stored it
    // Wait, nostr.ts generates the pubkey on the fly using getPublicKey(hexToBytes(secret))
    // Let's import hexToBytes and getPublicKey
    
    if (!privKey) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // We need to polyfill before using nostr-tools in background
    require('react-native-get-random-values');
    require('text-encoding');
    const { getPublicKey } = require('nostr-tools');
    
    const hexToBytes = (hex: string) => new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const pubKey = getPublicKey(hexToBytes(privKey));

    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const since = lastSync ? parseInt(lastSync, 10) : Math.floor(Date.now() / 1000) - (24 * 60 * 60); // 24 hours ago if first time

    const pool = new SimplePool();
    const filter: Filter = {
      kinds: [4],
      '#p': [pubKey],
      since: since
    };

    const events = await pool.querySync(RELAYS, filter);
    
    if (events.length === 0) {
      pool.close(RELAYS);
      await AsyncStorage.setItem(LAST_SYNC_KEY, Math.floor(Date.now() / 1000).toString());
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Filter out messages we already notified about
    const notifiedStr = await AsyncStorage.getItem(NOTIFIED_MESSAGES_KEY) || '[]';
    const notifiedIds = new Set(JSON.parse(notifiedStr));

    const newEvents = events.filter(e => !notifiedIds.has(e.id) && e.pubkey !== pubKey);

    if (newEvents.length === 0) {
      pool.close(RELAYS);
      await AsyncStorage.setItem(LAST_SYNC_KEY, Math.floor(Date.now() / 1000).toString());
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Notify for new events
    let notifiedCount = 0;
    for (const event of newEvents) {
      try {
        const decrypted = await nip04.decrypt(privKey, event.pubkey, event.content);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'New Encrypted Message 🔒',
            body: decrypted.substring(0, 50) + (decrypted.length > 50 ? '...' : ''),
            data: { pubkey: event.pubkey },
            sound: true,
          },
          trigger: null, // Send immediately
        });
        
        notifiedIds.add(event.id);
        notifiedCount++;
      } catch (err) {
        console.warn('Failed to decrypt background message', err);
      }
    }

    // Save notified IDs to prevent duplicate alerts
    await AsyncStorage.setItem(NOTIFIED_MESSAGES_KEY, JSON.stringify(Array.from(notifiedIds).slice(-100))); // Keep last 100 to save space
    await AsyncStorage.setItem(LAST_SYNC_KEY, Math.floor(Date.now() / 1000).toString());
    
    pool.close(RELAYS);

    return notifiedCount > 0 
      ? BackgroundFetch.BackgroundFetchResult.NewData 
      : BackgroundFetch.BackgroundFetchResult.NoData;

  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Helper function to register the background task from App.tsx
export async function registerBackgroundNostrSync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch registered successfully');
  } catch (err) {
    console.log('Background fetch registration failed:', err);
  }
}
