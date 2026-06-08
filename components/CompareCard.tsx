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

  const openTrade = () => {
    const url = ad.tradeUrl || ad.url || ad.link;
    if (url) Linking.openURL(url).catch(() => {});
  };

  const visiblePayments = expanded ? paymentMethods : paymentMethods.slice(0, 2);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => setExpanded((current) => !current)}
      className="w-72 mx-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View>
          <Text className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{exchange?.toUpperCase()}</Text>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{crypto}/{fiat}</Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-extrabold text-zinc-900 dark:text-white">{price.toFixed(2)}</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">per {crypto}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {(visiblePayments.length ? visiblePayments : ['Bank Transfer']).map((p: any, i: number) => {
          const label = resolvePaymentMethodLabel(p);
          return (
            <View key={i} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
              <Text className="text-xs text-zinc-700 dark:text-zinc-300">{label}</Text>
            </View>
          );
        })}
        {!expanded && paymentMethods.length > 2 ? (
          <View className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
            <Text className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400">+{paymentMethods.length - 2} more</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs text-zinc-500">
          Min: <Text className="font-semibold text-zinc-700 dark:text-white">{ensureString(min)}</Text>
        </Text>
        <Text className="text-xs text-zinc-500">
          Max: <Text className="font-semibold text-zinc-700 dark:text-white">{ensureString(max)}</Text>
        </Text>
      </View>

      <View className="mb-3">
        <Text numberOfLines={expanded ? undefined : 2} className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {ensureString(termsRaw)}
        </Text>
        <Text className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2">
          {expanded ? 'Tap again to collapse' : 'Tap card to expand'}
        </Text>
      </View>

      {expanded ? (
        <View className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800 mb-3">
          <Text className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Expanded details</Text>
          <Text className="text-xs text-zinc-600 dark:text-zinc-300 mb-3">
            {`Showing ${paymentMethods.length} payment methods and full terms`}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {paymentMethods.map((p: any, i: number) => (
              <View key={`detail-${i}`} className="px-2 py-1 bg-white dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800">
                <Text className="text-[10px] text-zinc-700 dark:text-zinc-300">{resolvePaymentMethodLabel(p)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <TouchableOpacity onPress={openTrade} className="flex-1 rounded-lg bg-emerald-500 py-2 items-center">
          <Text className="text-white font-bold">Open trade</Text>
        </TouchableOpacity>
        <View className="w-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 items-center justify-center">
          <Text className="text-zinc-700 dark:text-zinc-300">⋯</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

