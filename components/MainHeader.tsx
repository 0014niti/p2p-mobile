import React from 'react';
import { Text, TouchableOpacity, View, ScrollView, Linking } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MainHeader({ style }: { style: any }) {
  return (
    <Animated.View style={style} className="px-4">
      <View className="mb-2 rounded-[32px] bg-white/70 dark:bg-zinc-900/80 border border-white/50 dark:border-zinc-700/50 shadow-[0_4px_24px_rgba(16,185,129,0.08)] pl-2 pr-2 py-2 overflow-hidden flex-row items-center justify-between">
        {/* Subtle glowing background effect */}
        <View className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10" />
        
        {/* Logo Section */}
        <View className="flex-row items-center gap-2 pr-3">
          <View className="w-9 h-9 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.4)] overflow-hidden items-center justify-center">
            <LinearGradient
              colors={['#2563eb', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            <Ionicons name="flash" size={16} color="#ffffff" />
          </View>
          <View className="flex-col justify-center">
            <Text className="text-[15px] font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
              P2P <Text className="font-medium text-zinc-500 dark:text-zinc-400">Terminal</Text>
            </Text>
            <Text className="text-[8px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              by P2P Companion
            </Text>
          </View>
        </View>

        {/* Action Buttons right next to logo */}
        <View className="flex-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => Linking.openURL('https://p2pcompanion.com/scam-check')} className="flex-row items-center gap-1.5 bg-rose-50/80 dark:bg-rose-900/30 px-3 py-2.5 rounded-full border border-rose-200/50 dark:border-rose-800/50 mr-2 shadow-sm">
              <Ionicons name="warning" size={14} color="#ef4444" />
              <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Scam Check</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://p2pcompanion.com/blog')} className="flex-row items-center gap-1.5 bg-white/80 dark:bg-zinc-800/50 px-3 py-2.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
              <Ionicons name="book" size={14} color="#71717a" />
              <Text className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest">Blog</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}
