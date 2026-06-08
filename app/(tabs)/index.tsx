import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdCard from '../../components/AdCard';

const API_BASE = 'https://p2pcompanion.com/api';
const EXCHANGES = ['binance', 'okx', 'bybit', 'bitget', 'mexc', 'remitano'];
const DEFAULT_CRYPTO = 'USDT';
const DEFAULT_FIAT = 'USD';

export default function TerminalScreen() {
  const [crypto, setCrypto] = useState(DEFAULT_CRYPTO);
  const [fiat, setFiat] = useState(DEFAULT_FIAT);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedExchanges, setSelectedExchanges] = useState(EXCHANGES);

  const [isLoading, setIsLoading] = useState(false);
  const [adsByExchange, setAdsByExchange] = useState<Record<string, any[]>>({});
  const [filtersOpen, setFiltersOpen] = useState(true);

  const fetchAds = async (
    overrideTradeType?: string,
    overrideCrypto?: string,
    overrideFiat?: string,
    overrideExchanges?: string[],
  ) => {
    const currentTradeType = overrideTradeType || tradeType;
    const currentCrypto = overrideCrypto || crypto;
    const currentFiat = overrideFiat || fiat;
    const exchangesToQuery = overrideExchanges || selectedExchanges;

    if (exchangesToQuery.length === 0) {
      Alert.alert('Select at least one exchange', 'Please choose an exchange to search.');
      return;
    }

    setIsLoading(true);
    setAdsByExchange({});

    try {
      const promises = exchangesToQuery.map(async (exchange) => {
        const url = `${API_BASE}?type=${currentTradeType}&token=${currentCrypto}&fiat=${currentFiat}&exchange=${exchange}`;
        const res = await fetch(url);
        const data = await res.json();
        return { exchange, ads: data.responses || [] };
      });

      const results = await Promise.all(promises);
      const newAds: Record<string, any[]> = {};
      results.forEach((r) => {
        newAds[r.exchange] = r.ads;
      });
      setAdsByExchange(newAds);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch ads from exchanges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initLocationAndFetch = async () => {
      let detectedFiat = DEFAULT_FIAT;
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        if (geoData?.currency) {
          detectedFiat = geoData.currency;
          setFiat(detectedFiat);
        }
      } catch (error) {
        console.log('GeoIP fetch failed, defaulting to USD');
      }

      fetchAds('buy', DEFAULT_CRYPTO, detectedFiat);
    };

    initLocationAndFetch();
  }, []);

  const toggleExchange = (exchange: string) => {
    setSelectedExchanges((current) =>
      current.includes(exchange)
        ? current.filter((item) => item !== exchange)
        : [...current, exchange],
    );
  };

  const activeExchanges = selectedExchanges.length ? selectedExchanges : EXCHANGES;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#09090b]" edges={['top']}>
      <ScrollView
        className="flex-1 px-4 py-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-4xl font-black text-zinc-900 dark:text-white">Terminal</Text>
              <Text className="text-zinc-500 text-sm mt-2">
                Scan real-time P2P spreads across global exchanges.
              </Text>
            </View>
            <View className="ml-3 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
              <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                LIVE
              </Text>
            </View>
          </View>

          <View className="rounded-3xl bg-white/10 dark:bg-zinc-950/30 border border-white/15 dark:border-zinc-800/50 p-5 shadow-xl mb-6">
            <TouchableOpacity
              onPress={() => setFiltersOpen((open) => !open)}
              className="flex-row items-center justify-between mb-4"
            >
              <View>
                <Text className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Filters
                </Text>
                <Text className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">
                  {tradeType === 'buy' ? 'Buy orders' : 'Sell orders'} • {activeExchanges.length} exchanges
                </Text>
              </View>
              <Text className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300">
                {filtersOpen ? 'Collapse' : 'Expand'}
              </Text>
            </TouchableOpacity>

            {filtersOpen && (
              <View>
                <View className="flex-row bg-zinc-100 dark:bg-zinc-950 p-1 rounded-2xl mb-4 border border-zinc-200 dark:border-zinc-800/50">
                  <TouchableOpacity
                    onPress={() => {
                      setTradeType('buy');
                      fetchAds('buy');
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${tradeType === 'buy' ? 'bg-emerald-500 shadow-sm' : ''}`}
                  >
                    <Text
                      className={`font-bold ${
                        tradeType === 'buy' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      I want to Buy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setTradeType('sell');
                      fetchAds('sell');
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${tradeType === 'sell' ? 'bg-rose-500 shadow-sm' : ''}`}
                  >
                    <Text
                      className={`font-bold ${
                        tradeType === 'sell' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      I want to Sell
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-4 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                      Asset
                    </Text>
                    <TextInput
                      value={crypto}
                      onChangeText={setCrypto}
                      autoCapitalize="characters"
                      className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl px-4 py-3"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                      Fiat
                    </Text>
                    <TextInput
                      value={fiat}
                      onChangeText={setFiat}
                      autoCapitalize="characters"
                      className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-2xl px-4 py-3"
                    />
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 mb-4">
                  {EXCHANGES.map((exchange) => {
                    const selected = selectedExchanges.includes(exchange);
                    return (
                      <TouchableOpacity
                        key={exchange}
                        onPress={() => toggleExchange(exchange)}
                        className={`rounded-full border px-4 py-2 ${
                          selected
                            ? 'border-emerald-500 bg-emerald-500/15'
                            : 'border-zinc-200 bg-transparent dark:border-zinc-800'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold uppercase tracking-widest ${
                            selected
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {exchange}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 mb-8 shadow-sm">
          <View className="flex-row bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl mb-5 border border-zinc-200 dark:border-zinc-800/50">
            <TouchableOpacity
              onPress={() => {
                setTradeType('buy');
                fetchAds('buy');
              }}
              className={`flex-1 py-3 rounded-lg items-center ${tradeType === 'buy' ? 'bg-emerald-500 shadow-sm' : ''}`}
            >
              <Text
                className={`font-bold ${
                  tradeType === 'buy' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                I want to Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTradeType('sell');
                fetchAds('sell');
              }}
              className={`flex-1 py-3 rounded-lg items-center ${tradeType === 'sell' ? 'bg-rose-500 shadow-sm' : ''}`}
            >
              <Text
                className={`font-bold ${
                  tradeType === 'sell' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                I want to Sell
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                Asset
              </Text>
              <TextInput
                value={crypto}
                onChangeText={setCrypto}
                autoCapitalize="characters"
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl px-4 py-3"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                Fiat
              </Text>
              <TextInput
                value={fiat}
                onChangeText={setFiat}
                autoCapitalize="characters"
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl px-4 py-3"
              />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-5">
            {EXCHANGES.map((exchange) => {
              const selected = selectedExchanges.includes(exchange);
              return (
                <TouchableOpacity
                  key={exchange}
                  onPress={() => toggleExchange(exchange)}
                  className={`rounded-full border px-4 py-2 ${
                    selected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-200 bg-transparent dark:border-zinc-800'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      selected
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {exchange}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => fetchAds()}
            disabled={isLoading}
            className="w-full py-4 mt-1 rounded-xl items-center justify-center bg-zinc-900 dark:bg-white active:scale-95 transition-transform flex-row"
          >
            {isLoading ? (
              <ActivityIndicator color={tradeType === 'buy' ? '#10b981' : '#f43f5e'} />
            ) : (
              <Text className="text-white dark:text-zinc-900 font-bold text-base">Search Offers</Text>
            )}
          </TouchableOpacity>
        </View>

        {activeExchanges.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-widest text-[11px] ml-1">
              Live Ads Comparison
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4 overflow-visible">
              {activeExchanges.map((exchange) => (
                <View key={exchange} className="w-[300px] mr-4">
                  <View className="bg-zinc-200 dark:bg-zinc-800 py-3 rounded-t-xl items-center border border-zinc-300 dark:border-zinc-700/80">
                    <Text className="font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                      {exchange}
                    </Text>
                  </View>
                  <View className="bg-zinc-100/50 dark:bg-zinc-900/30 p-3 rounded-b-xl border border-t-0 border-zinc-300 dark:border-zinc-700/80 min-h-[150px]">
                    {adsByExchange[exchange]?.map((ad, idx) => (
                      <AdCard
                        key={ad.id || ad.adNo || idx}
                        ad={ad}
                        fiat={fiat}
                        crypto={crypto}
                        exchange={exchange}
                      />
                    ))}
                    {(!adsByExchange[exchange] || adsByExchange[exchange].length === 0) && (
                      <Text className="text-center text-zinc-500 font-bold py-8">
                        {isLoading ? 'Searching...' : 'No ads found'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
