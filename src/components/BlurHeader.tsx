import React from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import MaskedViewBase from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// @types/react 버전 충돌로 클래스 컴포넌트가 JSX로 인식되지 않는 문제를 우회
type MaskedViewProps = ViewProps & { maskElement: React.ReactElement; children?: React.ReactNode };
const MaskedView = MaskedViewBase as unknown as React.ComponentType<MaskedViewProps>;

// 상태바 아래 고정 헤더 콘텐츠 영역 높이 
export const HEADER_CONTENT_HEIGHT = 72;
// 블러가 콘텐츠 아래로 번져서 사라지는 구간
const FADE_EXTRA = 36;

type Props = {
  scrollY: Animated.Value;
  children: React.ReactNode;
};

export function BlurHeader({ scrollY, children }: Props) {
  const insets = useSafeAreaInsets();
  const height = insets.top + HEADER_CONTENT_HEIGHT;

  const opacity = scrollY.interpolate({
    inputRange: [0, 24],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[styles.blurLayer, { bottom: -FADE_EXTRA, opacity }]}
      >
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={['rgba(0,0,0,1)', 'rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor="#F4EDFF"
          />
          {/* 배경색을 살짝 덮어 글자가 겹쳐 보이지 않게 */}
          <LinearGradient
            colors={['rgba(240,243,255,0.75)', 'rgba(240,243,255,0.45)']}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Animated.View>

      {/* 고정 헤더 콘텐츠 */}
      <View style={[styles.content, { paddingTop: insets.top }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  blurLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
});