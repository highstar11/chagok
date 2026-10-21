import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { Icon } from './icons';

const SIZE = 58;
const EXTENDED = 140;

type Props = {
  // true면 글자를 접고 동그란 버튼으로 줄어든다 (스크롤 중)
  collapsed: boolean;
  onPress: () => void;
  // 화면 아래에서 띄울 거리 (탭바 위)
  bottom: number;
};

// 엄지가 닿는 오른쪽 아래에 떠 있는 입력 버튼. 평소엔 라벨이 보이고, 스크롤하면 작아진다.
export function AddFab({ collapsed, onPress, bottom }: Props) {
  const { colors } = useTheme();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: collapsed ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [collapsed, t]);

  const width = t.interpolate({ inputRange: [0, 1], outputRange: [EXTENDED, SIZE], extrapolate: 'clamp' });
  const labelOpacity = t.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="지출 입력"
      style={({ pressed }) => ({
        position: 'absolute',
        right: 20,
        bottom,
        transform: [{ scale: pressed ? 0.9 : 1 }],
      })}
    >
      <Animated.View
        style={{
          width,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: colors.accent,
          shadowColor: colors.accent,
          shadowOpacity: 0.4,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Inner>
          <IconBox>
            <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.4} />
          </IconBox>
          <Animated.View style={{ opacity: labelOpacity }}>
            <Label numberOfLines={1}>지출 입력</Label>
          </Animated.View>
        </Inner>
      </Animated.View>
    </Pressable>
  );
}

const Inner = styled.View`
  flex-direction: row;
  align-items: center;
  height: ${SIZE}px;
  overflow: hidden;
  border-radius: ${SIZE / 2}px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: rgba(255, 255, 255, 0.28);
`;
const IconBox = styled.View`
  width: ${SIZE}px;
  height: ${SIZE}px;
  align-items: center;
  justify-content: center;
`;
const Label = styled.Text`
  width: 84px;
  margin-left: -6px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
`;