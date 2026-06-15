import React, { useState } from 'react';
import { Linking, Share, Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

function AdCard({
  ad,
  fiat,
  crypto,
  exchange,
  tradeType,
  isExpanded,
  onToggle
}: {
  ad: any;
  fiat: string;
  crypto: string;
  exchange?: string;
  tradeType?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const [localDetailsOpen, setLocalDetailsOpen] = useState(false);
  const detailsOpen = isExpanded !== undefined ? isExpanded : localDetailsOpen;

  const handleToggle = () => {
    if (onToggle) onToggle();
    else setLocalDetailsOpen(!localDetailsOpen);
  };

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
    ad.merchantStats?.monthOrderCount || ad.monthOrderCount || ad.orderCount || ad.userStats?.monthOrderCount || ad.advertiser?.monthOrderCount || ad.tradeCount || 0;
  const terms = ad.terms || ad.note || ad.termsAndConditions || 'No terms provided';
  const isNewUserOnly = ad.isNewUserOnly || ad.newUserOnly || ad.onlyNewUser || false;
  const officialMarketRate = Number(ad.marketRate ?? ad.officialRate ?? 0) || 0;
  const premium = officialMarketRate > 0
    ? (((Number(ad.price || 0) - officialMarketRate) / officialMarketRate) * 100).toFixed(2)
    : null;

  const getDynamicLink = () => {
    const ex = exchange?.toLowerCase() || '';
    const t = tradeType?.toLowerCase() || 'buy';
    const c = crypto?.toUpperCase() || 'USDT';
    const f = fiat?.toUpperCase() || 'USD';
    const advNo = ad.advNo || ad.id || '';
    const userId = ad.advertiser?.userId || ad.userId || '';

    switch (ex) {
      case 'binance':
        if (advNo) return `https://p2p.binance.com/en/adv?code=${advNo}&ref=GRO_28502_JGH8O`;
        return `https://p2p.binance.com/en/trade/${t}/${c}?fiat=${f}&ref=GRO_28502_JGH8O`;
      case 'okx':
        return `https://www.okx.com/p2p-markets/${f}/${t}-${c}?channelId=33289858`;
      case 'bybit':
        if (userId) return `https://www.bybit.com/fiat/trade/otc/profile/${userId}?ref=KV7G85`;
        return `https://www.bybit.com/fiat/trade/otc/?actionType=${t === 'buy' ? '1' : '0'}&token=${c}&fiat=${f}&ref=KV7G85`;
      case 'mexc':
        return `https://www.mexc.com/p2p/trade?currency=${f}&inviteCode=SnyTdGPYGL`;
      case 'bitget':
        if (advNo) return `https://www.bitget.com/p2p-trade/ad-details?adNo=${advNo}&channelCode=N8X39VA9`;
        return `https://www.bitget.com/p2p-trade?fiatName=${f}&coinName=${c}&channelCode=N8X39VA9`;
      case 'kucoin':
        return `https://www.kucoin.com/p2p/fiat-trade/?fiat=${f}&rcode=CXEVMU19`;
      case 'remitano':
        return 'https://remitano.com/p2p';
      default:
        return `https://p2pcompanion.com/trade/${advNo}`;
    }
  };
  
  const tradeLink = getDynamicLink();

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
    <View 
      className="bg-white/80 dark:bg-zinc-900/80 border border-white/50 dark:border-zinc-700/50 rounded-2xl p-3 mb-3 shadow-[0_4px_15px_rgba(0,0,0,0.05)] overflow-hidden"
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggle}
      >
        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5">
              <Image 
                source={{ uri: `https://www.google.com/s2/favicons?domain=${exchange?.toLowerCase() || 'binance'}.com&sz=128` }} 
                style={{ width: 12, height: 12, borderRadius: 2 }} 
              />
              <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {exchange?.toUpperCase()}
              </Text>
              {isNewUserOnly && (
                <View className="rounded-sm bg-blue-100/80 dark:bg-blue-900/50 px-1 py-0.5">
                  <Text className="text-[8px] uppercase tracking-widest font-black text-blue-700 dark:text-blue-300">
                    New User
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <Text className="text-xl font-black text-zinc-900 dark:text-white" numberOfLines={1}>
            {ad.price ?? '--'} <Text className="text-xs font-bold text-zinc-400 dark:text-zinc-500">{fiat}</Text>
          </Text>
          
          <Text className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-1" numberOfLines={1}>
            Avl: <Text className="text-emerald-600 dark:text-emerald-400">{displayAmount()}</Text>
          </Text>

          <Text className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-1.5" numberOfLines={1}>
            {advertiserName} • {completion}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-zinc-100/50 dark:border-zinc-800/50">
          <View className="flex-row flex-wrap gap-1 flex-1 overflow-hidden">
            {paymentMethods.length > 0 ? paymentMethods.slice(0, 2).map((m: any, idx: number) => {
              const label = typeof m === 'string' ? m : m?.name || m?.identifier || m?.type || String(m);
              return (
                <Text key={idx} numberOfLines={1} className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-100 dark:border-zinc-800 max-w-[60px]">
                  {label}
                </Text>
              );
            }) : (
              <Text className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">Any Bank</Text>
            )}
          </View>
          <View className="ml-1 justify-center">
            <Ionicons 
              name={detailsOpen ? 'chevron-up' : 'chevron-down'} 
              size={14} 
              color="#3b82f6"
            />
          </View>
        </View>
      </TouchableOpacity>

      {detailsOpen && (
        <View className="mt-3 pt-3 border-t border-zinc-100/50 dark:border-zinc-800/50">
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Stock</Text>
              <Text className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200" numberOfLines={1}>
                {ensureString(availableAmount)} {crypto}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5">Orders</Text>
              <Text className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200" numberOfLines={1}>
                {ensureString(orderCount30d)}
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Terms</Text>
            <ScrollView 
              nestedScrollEnabled={true} 
              className="max-h-32 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg p-2 border border-zinc-100/50 dark:border-zinc-800/50"
            >
              <Text 
                className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed pb-2" 
              >
                {ensureString(terms) || 'No terms provided'}
              </Text>
            </ScrollView>
          </View>

          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(tradeLink).catch(() => console.log('Unable to open link'));
              }}
              className="flex-1 rounded-lg bg-emerald-500 dark:bg-emerald-600 px-3 py-2 items-center justify-center flex-row gap-1 shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
            >
              <Ionicons name="cart" size={14} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onShare}
              className="flex-1 rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm"
            >
              <Ionicons name="share-social" size={14} color="#71717a" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default React.memo(AdCard);
