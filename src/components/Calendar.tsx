import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const formatShort = (d: Date) =>
  `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const FILL = 'rgba(120,120,128,0.12)';

type CalendarProps = {
  visible: boolean;
  value: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
  textColor: string;
  subColor: string;
  accent: string;
};

// 아래에서 올라오는 날짜 선택 시트. 날짜를 누르면 onSelect, 바깥을 누르면 onClose.
export function Calendar({
  visible,
  value,
  onSelect,
  onClose,
  textColor,
  subColor,
  accent,
}: CalendarProps) {
  const insets = useSafeAreaInsets();
  const height = Dimensions.get('window').height;
  const y = useRef(new Animated.Value(height)).current;

  // 열릴 때마다 아래에서 위로 올라온다
  useEffect(() => {
    if (!visible) return;
    y.setValue(height);
    Animated.timing(y, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [height, visible, y]);

  return (
    <Modal
      transparent
      animationType="fade"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <Backdrop onPress={onClose} accessibilityLabel="닫기" />
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 20,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 20,
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          transform: [{ translateY: y }],
        }}
      >
        {/* key가 바뀌면 다시 열릴 때 선택한 날짜의 달부터 보여준다 */}
        <Month
          key={String(visible)}
          value={value}
          onSelect={onSelect}
          textColor={textColor}
          subColor={subColor}
          accent={accent}
        />
      </Animated.View>
    </Modal>
  );
}

type MonthProps = Omit<CalendarProps, 'visible' | 'onClose'>;

function Month({ value, onSelect, textColor, subColor, accent }: MonthProps) {
  const [view, setView] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );
  const today = new Date();

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (diff: number) => setView(new Date(year, month + diff, 1));

  return (
    <>
      <Header>
        <Title style={{ color: textColor }}>
          {year}년 {month + 1}월
        </Title>
        <Arrows>
          <Pressable
            onPress={() => move(-1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="이전 달"
          >
            <RoundBtn style={{ backgroundColor: FILL }}>
              <RoundText style={{ color: textColor }}>‹</RoundText>
            </RoundBtn>
          </Pressable>
          <Pressable
            onPress={() => move(1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="다음 달"
          >
            <RoundBtn style={{ backgroundColor: FILL }}>
              <RoundText style={{ color: textColor }}>›</RoundText>
            </RoundBtn>
          </Pressable>
        </Arrows>
      </Header>

      <Grid>
        {WEEKDAYS.map(w => (
          <WeekText key={w} style={{ color: subColor }}>
            {w}
          </WeekText>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <Cell key={i} />;
          const date = new Date(year, month, day);
          const selected = isSameDay(date, value);
          const isToday = isSameDay(date, today);
          return (
            <Cell key={i}>
              <Pressable
                onPress={() => onSelect(date)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${month + 1}월 ${day}일`}
              >
                <DayBox
                  style={{
                    backgroundColor: selected ? accent : 'transparent',
                    borderColor: isToday && !selected ? accent : 'transparent',
                  }}
                >
                  <DayText
                    style={{
                      color: selected
                        ? '#FFFFFF'
                        : isToday
                        ? accent
                        : textColor,
                      fontWeight: selected || isToday ? '700' : '500',
                    }}
                  >
                    {day}
                  </DayText>
                </DayBox>
              </Pressable>
            </Cell>
          );
        })}
      </Grid>
    </>
  );
}

const Backdrop = styled.Pressable`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.35);
`;
const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 24px 8px;
`;
const Title = styled.Text`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
`;
const Arrows = styled.View`
  flex-direction: row;
  gap: 10px;
`;
const RoundBtn = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  align-items: center;
  justify-content: center;
`;
const RoundText = styled.Text`
  font-size: 24px;
  line-height: 26px;
`;
const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;
const WeekText = styled.Text`
  width: 14.2857%;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  padding-bottom: 8px;
`;
const Cell = styled.View`
  width: 14.2857%;
  height: 48px;
  align-items: center;
  justify-content: center;
`;
const DayBox = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border-width: 1.5px;
  align-items: center;
  justify-content: center;
`;
const DayText = styled.Text`
  font-size: 16px;
`;
