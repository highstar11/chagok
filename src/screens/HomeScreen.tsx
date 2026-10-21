import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import styled, { useTheme } from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddFab } from '../components/AddFab';
import { BlurHeader, HEADER_CONTENT_HEIGHT } from '../components/BlurHeader';
import { Chevron } from '../components/Chevron';
import { DateSheet } from '../components/DateSheet';
import { GlassView } from '../components/GlassView';
import { categories, unpaidFixedCost } from '../data/mock';
import type { CategoryKey } from '../data/mock';
import type { RootStackParamList } from '../navigation/types';
import { useSettings } from '../settings/SettingsContext';
import { formatMonthDay, getCycleRange } from '../utils/cycle';
import { remainingMoney, won } from '../utils/budget';
import { WEEKDAYS, addDays, isSameDay, startOfDay } from '../utils/date';

const TIER_SAFE = '#10B981';
const TIER_CAUTION = '#F97316';
const TIER_WARN = '#e84113';

const CHART_DAYS = 14; // 일별 블록 차트에 보여줄 최근 일수
const CHART_H = 112; // 블록이 쌓이는 영역 높이
const LABEL_H = 24; // 날짜 라벨 영역 높이

// 떠 있는 탭바 위로 입력 버튼이 놓이는 높이 (GlassTabBar 높이에 맞춰 조절)
const FAB_BOTTOM = 86;
const FAB_SIZE = 58;

// 예산 사용률(0~)에 따른 색과 소비 자제 권장 문구
function getBudgetTier(usedRatio: number, remaining: number, dangerColor: string) {
  if (remaining < 0) {
    return { color: dangerColor, message: `예산을 ${won(-remaining)} 초과했어요. 지출을 멈춰 보세요` };
  }
  if (usedRatio < 0.5) return { color: TIER_SAFE, message: '아직은 괜찮아요. 지금 페이스를 유지해요' };
  if (usedRatio < 0.75) return { color: TIER_CAUTION, message: '슬슬 아껴 써야 해요' };
  if (usedRatio < 0.9) return { color: TIER_WARN, message: '절약이 필요해요. 꼭 필요한 곳에만 써요' };
  return { color: dangerColor, message: '예산이 거의 바닥났어요. 오늘은 참아 봐요' };
}

// 일별 카테고리 — 디자인 확인용 임시 데이터 (TODO: SQLite 연결 시 교체)
type DayData = {
  date: Date;
  total: number;
  cats: { key: CategoryKey; name: string; amount: number }[];
};

// 같은 입력엔 항상 같은 값을 주는 의사 난수 (렌더마다 값이 바뀌지 않도록)
function pseudo(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// end 날짜로 끝나는 최근 CHART_DAYS일
function buildMockDays(end: Date, base: number): DayData[] {
  return Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = addDays(end, -(CHART_DAYS - 1 - i));
    const seed = date.getMonth() * 40 + date.getDate();

    let cats = categories.map((c, k) => ({
      key: c.key,
      name: c.name,
      amount: pseudo(seed * 7 + k) > 0.45 ? Math.round((pseudo(seed * 13 + k) * base * 0.75) / 1000) * 1000 : 0,
    }));
    if (cats.every((c) => c.amount === 0)) {
      cats = cats.map((c, k) => (k === 0 ? { ...c, amount: Math.round((base * 0.3) / 1000) * 1000 } : c));
    }
    return { date, cats, total: cats.reduce((s, c) => s + c.amount, 0) };
  });
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, category } = useTheme();
  const { billingDay } = useSettings();
  const scrollY = useRef(new Animated.Value(0)).current;

  const todayDate = startOfDay(new Date());

  // 보고 있는 날짜 / 차트가 끝나는 날짜 / 날짜 선택 시트
  const [viewDate, setViewDate] = useState(todayDate);
  const [anchor, setAnchor] = useState(todayDate);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fabCollapsed, setFabCollapsed] = useState(false);

  const isToday = isSameDay(viewDate, todayDate);

  // 어디서 고르든(헤더, 달력, 차트) 같은 경로로 날짜를 바꾼다. 차트 범위 밖이면 차트도 따라간다.
  const pickDate = (d: Date) => {
    const date = startOfDay(d);
    if (date > todayDate) return;
    if (date > anchor) setAnchor(date);
    else if (date < addDays(anchor, -(CHART_DAYS - 1))) {
      const next = addDays(date, 6);
      setAnchor(next > todayDate ? todayDate : next);
    }
    setViewDate(date);
  };
  const stepDay = (n: number) => pickDate(addDays(viewDate, n));

  // 정산 기간 (설정에서 고른 시작일 기준)
  const range = useMemo(() => getCycleRange(billingDay ?? 1), [billingDay]);
  const daysLeft = Math.max(1, range.daysUntilNext); // 오늘 포함 남은 일수

  const { totalBudget, totalSpent, remaining } = useMemo(() => {
    const b = categories.reduce((s, c) => s + c.budget, 0);
    const sp = categories.reduce((s, c) => s + c.spent, 0);
    return { totalBudget: b, totalSpent: sp, remaining: remainingMoney(b, sp, unpaidFixedCost) };
  }, []);

  // 목표 예산 사용률 (남은 돈 기준이라 미결제 고정비 포함, 초과 시 1 이상)
  const usedRatio = (totalBudget - remaining) / totalBudget;
  const tier = getBudgetTier(usedRatio, remaining, colors.danger);

  // 남은 예산을 남은 일수로 나눈 하루 평균 사용 가능 금액
  const dailyAllow = remaining > 0 ? Math.floor(remaining / daysLeft) : 0;
  const allowText = remaining > 0 ? `하루 평균 ${won(dailyAllow)}씩 쓸 수 있어요` : '남은 예산이 없어요';

  // 일별 블록 차트
  const anchorTime = anchor.getTime();
  const days = useMemo(
    () => buildMockDays(new Date(anchorTime), Math.max(dailyAllow, 30000)),
    [anchorTime, dailyAllow],
  );
  const sel = days.find((d) => isSameDay(d.date, viewDate)) ?? days[CHART_DAYS - 1];
  const selCats = sel.cats.filter((c) => c.amount > 0);

  const openAdd = () => navigation.navigate('AddExpense', { date: viewDate.toISOString() });

  return (
    <>
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (e: any) => setFabCollapsed(e.nativeEvent.contentOffset.y > 24),
        })}
        scrollEventThrottle={16}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + HEADER_CONTENT_HEIGHT + 8,
          paddingHorizontal: 20,
          // 떠 있는 탭바 + 입력 버튼 위로 여유
          paddingBottom: insets.bottom + FAB_BOTTOM + FAB_SIZE + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1) 이번 기간에 쓴 돈 + 목표 예산까지 남은 돈 */}
        <GlassView radius={36} style={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 24 }}>
          <HeroTop>
            <Caption>사용한 금액</Caption>
            <RangeText>
              {formatMonthDay(range.start)} – {formatMonthDay(range.end)}
            </RangeText>
          </HeroTop>

          <Hero adjustsFontSizeToFit numberOfLines={1}>
            {won(totalSpent)}
          </Hero>

          <Track style={{ marginTop: 20 }}>
            <Fill style={{ width: `${Math.min(1, Math.max(0, usedRatio)) * 100}%`, backgroundColor: tier.color }} />
          </Track>
          <BarCaption>
            <BarLeft>
              목표까지{' '}
              <BarStrong style={{ color: tier.color }}>{won(Math.abs(remaining))}</BarStrong>{' '}
              {remaining < 0 ? '초과' : '남음'}
            </BarLeft>
            <BarRight>{Math.round(Math.max(0, usedRatio) * 100)}% 사용</BarRight>
          </BarCaption>

          <Divider />

          <AllowText>{allowText}</AllowText>
          <MsgRow>
            <Dot style={{ backgroundColor: tier.color }} />
            <Msg style={{ color: tier.color }}>{tier.message}</Msg>
          </MsgRow>
        </GlassView>

        {/* 2) 고른 날의 지출 */}
        <GlassView radius={32} style={{ padding: 24, marginTop: 20 }}>
          <TodayLabel>
            {isToday ? '오늘' : `${viewDate.getMonth() + 1}월 ${viewDate.getDate()}일`} 사용한 금액
          </TodayLabel>
          <TodayValue>{won(sel.total)}</TodayValue>
          {selCats.length > 0 ? (
            <DetailRow>
              {selCats.map((c) => (
                <DetailChip key={c.key}>
                  <Dot style={{ backgroundColor: category[c.key], marginRight: 6 }} />
                  <DetailChipText>
                    {c.name} {won(c.amount)}
                  </DetailChipText>
                </DetailChip>
              ))}
            </DetailRow>
          ) : (
            <EmptyText>아직 쓴 돈이 없어요</EmptyText>
          )}
        </GlassView>

        {/* 3) 차곡차곡 쌓이는 일별 카테고리 (디자인 확인용) */}
        {/* <GlassView radius={28} style={{ padding: 18, marginTop: 12 }}>
          <SectionTop>
            <SectionTitle>일별 지출</SectionTitle>
            <SectionHint>날짜를 눌러 보세요</SectionHint>
          </SectionTop>

          <ChartWrap style={{ height: CHART_H + LABEL_H }}>
            <LimitLine style={{ bottom: lineBottom }} pointerEvents="none">
              <Svg width="100%" height={2}>
                <Line x1="0" y1="1" x2="100%" y2="1" stroke={colors.subText} strokeWidth={1} strokeDasharray="4 4" />
              </Svg>
              <LimitLabel>하루 평균 한도</LimitLabel>
            </LimitLine>

            <ColRow>
              {days.map((d) => {
                const isSel = isSameDay(d.date, viewDate);
                const isDayToday = isSameDay(d.date, todayDate);
                const inCycle = d.date >= range.start;
                const over = dailyAllow > 0 && d.total > dailyAllow;
                return (
                  <Pressable
                    key={d.date.getTime()}
                    onPress={() => pickDate(d.date)}
                    style={{ flex: 1 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.date.getMonth() + 1}월 ${d.date.getDate()}일 ${won(d.total)}`}
                  >
                    <ColInner
                      style={{
                        backgroundColor: isSel ? 'rgba(59,130,246,0.10)' : 'transparent',
                        opacity: inCycle ? 1 : 0.35, // 정산 기간 이전 날짜는 흐리게
                      }}
                    >
                      <StackBox style={{ height: CHART_H }}>
                        {[...d.cats]
                          .reverse()
                          .filter((c) => c.amount > 0)
                          .map((c) => (
                            <Block
                              key={c.key}
                              style={{
                                height: Math.max(4, (c.amount / chartMax) * CHART_H),
                                backgroundColor: category[c.key],
                              }}
                            />
                          ))}
                      </StackBox>
                      <DayLabel
                        style={{
                          color: over ? colors.danger : isDayToday ? colors.accent : colors.subText,
                          fontWeight: isDayToday || isSel ? '800' : '500',
                        }}
                      >
                        {d.date.getDate()}
                      </DayLabel>
                    </ColInner>
                  </Pressable>
                );
              })}
            </ColRow>
          </ChartWrap>
        </GlassView> */}
      </Animated.ScrollView>

      {/* 스크롤 시 블러로 사라지는 고정 헤더 — 날짜를 눌러 바꾼다 */}
      <BlurHeader scrollY={scrollY}>
        <Header>
          <GlassView radius={32} >
            <Pressable
                onPress={() => stepDay(-1)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="전날"
                style={stepStyle}
              >
                <Chevron dir="left" size={20} color={colors.text} />
            </Pressable>
          </GlassView>
          <GlassView radius={32} style={{ padding: 14 }}>
            <DateControl>
              <Pressable
                onPress={() => setSheetOpen(true)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${viewDate.getMonth() + 1}월 ${viewDate.getDate()}일 ${WEEKDAYS[viewDate.getDay()]}요일, 날짜 선택`}
                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
              >
                <DateButton>
                  <MonthText>
                    {viewDate.getMonth() + 1}월 {viewDate.getDate()}일 {WEEKDAYS[viewDate.getDay()]}요일
                  </MonthText>
                  <Chevron dir="down" size={16} color={colors.subText} strokeWidth={2.8} />
                </DateButton>
              </Pressable>
            </DateControl>
          </GlassView>
          <GlassView radius={32} >
            <Pressable
                onPress={() => stepDay(1)}
                disabled={isToday}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="다음날"
                style={[stepStyle, { opacity: isToday ? 0.25 : 1 }]}
              >
                <Chevron dir="right" size={20} color={colors.text} />
              </Pressable>
          </GlassView>
      
          {/* {!isToday && (
            <Pressable onPress={() => pickDate(todayDate)} accessibilityRole="button" accessibilityLabel="오늘로 돌아가기">
              <GlassView radius={18} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                <BackText style={{ color: colors.accent }}>오늘</BackText>
              </GlassView>
            </Pressable>
          )} */}
        </Header>
      </BlurHeader>

      <AddFab collapsed={fabCollapsed} onPress={openAdd} bottom={insets.bottom + FAB_BOTTOM} />

      <DateSheet
        visible={sheetOpen}
        value={viewDate}
        max={todayDate}
        onSelect={(d: any) => {
          pickDate(d);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const stepStyle = { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' } as const;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
const DateControl = styled.View`
  flex-direction: row;
  align-items: center;
`;
const DateButton = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
`;
const MonthText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const HeroTop = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
const Caption = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.subText};
`;
const RangeText = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;
const Hero = styled.Text`
  margin-top: 14px;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text};
`;
const Track = styled.View`
  height: 10px;
  border-radius: 10px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.track};
`;
const Fill = styled.View`
  height: 100%;
  border-radius: 10px;
`;
const BarCaption = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
`;
const BarLeft = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.subText};
`;
const BarStrong = styled.Text`
  font-weight: 700;
`;
const BarRight = styled.Text`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;
const Divider = styled.View`
  margin: 20px 0 20px;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.track};
`;
const AllowText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const MsgRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
`;
const Dot = styled.View`
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 6px;
`;
const Msg = styled.Text`
  flex: 1;
  font-size: 14px;
  font-weight: 700;
`;

const TodayLabel = styled.Text`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.subText};
`;
const TodayValue = styled.Text`
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const DetailRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;
const DetailChip = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 6px 10px;
  border-radius: 12px;
  background-color: rgba(20, 22, 27, 0.05);
`;
const DetailChipText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const EmptyText = styled.Text`
  margin-top: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;

// const SectionTop = styled.View`
//   flex-direction: row;
//   align-items: baseline;
//   justify-content: space-between;
// `;
// const SectionTitle = styled.Text`
//   font-size: 16px;
//   font-weight: 800;
//   color: ${({ theme }) => theme.colors.text};
// `;
// const SectionHint = styled.Text`
//   font-size: 11px;
//   color: ${({ theme }) => theme.colors.subText};
// `;
// const ChartWrap = styled.View`
//   margin-top: 14px;
// `;
// const LimitLine = styled.View`
//   position: absolute;
//   left: 0;
//   right: 0;
// `;
// const LimitLabel = styled.Text`
//   position: absolute;
//   right: 0;
//   bottom: 3px;
//   font-size: 10px;
//   color: ${({ theme }) => theme.colors.subText};
// `;
// const ColRow = styled.View`
//   flex-direction: row;
// `;
// const ColInner = styled.View`
//   align-items: center;
//   border-radius: 12px;
// `;
// const StackBox = styled.View`
//   justify-content: flex-end;
//   align-items: center;
// `;
// const Block = styled.View`
//   width: 14px;
//   margin-top: 2px;
//   border-radius: 4px;
// `;
// const DayLabel = styled.Text`
//   height: ${LABEL_H}px;
//   line-height: ${LABEL_H}px;
//   font-size: 10px;
// `;