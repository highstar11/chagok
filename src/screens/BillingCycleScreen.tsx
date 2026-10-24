import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import { GlassView } from '../components/GlassView';
import { useSettings } from '../settings/SettingsContext';
import { formatMonthDay, getCycleRange } from '../utils/cycle';

const ITEM_H = 48;
const VISIBLE = 5; // 가운데 선택 + 위아래 2칸
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// 1~31일을 고르는 휠 피커. 가운데에 걸린 값이 선택 값
function DayWheel({ initial, onChange }: { initial: number; onChange: (day: number) => void }) {
  const y = useRef(new Animated.Value((initial - 1) * ITEM_H)).current;
  const ref = useRef<any>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: (initial - 1) * ITEM_H, animated: false }), 0);
    return () => clearTimeout(t);
    // 처음 한 번만 초기 위치로 이동
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(DAYS.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    onChange(i + 1);
  };

  return (
    <WheelBox style={{ height: ITEM_H * VISIBLE }}>
      <Band pointerEvents="none" style={{ top: ITEM_H * 2, height: ITEM_H }} />
      <Animated.ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
          useNativeDriver: true,
          listener: handleScroll,
        })}
      >
        {DAYS.map((d, i) => {
          const input = [(i - 2) * ITEM_H, (i - 1) * ITEM_H, i * ITEM_H, (i + 1) * ITEM_H, (i + 2) * ITEM_H];
          const opacity = y.interpolate({
            inputRange: input,
            outputRange: [0.12, 0.4, 1, 0.4, 0.12],
            extrapolate: 'clamp',
          });
          const scale = y.interpolate({
            inputRange: input,
            outputRange: [0.78, 0.9, 1, 0.9, 0.78],
            extrapolate: 'clamp',
          });
          return (
            <Pressable key={d} onPress={() => ref.current?.scrollTo({ y: i * ITEM_H, animated: true })}>
              <Animated.View
                style={{
                  height: ITEM_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity,
                  transform: [{ scale }],
                }}
              >
                <DayText>
                  {d}
                  <DayUnit>일</DayUnit>
                </DayText>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
    </WheelBox>
  );
}

export function BillingCycleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { billingDay, setBillingDay } = useSettings();

  // 저장하면 billingDay가 바뀌므로, 처음 진입 시점의 모드를 고정해 둔다
  const isFirstRun = useRef(billingDay == null).current;
  const [day, setDay] = useState(billingDay ?? 1);
  const [saving, setSaving] = useState(false);

  const range = useMemo(() => getCycleRange(day), [day]);

  const note =
    day === 1
      ? '월초부터 말일까지, 달력 한 달과 같아요'
      : `매월 ${day}일에 새 기록이 시작돼요.${day > 28 ? ' (짧은 달은 말일 기준)' : ''}`;

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    await setBillingDay(day);
    // 처음 설정이면 저장과 동시에 홈으로 전환되고, 수정 모달이면 닫는다
    if (!isFirstRun) navigation.goBack();
  };

  return (
    <Root>
      <Top style={{ paddingTop: insets.top + 32 }}>
        {isFirstRun ? (
          <Brand></Brand>
        ) : (
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Cancel>취소</Cancel>
          </Pressable>
        )}
        <Title>{'카드값 기록 기간을 정해 주세요'}</Title>
        <Sub>{'카드 결제일에 맞춰 지출을 한 달 단위로\n모아서 보여드릴게요.'}</Sub>
      </Top>

      <GlassView radius={32} style={{ marginHorizontal: 20, marginTop: 24, paddingTop: 24}}>
        <WheelCaption>매월 시작일</WheelCaption>
        <DayWheel initial={day} onChange={setDay} />
      </GlassView>

      <GlassView radius={32} style={{ marginHorizontal: 20, marginTop: 20, padding: 24 }}>
        <PrevLabel>정산 기간</PrevLabel>
        <PrevRange>
          {formatMonthDay(range.start)} ~ {formatMonthDay(range.end)}
        </PrevRange>
        <PrevNote>{note}</PrevNote>
        <PrevNoteSecond>다음 기록까지 {range.daysUntilNext}일 남았어요</PrevNoteSecond>
      </GlassView>

      <Spacer />

      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        style={({ pressed }) => ({
          marginHorizontal: 20,
          marginBottom: insets.bottom + 20,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
          opacity: pressed || saving ? 0.75 : 1,
        })}
      >
        <CtaText>{isFirstRun ? '시작하기' : '저장'}</CtaText>
      </Pressable>
    </Root>
  );
}

const Root = styled.View`
  flex: 1;
`;
const Top = styled.View`
  padding-horizontal: 28px;
`;
const Brand = styled.Text`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${({ theme }) => theme.colors.subText};
`;
const Cancel = styled.Text`
  font-size: 17px;
  color: ${({ theme }) => theme.colors.accent};
`;
const Title = styled.Text`
  margin-top: 8px;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const Sub = styled.Text`
  margin-top: 10px;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.subText};
`;
const WheelCaption = styled.Text`
  text-align: center;
  font-size: 14px;
  padding-bottom: 8px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.subText};
`;
const WheelBox = styled.View`
  overflow: hidden;
`;
const Band = styled.View`
  position: absolute;
  left: 16px;
  right: 16px;
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.7);
`;
const DayText = styled.Text`
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const DayUnit = styled.Text`
  font-size: 17px;
  font-weight: 600;
`;
const PrevLabel = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.subText};
`;
const PrevRange = styled.Text`
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const PrevNote = styled.Text`
  margin-top: 14px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;
const PrevNoteSecond = styled.Text`
  margin-top: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;
const Spacer = styled.View`
  flex: 1;
`;
const CtaText = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
`;
