import React, { useState } from 'react';
import { Linking, Share, Text, TouchableOpacity, View } from 'react-native';

function AdCard({
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

  const ensureString = (value: any) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const advertiserName =
    ad.advertiser?.name || ad.advertiserName || ad.nickName || ad.merchantName || 'P2P Trader';
  const paymentMethods =
    Array.isArray(ad.paymentMethods)
      ? ad.paymentMethods
      : Array.isArray(ad.payments)
      ? ad.payments
      : Array.isArray(ad.payment)
      ? ad.payment
      : [];
  const methods =
    paymentMethods
      .map((m: any) =>
        typeof m === 'string'
          ? m
          : m?.name || m?.identifier || m?.type || String(m),
      )
      .filter(Boolean)
      .slice(0, 4)
      .join(', ') ||
    'Any Bank';

  const rawCompletion =
    ad.advertiser?.positiveRate ?? ad.completionRate ?? ad.completion ?? ad.successRate;
  const completion = typeof rawCompletion === 'number'
    ? rawCompletion <= 1
      ? `${(rawCompletion * 100).toFixed(1)}%`
      : `${rawCompletion.toFixed(1)}%`
    : 'N/A';
  const minAmount =
    ad.minSingleTransAmount || ad.minAmount || ad.min || ad.minTrade || ad.lowerLimit || '';
  const maxAmount =
    ad.maxSingleTransAmount || ad.maxAmount || ad.max || ad.maxTrade || ad.upperLimit || '';
  const volume =
    ad.surplusAmount || ad.tradableQuantity || ad.tradeVolume || ad.amount || '';
  const availableAmount =
    ad.available || ad.availableAmount || volume || '';
  const orderCount30d =
    ad.merchantStats?.monthOrderCount || ad.monthOrderCount || ad.orderCount || 0;
  const terms = ad.terms || ad.note || ad.termsAndConditions || 'No terms provided';
  const isNewUserOnly = ad.isNewUserOnly || ad.newUserOnly || ad.onlyNewUser || false;
  const officialMarketRate = Number(ad.marketRate ?? ad.officialRate ?? 0) || 0;
  const premium = officialMarketRate > 0
    ? (((Number(ad.price || 0) - officialMarketRate) / officialMarketRate) * 100).toFixed(2)
    : null;
  const tradeLink = `https://p2pcompanion.com/trade/${ad.advNo ?? ''}${exchange ? `?exchange=${exchange}` : ''}`;

  const displayAmount = () => {
    if (minAmount && maxAmount) {
      return `${minAmount} - ${maxAmount} ${fiat}`;
    }
    if (minAmount) {
      return `${minAmount} ${fiat}`;
    }
    if (volume) {
      return `${volume} ${fiat}`;
    }
    return '--';
  };

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
    <View className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 mb-4 shadow-sm">
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => setDetailsOpen((open) => !open)}
      >
        <View className="flex-row justify-between gap-3 mb-3">
          <View className="flex-1 pr-2">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
              {exchange?.toUpperCase()}
            </Text>
            <Text className="text-2xl font-black text-zinc-900 dark:text-white">
              {ad.price ?? '--'} <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{fiat}</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-3">
              <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-300" numberOfLines={1}>
                {advertiserName}
              </Text>
              {premium !== null ? (
                <View className="rounded-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 px-2 py-1">
                  <Text className="text-[10px] uppercase tracking-widest font-black text-blue-600 dark:text-blue-300">
                    {premium.startsWith('-') ? '' : '+'}{premium}%
                  </Text>
                </View>
              ) : null}
              {isNewUserOnly ? (
                <View className="rounded-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 px-2 py-1">
                  <Text className="text-[10px] uppercase tracking-widest font-black text-blue-600 dark:text-blue-300">
                    New User
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="items-end justify-between">
            <View className="rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 px-3 py-2 mb-2 border border-zinc-200 dark:border-zinc-800">
              <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Completion
              </Text>
              <Text className="text-sm font-bold text-zinc-900 dark:text-white mt-1">
                {completion}
              </Text>
            </View>
            <View className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/15 px-3 py-2 border border-emerald-200 dark:border-emerald-800">
              <Text className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                Amount
              </Text>
              <Text className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 leading-tight">
                {displayAmount()}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {detailsOpen ? 'Hide details' : 'Tap for more details'}
          </Text>
          <Text className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
            {detailsOpen ? 'Less' : 'More'}
          </Text>
        </View>
      </TouchableOpacity>

      {detailsOpen ? (
        <View className="mt-4 space-y-3">
          <View className="rounded-3xl bg-zinc-100 dark:bg-zinc-900/70 p-3 border border-zinc-200 dark:border-zinc-800">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Availability
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <View className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                  Available
                </Text>
                <Text className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {ensureString(availableAmount)} {crypto}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                  Orders (30d)
                </Text>
                <Text className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {orderCount30d}
                </Text>
              </View>
            </View>
          </View>

          <View className="rounded-3xl bg-zinc-100 dark:bg-zinc-900/70 p-3 border border-zinc-200 dark:border-zinc-800">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Payment Methods
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {paymentMethods.length > 0 ? paymentMethods.slice(0, 4).map((m: any, idx: number) => {
                const label = typeof m === 'string' ? m : m?.name || m?.identifier || m?.type || String(m);
                const bgColor = typeof m === 'object' && m?.bgColor ? m.bgColor : null;
                return (
                  <View
                    key={idx}
                    className="px-2 py-1 rounded-full border"
                    style={
                      bgColor
                        ? { backgroundColor: bgColor, borderColor: bgColor }
                        : undefined
                    }
                  >
                    <Text className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {label}
                    </Text>
                  </View>
                );
              }) : (
                <Text className="text-sm text-zinc-700 dark:text-zinc-300">Any Bank</Text>
              )}
            </View>
          </View>

          <View className="rounded-3xl bg-zinc-100 dark:bg-zinc-900/70 p-3 border border-zinc-200 dark:border-zinc-800">
            <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Terms
            </Text>
            <Text className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {terms}
            </Text>
          </View>

          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={onShare}
              className="flex-1 rounded-2xl bg-blue-900 px-4 py-3 items-center justify-center"
            >
              <Text className="text-sm font-bold text-white">Share Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(tradeLink).catch(() => {
                  console.log('Unable to open trade link');
                });
              }}
              className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3 items-center justify-center bg-white dark:bg-zinc-950"
            >
              <Text className="text-sm font-bold text-zinc-900 dark:text-white">View Trade</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(AdCard);
