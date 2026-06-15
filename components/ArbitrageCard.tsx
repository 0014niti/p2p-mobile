import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

export default function ArbitrageCard({ route }: { route: any }) {
  return (
    <View className="bg-white dark:bg-zinc-900 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[32px] p-5 mb-5 shadow-sm">
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-1">
          <View className="bg-blue-50 dark:bg-blue-900/30 self-start px-2.5 py-1 rounded-lg mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Buy on {route.buy.exchange}</Text>
          </View>
          <Text className="font-black text-zinc-900 dark:text-white text-2xl tracking-tight">
            {route.buy.price} <Text className="text-sm text-zinc-400">{route.fiat}</Text>
          </Text>
        </View>

        <View className="items-center px-3">
          <View className="bg-emerald-100 dark:bg-emerald-900/40 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
            <Text className="text-emerald-600 dark:text-emerald-400 font-black text-xs">+{route.profitPct.toFixed(2)}%</Text>
          </View>
          <Text className="text-zinc-300 dark:text-zinc-600 mt-2 text-lg">✨</Text>
        </View>

        <View className="flex-1 items-end">
          <View className="bg-purple-50 dark:bg-purple-900/30 self-end px-2.5 py-1 rounded-lg mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Sell on {route.sell.exchange}</Text>
          </View>
          <Text className="font-black text-zinc-900 dark:text-white text-2xl tracking-tight">
            {route.sell.price} <Text className="text-sm text-zinc-400">{route.fiat}</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="w-full bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 py-4 rounded-2xl items-center flex-row justify-center gap-2 active:opacity-80 shadow-sm"
        onPress={() => Alert.alert('Share', 'Phase 3: This will automatically post a beautiful widget into the Nostr Global Chat!')}
      >
        <Text className="text-emerald-600 dark:text-emerald-400 font-black text-sm">Share to Global OTC Chat</Text>
        <Text className="text-base">💬</Text>
      </TouchableOpacity>
    </View>
  );
}