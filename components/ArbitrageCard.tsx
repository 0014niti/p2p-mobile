import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

export default function ArbitrageCard({ route }: { route: any }) {
  return (
    <View className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Buy on {route.buy.exchange}</Text>
          <Text className="font-bold text-zinc-900 dark:text-white text-lg">
            {route.buy.price} <Text className="text-xs text-zinc-500">{route.fiat}</Text>
          </Text>
        </View>
        
        <View className="items-center px-2">
          <View className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <Text className="text-emerald-500 font-black">+{route.profitPct.toFixed(2)}%</Text>
          </View>
          <Text className="text-zinc-300 dark:text-zinc-600 mt-1">→</Text>
        </View>
        
        <View className="flex-1 items-end">
          <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Sell on {route.sell.exchange}</Text>
          <Text className="font-bold text-zinc-900 dark:text-white text-lg">
            {route.sell.price} <Text className="text-xs text-zinc-500">{route.fiat}</Text>
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/50 py-3 rounded-xl items-center"
        onPress={() => Alert.alert('Share', 'Phase 3: This will automatically post a beautiful widget into the Nostr Global Chat!')}
      >
        <Text className="text-blue-700 dark:text-blue-400 font-bold text-xs">Share to Global OTC Chat 💬</Text>
      </TouchableOpacity>
    </View>
  );
}