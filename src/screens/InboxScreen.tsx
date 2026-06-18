import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface DMConversation {
  pubkey: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

export default function InboxScreen({ navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dmKeys = keys.filter(k => k.startsWith('@p2p_dms_'));
      
      const convos: DMConversation[] = [];
      
      for (const key of dmKeys) {
        const pubkey = key.replace('@p2p_dms_', '');
        const dataStr = await AsyncStorage.getItem(key);
        if (dataStr) {
          const messages = JSON.parse(dataStr);
          if (messages.length > 0) {
            // Sort to get latest
            messages.sort((a: any, b: any) => b.created_at - a.created_at);
            const latest = messages[0];
            
            // Calculate unread (messages from them where read !== true)
            // Note: we'd need to actually track 'read' state in AsyncStorage, 
            // but for now we'll just check if there's unread notifications
            const unreadStr = await AsyncStorage.getItem(`@p2p_unread_${pubkey}`);
            const unreadCount = unreadStr ? parseInt(unreadStr, 10) : 0;

            convos.push({
              pubkey,
              lastMessage: latest.content,
              timestamp: latest.created_at * 1000,
              unreadCount
            });
          }
        }
      }
      
      // Sort conversations by latest message
      convos.sort((a, b) => b.timestamp - a.timestamp);
      setConversations(convos);
    } catch (err) {
      console.log('Failed to load conversations', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const handleOpenChat = async (pubkey: string) => {
    // Clear unread count
    await AsyncStorage.removeItem(`@p2p_unread_${pubkey}`);
    // Navigate directly to the Chat Tab
    navigation.navigate('Chat', { dmPubkey: pubkey });
  };

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <View className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex-row items-center justify-between z-10">
        <View>
          <Text className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Messages</Text>
          <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Encrypted • P2P</Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50">
          <Ionicons name="shield-checkmark" size={16} color={isDark ? "#10b981" : "#059669"} />
        </View>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="chatbubbles-outline" size={64} color={isDark ? "#3f3f46" : "#e4e4e7"} />
          <Text className="text-lg font-bold text-zinc-900 dark:text-white mt-4 text-center">No messages yet</Text>
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 text-center">
            Tap a profile picture on the Global Board to start a private, end-to-end encrypted negotiation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.pubkey}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#10b981" : "#10b981"} />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => handleOpenChat(item.pubkey)}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 mb-3 border border-zinc-200 dark:border-zinc-800 shadow-sm flex-row items-center"
            >
              <View className="w-12 h-12 rounded-full border-2 border-zinc-100 dark:border-zinc-800 bg-emerald-500 items-center justify-center mr-4">
                <Text className="text-lg font-black text-white">{item.pubkey.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-bold text-zinc-900 dark:text-white text-base">
                    {item.pubkey.substring(0, 8)}...
                  </Text>
                  <Text className="text-[10px] font-bold text-zinc-400">
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <Text 
                  className={`text-sm ${item.unreadCount > 0 ? 'font-bold text-zinc-800 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}`} 
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View className="w-5 h-5 rounded-full bg-rose-500 items-center justify-center ml-2 shadow-sm">
                  <Text className="text-[10px] font-black text-white">{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
