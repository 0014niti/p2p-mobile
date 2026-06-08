import { useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';

export default function AdCard({
  ad,
  fiat,
  crypto,
  exchange,
}: {
  ad: any;
  fiat: string;
  crypto: string;
  exchange?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const advertiserName = ad.advertiser?.name || ad.advertiserName || ad.nickName || ad.merchantName || 'P2P Trader';
  const methods = ad.paymentMethods?.map((m: any) => m.name || m.identifier || m.type).join(', ') || 'Any Bank';
  const rawCompletion =
    ad.advertiser?.positiveRate ?? ad.completionRate ?? ad.completion ?? ad.successRate;
  const completion = typeof rawCompletion === 'number'
    ? rawCompletion <= 1
      ? (rawCompletion * 100).toFixed(1)
      : rawCompletion.toFixed(1)
    : undefined;
  const minAmount =
    ad.minSingleTransAmount || ad.minAmount || ad.min || ad.minTrade || ad.lowerLimit;
  const maxAmount =
    ad.maxSingleTransAmount || ad.maxAmount || ad.max || ad.maxTrade || ad.upperLimit;
  const volume = ad.surplusAmount || ad.tradableQuantity || ad.tradeVolume || ad.amount || ad.availableAmount;
  const terms = ad.terms || ad.note || ad.termsAndConditions || 'No terms provided';
  const tradeLink = `https://p2pcompanion.com/trade/${ad.advNo ?? ''}${exchange ? `?exchange=${exchange}` : ''}`;

  const onShare = async () => {
    try {
      await Share.share({
        message: `Trade ${crypto} on ${exchange?.toUpperCase() ?? 'P2P'}: ${advertiserName} at ${ad.price} ${fiat}. View details: ${tradeLink}`,
        title: 'Click to Trade',
      });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  return (
    <View className="bg-white/90 dark:bg-zinc-950/90 border border-white/15 dark:border-zinc-800/50 rounded-3xl p-4 mb-3 shadow-xl">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-3">
          <Text className="font-bold text-zinc-900 dark:text-white text-base">{advertiserName}</Text>
          {exchange ? (
            <Text className="text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">
              {exchange.toUpperCase()}
            </Text>
          ) : null}
        </View>
        <Text className="font-black text-xl text-emerald-600 dark:text-emerald-400 text-right">
          {ad.price} <Text className="text-xs text-zinc-500 font-bold">{fiat}</Text>
        </Text>
      </View>

      <View className="flex-row justify-between items-center gap-3 mb-3">
        <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/70 px-3 py-2">
          <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Completion</Text>
          <Text className="font-semibold text-zinc-900 dark:text-white text-sm">{completion ? `${completion}%` : 'Unknown'}</Text>
        </View>
        <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/70 px-3 py-2 flex-1">
          <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Amount</Text>
          <Text className="font-semibold text-zinc-900 dark:text-white text-sm">
            {minAmount ? `${minAmount}${maxAmount ? ` - ${maxAmount}` : ''} ${fiat}` : volume ? `${volume} ${fiat}` : '--'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          View details
        </Text>
        <TouchableOpacity
          onPress={() => setDetailsOpen((open) => !open)}
          className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-2"
        >
          <Text className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
            {detailsOpen ? 'Hide' : 'View'}
          </Text>
        </TouchableOpacity>
      </View>

      {detailsOpen ? (
        <View className="space-y-3 mb-3">
          <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/70 p-3 border border-zinc-200 dark:border-zinc-800/50">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Accepted payments
            </Text>
            <Text className="text-sm text-zinc-700 dark:text-zinc-300" numberOfLines={2}>
              {methods}
            </Text>
          </View>

          <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-950/70 p-3 border border-zinc-200 dark:border-zinc-800/50">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Terms
            </Text>
            <Text className="text-sm text-zinc-700 dark:text-zinc-300">{terms}</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onShare}
        className="rounded-2xl bg-zinc-900 dark:bg-white px-4 py-3 items-center"
      >
        <Text className="text-sm font-semibold text-white dark:text-zinc-900">Click to Trade</Text>
      </TouchableOpacity>
    </View>
  );
}
