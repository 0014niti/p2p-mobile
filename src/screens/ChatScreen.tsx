import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNostrEngine, NostrMessage } from '../../lib/nostr';

// Soft, cute pastel crypto-friendly colors
const AVATAR_COLORS = [
  '#fb7185', '#f472b6', '#e879f9', '#c084fc', '#a78bfa',
  '#818cf8', '#60a5fa', '#38bdf8', '#22d3ee', '#2dd4bf',
  '#34d399', '#4ade80', '#a3e635', '#facc15', '#fbbf24', '#fb923c'
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function timeAgo(ms: number) {
  const seconds = Math.floor(Date.now() / 1000) - ms;
  if (seconds < 60) return 'Just now ✨';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function OtcNexusScreen() {
  const [fiat, setFiat] = useState('USD');
  const [inputText, setInputText] = useState('');
  const [nameInput, setNameInput] = useState('');

  const {
    messages,
    isConnected,
    username,
    createOfficialAccount,
    sendMessage
  } = useNostrEngine(fiat);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText.trim());
    setInputText('');
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) return;
    await createOfficialAccount(nameInput.trim());
  };

  const renderMessage = ({ item }: { item: NostrMessage }) => {
    const isMine = item.username === username && username !== null;
    const avatarColor = getAvatarColor(item.username);

    return (
      <View className={`flex-row mb-5 px-5 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <View
            style={{ backgroundColor: avatarColor }}
            className="w-11 h-11 rounded-full items-center justify-center mr-3 shadow-sm border-2 border-white dark:border-zinc-900"
          >
            <Text className="text-white font-black text-sm uppercase">
              {item.username.charAt(0)}
            </Text>
          </View>
        )}

        <View className={`max-w-[75%] rounded-[24px] p-4 shadow-sm ${isMine
            ? 'bg-emerald-500 rounded-tr-[6px]'
            : 'bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-tl-[6px]'
          }`}>
          {!isMine && (
            <Text className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: avatarColor }}>
              {item.username}
            </Text>
          )}
          <Text className={`text-[15px] font-medium ${isMine ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'} leading-relaxed`}>
            {item.content}
          </Text>
          <Text className={`text-[10px] mt-2 font-bold text-right ${isMine ? 'text-emerald-100' : 'text-zinc-400 dark:text-zinc-500'}`}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#09090b]" edges={['top']}>
      <View className="px-6 py-4 bg-white/90 dark:bg-zinc-950/90 border-b border-emerald-100 dark:border-emerald-900/30 shadow-sm z-10 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-black text-zinc-900 dark:text-white flex-row items-center tracking-tight">
            OTC Nexus <Text className="text-2xl">✨</Text>
          </Text>
          <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
            {isConnected ? '🌸 Global P2P Feed' : '🦋 Connecting...'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl px-4 py-2 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
          <Text className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Fiat:</Text>
          <TextInput
            value={fiat}
            onChangeText={(v) => setFiat(v.toUpperCase().trim())}
            maxLength={4}
            className="text-sm font-black text-emerald-700 dark:text-emerald-300 p-0 m-0 w-10 text-center"
          />
        </View>
      </View>

      {!username ? (
        <View className="m-5 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[32px] border-2 border-emerald-100 dark:border-emerald-800/30 shadow-sm">
          <Text className="text-xl font-black text-emerald-900 dark:text-emerald-100 mb-2 tracking-tight">
            Join the party! 🎉
          </Text>
          <Text className="text-xs text-emerald-700 dark:text-emerald-300 mb-5 leading-relaxed font-medium">
            Pick a cute alias to post your own P2P offers to the decentralized Nostr network.
          </Text>
          <View className="flex-row gap-3">
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. CryptoKitty 🐱"
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-white dark:bg-zinc-900 border-2 border-emerald-100 dark:border-emerald-800/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-zinc-900 dark:text-white shadow-sm"
            />
            <TouchableOpacity
              onPress={handleSaveProfile}
              className="bg-emerald-500 rounded-2xl px-6 py-3.5 justify-center shadow-md active:opacity-80"
            >
              <Text className="text-white font-black tracking-wide text-sm">Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-10 mt-10">
            {isConnected ? (
              <>
                <Text className="text-6xl mb-5">🌸</Text>
                <Text className="text-xl font-black text-zinc-800 dark:text-zinc-200 text-center mb-3 tracking-tight">
                  It's quiet in {fiat}...
                </Text>
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                  Be the first to post a P2P offer! It will be broadcasted to relays globally. 🚀
                </Text>
              </>
            ) : (
              <ActivityIndicator size="large" color="#10b981" />
            )}
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <View className="px-5 py-4 bg-white/90 dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800 flex-row gap-3 pb-8 items-end">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={username ? "Type your P2P offer..." : "Join to chat..."}
            placeholderTextColor="#94a3b8"
            editable={!!username}
            multiline
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[28px] px-5 py-3.5 pt-4 text-sm font-medium text-zinc-900 dark:text-white max-h-32"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!username || !inputText.trim()}
            className={`w-14 h-14 rounded-full items-center justify-center shadow-md active:opacity-80 ${username && inputText.trim() ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
              }`}
          >
            <Text className="text-2xl ml-1">✨</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
