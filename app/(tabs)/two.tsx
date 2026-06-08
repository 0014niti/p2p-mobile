import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950 items-center justify-center px-6">
      <View className="bg-emerald-100 dark:bg-emerald-900/30 p-5 rounded-full mb-6">
        <Text className="text-5xl">💬</Text>
      </View>
      <Text className="text-3xl font-black text-zinc-900 dark:text-white mb-3 text-center">
        Decentralized OTC Chat
      </Text>
      <Text className="text-zinc-500 text-center font-medium leading-relaxed">
        Phase 3 is loading! This tab will soon host your P2P Nostr chat engine, connecting you directly to local traders.
      </Text>
    </SafeAreaView>
  );
}
