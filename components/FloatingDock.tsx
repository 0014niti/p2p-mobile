import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { SymbolView } from 'expo-symbols';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useDerivedValue,
  withSpring
} from 'react-native-reanimated';

export default function FloatingDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const activeIndex = useDerivedValue(() => {
    return withSpring(state.index, { damping: 20, stiffness: 200 });
  });

  return (
    <View 
      style={{ 
        position: 'absolute', 
        bottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20, 
        left: 0, 
        right: 0, 
        alignItems: 'center',
        paddingHorizontal: 20
      }}
    >
      <View 
        className="flex-row items-center px-4 py-2 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/20 dark:border-zinc-700/50"
        style={{
          backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const indicatorStyle = useAnimatedStyle(() => {
            const opacity = withTiming(isFocused ? 1 : 0, { duration: 150 });
            return {
              opacity,
              transform: [{ scale: isFocused ? withSpring(1) : withTiming(0.5) }]
            };
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              className="px-6 py-2 items-center justify-center relative"
            >
              <Animated.View 
                style={[
                  StyleSheet.absoluteFill, 
                  indicatorStyle,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 20,
                  }
                ]} 
              />
              <SymbolView
                name={
                  route.name === 'Terminal' 
                    ? { ios: 'chart.bar.fill', android: 'trending_up', web: 'trending_up' } 
                    : { ios: 'message.fill', android: 'chat', web: 'chat' }
                }
                tintColor={isFocused ? '#10b981' : (isDark ? '#71717a' : '#a1a1aa')}
                size={24}
              />
              <Text 
                className={`text-[10px] font-bold mt-1 ${isFocused ? 'text-emerald-500' : (isDark ? 'text-zinc-500' : 'text-zinc-400')}`}
              >
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
