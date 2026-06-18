import "./global.css";
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { registerBackgroundNostrSync } from './src/lib/backgroundEngine';
import { useColorScheme } from './components/useColorScheme';

const BACKGROUND_FETCH_TASK = 'background-fetch-ads';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { handleBackgroundFetch } = await import('./src/lib/backgroundFetch');
    const hasNewAlerts = await handleBackgroundFetch();
    return hasNewAlerts ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

import TerminalScreen from './src/screens/TerminalScreen';
import ChatScreen from './src/screens/ChatScreen';
import InboxScreen from './src/screens/InboxScreen';
import FloatingDock from './components/FloatingDock';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      tabBar={props => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'chart.bar.fill',
                android: 'trending_up',
                web: 'trending_up',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Inbox" 
        component={InboxScreen} 
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="mail" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'message.fill',
                android: 'chat',
                web: 'chat',
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    async function setupNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err) {
        console.log('Background fetch registration failed:', err);
      }
    }
    
    setupNotifications();
    registerBackgroundNostrSync();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <BottomSheetModalProvider>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
          </Stack.Navigator>
        </BottomSheetModalProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
