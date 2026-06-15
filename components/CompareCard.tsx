import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function CompareCard({ ad, fiat, crypto, exchange }: any) {
  const [expanded, setExpanded] = useState(false);
  const price = Number(ad.price) || 0;
  const min = ad.min || ad.minAmount || ad.minValue || ad.minTotal || '';
  const max = ad.max || ad.maxAmount || ad.maxValue || ad.maxTotal || '';
  const rawPayments = ad.paymentMethods || ad.payments || ad.payment || [];
  const paymentMethods = Array.isArray(rawPayments) ? rawPayments : [rawPayments];
  const termsRaw = ad.terms || ad.note || ad.termsAndConditions || '';

  const ensureString = (value: any) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const resolvePaymentMethodLabel = (payment: any) => {
    if (typeof payment === 'string') return payment;
    if (!payment || typeof payment !== 'object') return 'Bank Transfer';

    const candidate = [payment.name, payment.identifier, payment.type].find(
      (value) => typeof value === 'string',
    );
    if (typeof candidate === 'string') return candidate;
    return ensureString(payment.name) || ensureString(payment.identifier) || ensureString(payment.type) || 'Bank Transfer';
  };

  const openTrade = async () => {
    let appUrl = '';
    const exchangeLower = exchange?.toLowerCase() || '';

    switch (exchangeLower) {
      case 'binance': appUrl = 'binance://'; break;
      case 'okx': appUrl = 'okx://'; break;
      case 'bybit': appUrl = 'bybitapp://'; break;
      case 'kucoin': appUrl = 'kucoin://'; break;
    }

    const tradeLink = ad.tradeUrl || ad.url || ad.link;

    if (appUrl) {
      try {
        await Linking.openURL(appUrl);
        setTimeout(() => {
          if (tradeLink) Linking.openURL(tradeLink).catch(() => { });
        }, 1000);
        return;
      } catch (err) {
        console.log('Deep link failed, falling back to web', err);
      }
    }

    if (tradeLink) {
      Linking.openURL(tradeLink).catch(() => { });
    }
  };

  const visiblePayments = expanded ? paymentMethods : paymentMethods.slice(0, 2);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => setExpanded((current) => !current)}
      className="w-72 mx-3 bg-white dark:bg-zinc-900 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[32px] p-5 shadow-sm"
    >
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <View className="bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg self-start mb-1.5">
            <Text className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{exchange?.toUpperCase()}</Text>
          </View>
          <Text className="text-sm font-bold text-zinc-500 dark:text-zinc-400 ml-1">{crypto} / {fiat}</Text>
        </View>
        <View className="items-end">
          <Text className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{price.toFixed(2)}</Text>
          <Text className="text-xs font-medium text-zinc-400 dark:text-zinc-500">per {crypto}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {(visiblePayments.length ? visiblePayments : ['Bank Transfer']).map((p: any, i: number) => {
          const label = resolvePaymentMethodLabel(p);
          return (
            <View key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/50">
              <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{label}</Text>
            </View>
          );
        })}
        {!expanded && paymentMethods.length > 2 ? (
          <View className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">+{paymentMethods.length - 2} more</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
        <View>
          <Text className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-0.5">Min</Text>
          <Text className="text-xs font-black text-zinc-700 dark:text-zinc-200">{ensureString(min)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-0.5">Max</Text>
          <Text className="text-xs font-black text-zinc-700 dark:text-zinc-200">{ensureString(max)}</Text>
        </View>
      </View>

      <View className="mb-4">
        <Text numberOfLines={expanded ? undefined : 2} className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {ensureString(termsRaw) || "No special terms specified ✨"}
        </Text>
        <Text className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mt-3">
          {expanded ? 'Tap again to collapse 🌸' : 'Tap card to expand ✨'}
        </Text>
      </View>

      {expanded ? (
        <View className="rounded-[24px] bg-emerald-50/50 dark:bg-emerald-900/10 p-4 border-2 border-emerald-100/50 dark:border-emerald-800/30 mb-4">
          <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Full Details</Text>
          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-3">
            {`Showing ${paymentMethods.length} payment methods and full terms`}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {paymentMethods.map((p: any, i: number) => (
              <View key={`detail-${i}`} className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Text className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{resolvePaymentMethodLabel(p)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <TouchableOpacity onPress={openTrade} className="flex-1 rounded-2xl bg-emerald-500 py-3.5 items-center justify-center shadow-md active:opacity-80 flex-row gap-2">
          <Text className="text-white font-black tracking-wide text-sm">Open Trade</Text>
          <Text className="text-sm">🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 items-center justify-center active:opacity-80 shadow-sm">
          <Text className="text-zinc-600 dark:text-zinc-400 text-lg font-bold">⋯</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
