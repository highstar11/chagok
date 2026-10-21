import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

type Props = {
  radius?: number;
  interactive?: boolean;
  tint?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * 공통 Glass 표면.
 * - iOS 26+ : 시스템 네이티브 Liquid Glass (굴절·하이라이트 포함)
 * - 그 외(Android, 구형 iOS) : 블러 + 하이라이트 그라데이션 + 유리 테두리로 같은 인상을 재현
 */
export function GlassView({ radius = 24, interactive, tint, style, children }: Props) {
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        effect="regular"
        interactive={interactive}
        tintColor={tint}
        colorScheme="light"
        style={[{ borderRadius: radius }, style]}
      >
        {children}
      </LiquidGlassView>
    );
  }

  return (
    <View style={[{ borderRadius: radius }, Platform.OS === 'ios' && styles.shadow, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={20}
          reducedTransparencyFallbackColor="#F2F4F8"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.60)', 'rgba(255,255,255,0.16)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {tint ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.18 }]} /> : null}
      </View>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.8)' },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#1F2A44',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});
