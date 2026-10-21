import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chevron } from './Chevron';
import { WEEKDAYS, isSameDay, startOfDay } from '../utils/date';

type Props = {
  visible: boolean;
  value: Date;
  // 고를 수 있는 마지막 날 (보통 오늘)
  max: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
};

export function DateSheet({ visible, ...rest }: Props) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={rest.onClose}>
      <Sheet {...rest} />
    </Modal>
  );
}

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

function Sheet({ value, max, onSelect, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { height: screenH } = useWindowDimensions();
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  // 시트의 translateY. 0 = 완전히 열림, screenH = 화면 밖
  const y = useRef(new Animated.Value(screenH)).current;

  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [y]);

  const dismiss = () => {
    Animated.timing(y, { toValue: screenH, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
      ({ finished }) => finished && onClose(),
    );
  };

  // 핸들 영역을 아래로 드래그해서 닫기
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => y.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 100 || g.vy > 0.8) {
            Animated.timing(y, { toValue: screenH, duration: 200, useNativeDriver: true }).start(
              ({ finished }) => finished && onClose(),
            );
          } else {
            Animated.spring(y, { toValue: 0, bounciness: 4, useNativeDriver: true }).start();
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenH],
  );

  const backdropOpacity = y.interpolate({
    inputRange: [0, screenH],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cells = useMemo(() => {
    const yr = cursor.getFullYear();
    const m = cursor.getMonth();
    const count = new Date(yr, m + 1, 0).getDate();
    const arr: (Date | null)[] = Array(cursor.getDay()).fill(null);
    for (let i = 1; i <= count; i++) arr.push(new Date(yr, m, i));
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [cursor]);

  const today = startOfDay(new Date());
  const canNext = monthIndex(cursor) < monthIndex(max);
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <Root>
      {/* 딤 처리된 배경 */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="닫기" />
      </Animated.View>

      {/* 바텀시트 */}
      <SheetBody
        style={{
          backgroundColor: '#FFFFFF',
          paddingBottom: insets.bottom + 20,
          transform: [{ translateY: y }],
        }}
      >
        <HandleArea {...pan.panHandlers}>
          <Handle />
        </HandleArea>

        <MonthRow>
          <MonthTitle>
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </MonthTitle>
          <Steps>
            <Pressable onPress={() => move(-1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="이전 달" style={stepStyle}>
              <Chevron dir="left" color={colors.text} />
            </Pressable>
            <Pressable
              disabled={!canNext}
              onPress={() => move(1)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="다음 달"
              style={[stepStyle, { opacity: canNext ? 1 : 0.25 }]}
            >
              <Chevron dir="right" color={colors.text} />
            </Pressable>
          </Steps>
        </MonthRow>

        <WeekRow>
          {WEEKDAYS.map((w) => (
            <Cell key={w} style={{ height: 28 }}>
              <WeekText>{w}</WeekText>
            </Cell>
          ))}
        </WeekRow>

        <Grid>
          {cells.map((date, i) => {
            if (!date) return <Cell key={i} />;
            const future = date > max;
            const selected = isSameDay(date, value);
            const isToday = isSameDay(date, today);
            return (
              <Cell key={i}>
                <Pressable
                  disabled={future}
                  onPress={() => onSelect(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                  accessibilityState={{ selected, disabled: future }}
                >
                  <DayCircle style={{ backgroundColor: selected ? colors.accent : 'transparent', opacity: future ? 0.28 : 1 }}>
                    <DayNum
                      style={{
                        color: selected ? '#FFFFFF' : isToday ? colors.accent : colors.text,
                        fontWeight: selected || isToday ? '700' : '500',
                      }}
                    >
                      {date.getDate()}
                    </DayNum>
                  </DayCircle>
                </Pressable>
              </Cell>
            );
          })}
        </Grid>

        <Pressable onPress={() => onSelect(today)} accessibilityRole="button" accessibilityLabel="오늘로 이동">
          <TodayBtn style={{ backgroundColor: colors.track }}>
            <TodayBtnText style={{ color: colors.accent }}>오늘</TodayBtnText>
          </TodayBtn>
        </Pressable>
      </SheetBody>
    </Root>
  );
}

const stepStyle = { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' } as const;

const Root = styled.View`
  flex: 1;
  justify-content: flex-end;
`;
const SheetBody = styled(Animated.View)`
  padding-horizontal: 20px;
  border-top-left-radius: 36px;
  border-top-right-radius: 36px;
`;
const HandleArea = styled.View`
  align-items: center;
  padding-top: 16px;
  padding-bottom: 20px;
`;
const Handle = styled.View`
  width: 48px;
  height: 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.2);
`;
const MonthRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 12px;
`;
const MonthTitle = styled.Text`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1px;
  color: ${({ theme }) => theme.colors.text};
`;
const Steps = styled.View`
  flex-direction: row;
`;
const WeekRow = styled.View`
  flex-direction: row;
  margin-top: 12px;
`;
const WeekText = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.subText};
`;
const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;
const Cell = styled.View`
  width: 14.2857%;
  height: 54px;
  align-items: center;
  justify-content: center;
`;
const DayCircle = styled.View`
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
`;
const DayNum = styled.Text`
  font-size: 16px;
`;
const TodayBtn = styled.View`
  height: 52px;
  margin-top: 12px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
`;
const TodayBtnText = styled.Text`
  font-size: 16px;
  font-weight: 700;
`;