import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { Icon } from './icons';

const SIZE = 54;
const EXTENDED = 128;
const EASE = Easing.bezier(0.2, 0, 0, 1); // 빠르게 시작해서 부드럽게 안착

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

  // width는 레이아웃 속성이라 JS 드라이버, 나머지는 네이티브 드라이버로 분리
  const width = useRef(new Animated.Value(collapsed ? SIZE : EXTENDED)).current;
  const label = useRef(new Animated.Value(collapsed ? 0 : 1)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(width, {
        toValue: collapsed ? SIZE : EXTENDED,
        duration: 280,
        easing: EASE,
        useNativeDriver: false,
      }),
      // 접을 땐 글자가 먼저 빠르게 사라지고, 펼칠 땐 너비가 어느 정도 열린 뒤 나타난다
      Animated.timing(label, {
        toValue: collapsed ? 0 : 1,
        duration: collapsed ? 110 : 180,
        delay: collapsed ? 0 : 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [collapsed, width, label]);

  const animatePress = (to: number) =>
    Animated.spring(press, {
      toValue: to,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start();

  const labelTranslate = label.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 20,
        bottom,
        transform: [{ scale: press }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => animatePress(0.94)}
        onPressOut={() => animatePress(1)}
        accessibilityRole="button"
        accessibilityLabel="지출 입력"
      >
        <Animated.View
          style={{
            width,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: colors.accent,
            // 색 글로우 대신 중립색의 얕은 그림자 + 가는 외곽선으로 배경과 분리
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(0, 0, 0, 0.12)',
            shadowColor: '#000000',
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
            elevation: 5,
          }}
        >
          <Inner>
            <IconBox>
              <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.4} />
            </IconBox>
            <Animated.View style={{ opacity: label, transform: [{ translateX: labelTranslate }] }}>
              <Label numberOfLines={1}>지출 입력</Label>
            </Animated.View>
          </Inner>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const Inner = styled.View`
  flex-direction: row;
  align-items: center;
  height: ${SIZE}px;
  overflow: hidden;
  border-radius: ${SIZE / 2}px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: rgba(255, 255, 255, 0.14);
`;
const IconBox = styled.View`
  width: ${SIZE - 2}px;
  height: ${SIZE - 2}px;
  align-items: center;
  justify-content: center;
`;
const Label = styled.Text`
  width: 84px;
  margin-left: -6px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
`;