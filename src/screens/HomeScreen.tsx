import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
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
import { useExpenses } from '../hooks/useExpense';
import type { RootStackParamList } from '../navigation/types';
import { useSettings } from '../settings/SettingsContext';
import { formatMonthDay, getCycleRange } from '../utils/cycle';
import { remainingMoney, won } from '../utils/budget';
import { WEEKDAYS, addDays, endOfMonth, isSameDay, startOfDay, startOfMonth, toYmd } from '../utils/date';

const TIER_SAFE = '#10B981';
const TIER_CAUTION = '#F97316';
const TIER_WARN = '#e84113';

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

// DB에 저장된 카테고리 id → 화면(테마 색/이름)에서 쓰는 카테고리.
// id가 data/mock의 key와 같으면 그대로, 모르는 값이면 마지막 항목(기타)으로 묶는다.
const categoryOf = (id: string) => categories.find((c) => c.key === id) ?? categories[categories.length - 1];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, category } = useTheme();
  const { billingDay } = useSettings();
  const scrollY = useRef(new Animated.Value(0)).current;

  const todayDate = startOfDay(new Date());

  // 보고 있는 날짜 / 날짜 선택 시트
  const [viewDate, setViewDate] = useState(todayDate);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fabCollapsed, setFabCollapsed] = useState(false);

  const isToday = isSameDay(viewDate, todayDate);

  // 어디서 고르든(헤더, 달력) 같은 경로로 날짜를 바꾼다. 미래 날짜는 막는다.
  const pickDate = (d: Date) => {
    const date = startOfDay(d);
    if (date > todayDate) return;
    setViewDate(date);
  };
  const stepDay = (n: number) => pickDate(addDays(viewDate, n));

  // 정산 기간 (설정에서 고른 시작일 기준)
  const range = useMemo(() => getCycleRange(billingDay ?? 1), [billingDay]);
  const daysLeft = Math.max(1, range.daysUntilNext); // 오늘 포함 남은 일수

  // 서버에서 읽을 범위: 정산 기간 전체 + 보고 있는 날짜가 속한 달.
  // 같은 달 안에서 날짜를 넘길 땐 다시 읽지 않아 바로 바뀐다.
  const fetchFrom = range.start < startOfMonth(viewDate) ? range.start : startOfMonth(viewDate);
  const fetchTo = range.end > endOfMonth(viewDate) ? range.end : endOfMonth(viewDate);
  const { expenses, loading, error, reload } = useExpenses(fetchFrom, fetchTo);

  // 정산 기간에 쓴 돈 (서버 데이터)
  const totalSpent = useMemo(() => {
    const from = toYmd(range.start);
    const to = toYmd(range.end);
    return expenses.reduce((s, e) => (e.spentOn >= from && e.spentOn <= to ? s + e.amount : s), 0);
  }, [expenses, range]);

  // 목표 예산은 아직 예산 탭이 없어 mock 값을 쓴다 (TODO: 예산 테이블 연결)
  const totalBudget = useMemo(() => categories.reduce((s, c) => s + c.budget, 0), []);
  const remaining = remainingMoney(totalBudget, totalSpent, unpaidFixedCost);

  // 목표 예산 사용률 (남은 돈 기준이라 미결제 고정비 포함, 초과 시 1 이상)
  const usedRatio = (totalBudget - remaining) / totalBudget;
  const tier = getBudgetTier(usedRatio, remaining, colors.danger);

  // 남은 예산을 남은 일수로 나눈 하루 평균 사용 가능 금액
  const dailyAllow = remaining > 0 ? Math.floor(remaining / daysLeft) : 0;
  const allowText = remaining > 0 ? `하루 평균 ${won(dailyAllow)}씩 쓸 수 있어요` : '남은 예산이 없어요';

  // 고른 날의 지출
  const dayItems = useMemo(() => {
    const ymd = toYmd(viewDate);
    return expenses.filter((e) => e.spentOn === ymd);
  }, [expenses, viewDate]);
  const dayTotal = dayItems.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => navigation.navigate('AddExpense', { date: viewDate.toISOString() });

  return (
    <>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (e: any) =>
              setFabCollapsed(e.nativeEvent.contentOffset.y > 24),
          },
        )}
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
        {error && (
          <Pressable
            onPress={reload}
            accessibilityRole="button"
            accessibilityLabel="다시 불러오기"
          >
            <ErrorBar>
              <ErrorText>서버에 연결하지 못했어요 · 눌러서 다시 시도</ErrorText>
            </ErrorBar>
          </Pressable>
        )}

        {/* 1) 이번 기간에 쓴 돈 + 목표 예산까지 남은 돈 */}
        <GlassView
          radius={36}
          style={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 24 }}
        >
          <HeroTop>
            <Caption>사용한 금액</Caption>
            <RangeText>
              {formatMonthDay(range.start)} – {formatMonthDay(range.end)}
            </RangeText>
          </HeroTop>

          <Hero
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{ opacity: loading ? 0.35 : 1 }}
          >
            {won(totalSpent)}
          </Hero>

          <Track style={{ marginTop: 20 }}>
            <Fill
              style={{
                width: `${Math.min(1, Math.max(0, usedRatio)) * 100}%`,
                backgroundColor: tier.color,
              }}
            />
          </Track>
          <BarCaption>
            <BarLeft>
              목표까지{' '}
              <BarStrong style={{ color: tier.color }}>
                {won(Math.abs(remaining))}
              </BarStrong>{' '}
              {remaining < 0 ? '초과' : '남음'}
            </BarLeft>
            <BarRight>
              {Math.round(Math.max(0, usedRatio) * 100)}% 사용
            </BarRight>
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
            {isToday
              ? '오늘'
              : `${viewDate.getMonth() + 1}월 ${viewDate.getDate()}일`}{' '}
            사용한 금액
          </TodayLabel>
          <TodayValue style={{ opacity: loading ? 0.35 : 1 }}>
            {won(dayTotal)}
          </TodayValue>

          {dayItems.length > 0 ? (
            <ItemList>
              {dayItems.map(e => {
                const c = categoryOf(e.category);
                return (
                  <Item key={e.id}>
                    <Dot
                      style={{
                        backgroundColor: category[c.key as CategoryKey],
                        marginRight: 10,
                      }}
                    />
                    <ItemName numberOfLines={1}>{e.name || c.name}</ItemName>
                    <ItemAmount>{won(e.amount)}</ItemAmount>
                  </Item>
                );
              })}
            </ItemList>
          ) : (
            !loading && <EmptyText>아직 쓴 돈이 없어요</EmptyText>
          )}
        </GlassView>
      </Animated.ScrollView>

      {/* 스크롤 시 블러로 사라지는 고정 헤더 — 날짜를 눌러 바꾼다 */}
      <BlurHeader scrollY={scrollY}>
        <Header>
          <GlassView interactive radius={32}>
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
          <GlassView interactive radius={32} style={{ padding: 14 }}>
            <Pressable
              onPress={() => setSheetOpen(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`${
                viewDate.getMonth() + 1
              }월 ${viewDate.getDate()}일 ${
                WEEKDAYS[viewDate.getDay()]
              }요일, 날짜 선택`}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
            >
              <DateButton>
                <MonthText>
                  {viewDate.getMonth() + 1}월 {viewDate.getDate()}일{' '}
                  {WEEKDAYS[viewDate.getDay()]}요일
                </MonthText>
                <Chevron
                  dir="down"
                  size={16}
                  color={colors.subText}
                  strokeWidth={2.8}
                />
              </DateButton>
            </Pressable>
          </GlassView>
          <GlassView interactive radius={32}>
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
        </Header>
      </BlurHeader>

      <AddFab
        collapsed={fabCollapsed}
        onPress={openAdd}
        bottom={insets.bottom + FAB_BOTTOM}
      />

      <DateSheet
        visible={sheetOpen}
        value={viewDate}
        max={todayDate}
        onSelect={(d: Date) => {
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
const ErrorBar = styled.View`
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: rgba(232, 65, 19, 0.12);
`;
const ErrorText = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.danger};
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
const ItemList = styled.View`
  margin-top: 14px;
`;
const Item = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
`;
const ItemName = styled.Text`
  flex: 1;
  margin-right: 12px;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;
const ItemAmount = styled.Text`
  font-size: 15px;
  font-weight: 700;
  font-variant: tabular-nums;
  color: ${({ theme }) => theme.colors.text};
`;
const EmptyText = styled.Text`
  margin-top: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};
`;