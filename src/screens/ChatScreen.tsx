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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { useNostrEngine, NostrMessage } from '../../lib/nostr';
import AccountSetupModal from '../../components/AccountSetupModal';

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

function parseOffer(content: string) {
  try {
    if (content.includes('[WTS]') || content.includes('[WTB]')) {
      const type = content.includes('[WTS]') ? 'WTS' : 'WTB';
      const part1 = content.split('] ')[1];
      const coin = part1.split(' for ')[0].trim();
      const part2 = part1.split(' for ')[1];
      const fiat = part2.split(' @ ')[0].trim();
      const part3 = part2.split(' @ ')[1];
      const price = part3.split('\n')[0].trim();
      let note = '';
      if (content.includes('Note:')) {
        note = content.split('Note:')[1].trim();
      }
      return { isOffer: true, type, coin, fiat, price, note };
    }
  } catch (e) {
    console.warn("Could not parse offer strictly, falling back to text bubble.");
  }
  return { isOffer: false, text: content };
}

export default function OtcNexusScreen({ route, navigation }: any) {
  const [fiat, setFiat] = useState('USD');
  const [inputText, setInputText] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [activeDmPubkey, setActiveDmPubkey] = useState<string | null>(null);
  const [activeDmUsername, setActiveDmUsername] = useState<string>('');
  const [activeDmOffer, setActiveDmOffer] = useState<any>(null);
  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const [tradeType, setTradeType] = useState('WTS');
  const [tradeCoin, setTradeCoin] = useState('USDT');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeNote, setTradeNote] = useState('');

  const {
    messages,
    dmMessages,
    isConnected,
    username,
    isRestoredAccount,
    keys,
    createOfficialAccount,
    restoreFromKey,
    logout,
    sendMessage,
    sendDM
  } = useNostrEngine(fiat);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (route?.params?.dmPubkey) {
      setActiveDmPubkey(route.params.dmPubkey);
      setActiveDmUsername('VIP Contact'); // Default fallback for inbox navigation
    }
  }, [route?.params?.dmPubkey]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);



  const handleSendDM = async () => {
    if (!inputText.trim() || !activeDmPubkey) return;
    await sendDM(activeDmPubkey, inputText.trim());
    setInputText('');
  };

  const handleGlobalSend = async () => {
    if (!username) {
        setAccountModalVisible(true);
        return;
    }
    if (!tradePrice || !tradeNote.trim()) return;
    const content = `[${tradeType}] ${tradeCoin} for ${fiat} @ ${tradePrice}\n📝 Note: ${tradeNote.slice(0, 100)}`;
    await sendMessage(content);
    setTradePrice('');
    setTradeNote('');
  };


  const renderMessage = ({ item }: { item: NostrMessage }) => {
    const isMine = item.username === username && username !== null;
    const avatarColor = getAvatarColor(item.username);
    const offer = parseOffer(item.content);

    return (
      <View className={`flex-row mb-5 px-5 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {!isMine && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (!item.pubkey) return;
              
              if (isRestoredAccount) {
                setActiveDmPubkey(item.pubkey);
                setActiveDmUsername(item.username);
                setActiveDmOffer(offer.isOffer ? offer : null);
              } else {
                Alert.alert(
                  "🔒 VIP Room Locked!",
                  "To prevent losing access to your private negotiations, you must explicitly import your Private Key in the Account menu first.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Open Account", 
                      onPress: () => setAccountModalVisible(true) 
                    }
                  ]
                );
              }
            }}
            style={{ backgroundColor: avatarColor }}
            className="w-11 h-11 rounded-full items-center justify-center mr-3 shadow-sm border-2 border-white dark:border-zinc-900"
          >
            <Text className="text-white font-black text-sm uppercase">
              {item.username.charAt(0)}
            </Text>
          </TouchableOpacity>
        )}

        <View className={`max-w-[85%] rounded-[24px] p-4 shadow-sm ${
           offer.isOffer 
             ? (isMine ? 'bg-indigo-600 rounded-tr-[6px]' : 'bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-tl-[6px]')
             : (isMine ? 'bg-emerald-500 rounded-tr-[6px]' : 'bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-tl-[6px]')
        }`}>
          {!isMine && (
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-[11px] font-black tracking-widest uppercase" style={{ color: avatarColor }}>
                {item.username}
              </Text>
              {offer.isOffer && (
                <Text className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">(Click avatar to DM)</Text>
              )}
            </View>
          )}

          {offer.isOffer ? (
            <View className="flex-col gap-1">
              <View className="self-start px-2 py-0.5 rounded flex-row items-center" style={{ backgroundColor: offer.type === 'WTS' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                <Text className={`text-[10px] font-black tracking-widest uppercase ${offer.type === 'WTS' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {offer.type === 'WTS' ? 'SELLING' : 'BUYING'} {offer.coin}
                </Text>
              </View>
              <View className="flex-row items-baseline gap-1 mt-1">
                <Text className={`text-2xl font-black tracking-tighter ${isMine ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                  {offer.price}
                </Text>
                <Text className={`text-xs font-bold ${isMine ? 'text-indigo-200' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {offer.fiat}
                </Text>
              </View>
              {!!offer.note && (
                <View className={`mt-2 px-3 py-2 rounded-xl ${isMine ? 'bg-indigo-700/50' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                  <Text className={`text-[11px] font-medium ${isMine ? 'text-indigo-50' : 'text-zinc-600 dark:text-zinc-400'}`}>📝 {offer.note}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text className={`text-[15px] font-medium ${isMine ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'} leading-relaxed`}>
              {item.content}
            </Text>
          )}

          <Text className={`text-[10px] mt-2 font-bold text-right ${isMine ? (offer.isOffer ? 'text-indigo-200' : 'text-emerald-100') : 'text-zinc-400 dark:text-zinc-500'}`}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#09090b]" edges={['top']}>
      <View className="px-6 py-4 bg-white/90 dark:bg-zinc-950/90 border-b border-emerald-100 dark:border-emerald-900/30 shadow-sm z-10 flex-row items-center justify-between">
        {activeDmPubkey ? (
          <View className="flex-row items-center gap-3">
            <TouchableOpacity 
              onPress={() => setActiveDmPubkey(null)}
              className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 items-center justify-center border border-zinc-200 dark:border-zinc-800"
            >
              <Text className="text-xl">👈</Text>
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                {activeDmUsername}
              </Text>
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
                🔒 Encrypted Chat
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View>
              <Text className="text-3xl font-black text-zinc-900 dark:text-white flex-row items-center tracking-tight">
                OTC Nexus <Text className="text-2xl">✨</Text>
              </Text>
              <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
                {isConnected ? '🌸 Global P2P Feed' : '🦋 Connecting...'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity 
                onPress={() => setAccountModalVisible(true)}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl shadow-sm flex-row items-center gap-1.5"
              >
                {username ? (
                  <>
                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: getAvatarColor(username) }} />
                    <Text className="text-[11px] font-black text-zinc-900 dark:text-white tracking-widest uppercase">{username}</Text>
                  </>
                ) : (
                  <Text className="text-[11px] font-black text-zinc-600 dark:text-zinc-400 tracking-widest uppercase">Account</Text>
                )}
              </TouchableOpacity>
              <View className="flex-row items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-1.5 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                <Text className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Fiat:</Text>
                <TextInput
                  value={fiat}
                  onChangeText={(v) => setFiat(v.toUpperCase().trim())}
                  maxLength={4}
                  className="text-sm font-black text-emerald-700 dark:text-emerald-300 p-0 m-0 w-10 text-center"
                />
              </View>
            </View>
          </>
        )}
      </View>

      {activeDmOffer && activeDmPubkey && (
        <View className="px-6 py-2 bg-zinc-900 border-b border-zinc-800 flex-row justify-between items-center z-0">
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ref:</Text>
            <View className="px-2 py-0.5 rounded" style={{ backgroundColor: activeDmOffer.type === 'WTS' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
              <Text className={`text-[9px] font-black tracking-widest uppercase ${activeDmOffer.type === 'WTS' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeDmOffer.type} {activeDmOffer.coin}
              </Text>
            </View>
          </View>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-xl font-black tracking-tighter text-white drop-shadow-sm">{activeDmOffer.price}</Text>
            <Text className="text-[10px] font-bold text-zinc-400">{activeDmOffer.fiat}</Text>
          </View>
        </View>
      )}


      <FlatList
        ref={flatListRef}
        data={activeDmPubkey ? dmMessages.filter(m => m.pubkey === activeDmPubkey || m.targetPubkey === activeDmPubkey) : messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-10 mt-10">
            {activeDmPubkey ? (
              <>
                <Text className="text-6xl mb-5">🔒</Text>
                <Text className="text-xl font-black text-zinc-800 dark:text-zinc-200 text-center mb-3 tracking-tight">
                  Encrypted Session
                </Text>
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                  Messages are end-to-end encrypted using NIP-04. Say hi!
                </Text>
              </>
            ) : isConnected ? (
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
        {activeDmPubkey ? (
          <View className="px-5 py-4 bg-white/90 dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800 flex-row gap-3 pb-[100px] items-end">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a secure message..."
              placeholderTextColor="#94a3b8"
              multiline
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[28px] px-5 py-3.5 pt-4 text-sm font-medium text-zinc-900 dark:text-white max-h-32"
            />
            <TouchableOpacity
              onPress={() => {
                if (!username) {
                  setAccountModalVisible(true);
                  return;
                }
                if (!inputText.trim()) {
                  Alert.alert("Empty Message", "Please type a message first.");
                  return;
                }
                handleSendDM();
              }}
              className={`w-14 h-14 rounded-full items-center justify-center shadow-md active:opacity-80 ${inputText.trim() ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
            >
              <Text className="text-2xl ml-1">✨</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-5 py-4 bg-white/90 dark:bg-zinc-950/90 border-t border-zinc-100 dark:border-zinc-800 flex-col gap-3 pb-[100px]">
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => setTradeType(tradeType === 'WTS' ? 'WTB' : 'WTS')}
                className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 justify-center shadow-sm"
              >
                <Text className="font-black text-zinc-900 dark:text-white">{tradeType}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setTradeCoin(tradeCoin === 'USDT' ? 'BTC' : 'USDT')}
                className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 justify-center shadow-sm"
              >
                <Text className="font-black text-zinc-900 dark:text-white">{tradeCoin}</Text>
              </TouchableOpacity>

              <TextInput
                value={tradePrice}
                onChangeText={setTradePrice}
                keyboardType="decimal-pad"
                placeholder={`Rate (${fiat})`}
                placeholderTextColor="#94a3b8"
                className="flex-1 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-black text-zinc-900 dark:text-white shadow-sm"
              />
            </View>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={tradeNote}
                onChangeText={setTradeNote}
                placeholder="Add terms..."
                placeholderTextColor="#94a3b8"
                maxLength={100}
                className="flex-1 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 dark:text-white shadow-sm"
              />
              <TouchableOpacity
                onPress={() => {
                  if (!username) {
                    setAccountModalVisible(true);
                    return;
                  }
                  if (!tradePrice || !tradeNote.trim()) {
                    Alert.alert("Missing Details", "Please enter a rate and terms before posting.");
                    return;
                  }
                  handleGlobalSend();
                }}
                className={`px-6 py-3.5 rounded-xl justify-center items-center shadow-md ${!tradePrice || !tradeNote.trim() ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-blue-600'}`}
              >
                <Text className="text-white font-black">Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <AccountSetupModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
        isDark={false}
        isRestoredAccount={isRestoredAccount}
        keys={keys}
        username={username}
        createOfficialAccount={createOfficialAccount}
        restoreFromKey={restoreFromKey}
        logout={logout}
      />
    </SafeAreaView>
  );
}
