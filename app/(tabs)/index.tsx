import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdCard from '../../components/AdCard';

// Connecting to your live Vercel backend API!
const API_BASE = 'https://p2pcompanion.com/api';
const EXCHANGES = ['binance', 'okx', 'bybit', 'bitget', 'mexc', 'remitano']; 

export default function TerminalScreen() {
  const [crypto, setCrypto] = useState('USDT');
  const [fiat, setFiat] = useState('USD');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  
  const [isLoading, setIsLoading] = useState(false);
  const [adsByExchange, setAdsByExchange] = useState<Record<string, any[]>>({});

  const fetchAds = async (overrideTradeType?: string, overrideCrypto?: string, overrideFiat?: string) => {
    setIsLoading(true);
    setAdsByExchange({});
    
    const currentTradeType = overrideTradeType || tradeType;
    const currentCrypto = overrideCrypto || crypto;
    const currentFiat = overrideFiat || fiat;

    try {
      const promises = EXCHANGES.map(async (exchange) => {
        const res = await fetch(`${API_BASE}?type=${currentTradeType}&token=${currentCrypto}&fiat=${currentFiat}&exchange=${exchange}`);
        const data = await res.json();
        return { exchange, ads: data.responses || [] };
      });
      const results = await Promise.all(promises);
      const newAds: Record<string, any[]> = {};
      results.forEach(r => { newAds[r.exchange] = r.ads; });
      setAdsByExchange(newAds);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch ads from exchanges");
    }
    setIsLoading(false);
  };

  // Automatically detect user's Fiat based on IP Geo-location when app opens
  useEffect(() => {
    const initLocationAndFetch = async () => {
      let detectedFiat = 'USD';
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
      
      // Auto fetch ads immediately using the detected fiat
      fetchAds('buy', 'USDT', detectedFiat);
    };

    initLocationAndFetch();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#09090b]" edges={['top']}>
      <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Text className="text-4xl font-black text-zinc-900 dark:text-white">Terminal</Text>
            <View className="ml-3 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/50">
              <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</Text>
            </View>
          </View>
          <Text className="text-zinc-500 text-sm">Scan real-time P2P spreads natively across global exchanges.</Text>
        </View>

        {/* Beautiful Filter Container */}
        <View className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 mb-8 shadow-sm">
          
          <View className="flex-row bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl mb-5 border border-zinc-200 dark:border-zinc-800/50">
            <TouchableOpacity 
              onPress={() => setTradeType('buy')} 
              className={`flex-1 py-3 rounded-lg items-center ${tradeType === 'buy' ? 'bg-emerald-500 shadow-sm' : ''}`}
            >
              <Text className={`font-bold ${tradeType === 'buy' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>I want to Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTradeType('sell')} 
              className={`flex-1 py-3 rounded-lg items-center ${tradeType === 'sell' ? 'bg-rose-500 shadow-sm' : ''}`}
            >
              <Text className={`font-bold ${tradeType === 'sell' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>I want to Sell</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4 mb-2">
            <View className="flex-1">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Asset</Text>
              <TextInput 
                value={crypto}
                onChangeText={setCrypto}
                autoCapitalize="characters"
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl px-4 py-3"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Fiat</Text>
              <TextInput 
                value={fiat}
                onChangeText={setFiat}
                autoCapitalize="characters"
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl px-4 py-3"
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => fetchAds()}
            disabled={isLoading}
            className="w-full py-4 mt-5 rounded-xl items-center justify-center bg-zinc-900 dark:bg-white active:scale-95 transition-transform flex-row"
          >
            {isLoading ? (
              <ActivityIndicator color={tradeType === 'buy' ? '#10b981' : '#f43f5e'} />
            ) : (
              <Text className="text-white dark:text-zinc-900 font-bold text-base">Search Offers</Text>
            )}
          </TouchableOpacity>
        </View>

        <View>
          {Object.keys(adsByExchange).length > 0 && (
            <>
              <Text className="text-lg font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-widest text-[11px] ml-1">
                Live Ads Comparison
              </Text>
              {/* THIS is where the magic happens: A Native Horizontal Scroll! */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4 overflow-visible">
                {EXCHANGES.map(ex => (
                  <View key={ex} className="w-[300px] mr-4">
                    <View className="bg-zinc-200 dark:bg-zinc-800 py-3 rounded-t-xl items-center border border-zinc-300 dark:border-zinc-700/80">
                       <Text className="font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{ex}</Text>
                    </View>
                    <View className="bg-zinc-100/50 dark:bg-zinc-900/30 p-3 rounded-b-xl border border-t-0 border-zinc-300 dark:border-zinc-700/80 min-h-[150px]">
                      {adsByExchange[ex]?.map((ad, idx) => (
                        <AdCard key={ad.id || ad.adNo || idx} ad={ad} fiat={fiat} crypto={crypto} />
                      ))}
                      {(!adsByExchange[ex] || adsByExchange[ex].length === 0) && (
                        <Text className="text-center text-zinc-500 font-bold py-8">{isLoading ? "Searching..." : "No ads found"}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}