import { Text, View } from 'react-native';

export default function AdCard({ ad, fiat, crypto }: { ad: any, fiat: string, crypto: string }) {
  // Fallbacks in case different exchanges use slightly different JSON keys
  const advertiser = ad.advertiserName || ad.nickName || ad.merchantName || 'P2P Trader';
  const methods = ad.paymentMethods?.map((m: any) => m.name || m.identifier).join(', ') || 'Any Bank';

  return (
    <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-bold text-zinc-900 dark:text-white text-base">{advertiser}</Text>
        <Text className="font-black text-xl text-emerald-600 dark:text-emerald-400">
          {ad.price} <Text className="text-xs text-zinc-500 font-bold">{fiat}</Text>
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Accepted Payments</Text>
          <Text className="text-zinc-700 dark:text-zinc-300 text-xs font-medium" numberOfLines={1}>{methods}</Text>
        </View>
        <View className="bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full">
           <Text className="text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase">1 {crypto}</Text>
        </View>
      </View>
    </View>
  );
}