import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled, { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { formatFullDate } from '../utils/date';
import { won } from '../utils/budget';

const MAX_AMOUNT = 99_999_999;
const QUICK = [
  { label: '+1천', value: 1000 },
  { label: '+5천', value: 5000 },
  { label: '+1만', value: 10000 },
  { label: '+5만', value: 50000 },
];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'] as const;

export function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AddExpense'>>();
  const date = new Date(params.date);

  const [amount, setAmount] = useState(0);
  const clamp = (n: number) => Math.min(MAX_AMOUNT, Math.max(0, n));

  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'del') return setAmount((a) => Math.floor(a / 10));
    setAmount((a) => clamp(a * Math.pow(10, key.length) + Number(key)));
  };

  const save = () => {
    if (amount <= 0) return;
    // TODO: SQLite 저장 (date, amount)
    navigation.goBack();
  };

  return (
    <Container style={{ paddingBottom: insets.bottom + 12 }}>
      <TopRow>
        <View>
            <DateText>{formatFullDate(date)}</DateText>
        </View>
        <Pressable style={{backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24}} onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
          <CloseText>닫기</CloseText>
        </Pressable>
      </TopRow>

      <AmountArea>
        <Amount
          adjustsFontSizeToFit
          numberOfLines={1}
          accessibilityLabel={`입력한 금액 ${won(amount)}`}
          style={{ color: amount === 0 ? colors.subText : colors.text }}
        >
          {won(amount)}
        </Amount>
      </AmountArea>

      <QuickRow>
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => setAmount((a) => clamp(a + q.value))}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel={`${q.value}원 더하기`}
          >
            {({ pressed }) => (
              <Chip style={{ backgroundColor: colors.track, opacity: pressed ? 0.6 : 1 }}>
                <ChipText>{q.label}</ChipText>
              </Chip>
            )}
          </Pressable>
        ))}
      </QuickRow>

      <Pad>
        {KEYS.map((k) => (
          <KeyCell key={k}>
            <Pressable
              onPress={() => press(k)}
              onLongPress={k === 'del' ? () => setAmount(0) : undefined}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? '지우기' : k}
              style={{ flex: 1 }}
            >
              {({ pressed }) => (
                <Key style={{ backgroundColor: pressed ? colors.track : 'transparent' }}>
                  <KeyText>{k === 'del' ? '⌫' : k}</KeyText>
                </Key>
              )}
            </Pressable>
          </KeyCell>
        ))}
      </Pad>

      <Pressable
        disabled={amount <= 0}
        onPress={save}
        accessibilityRole="button"
        accessibilityLabel="저장"
        style={({ pressed }) => ({ opacity: amount <= 0 ? 0.35 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        <SaveBtn style={{ backgroundColor: colors.accent }}>
          <SaveText>{amount > 0 ? `${won(amount)} 저장` : '금액을 입력해 주세요'}</SaveText>
        </SaveBtn>
      </Pressable>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  padding: 36px 20px 0;
`;
const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
const DateText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.subText};
`;
const CloseText = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
`;
const AmountArea = styled.View`
  flex: 1;
  justify-content: center;
  padding-horizontal: 8px;
`;
const Amount = styled.Text`
  font-size: 40px;
  font-weight: 500;
  letter-spacing: -0.5px;
`;
const QuickRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;
const Chip = styled.View`
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
`;
const ChipText = styled.Text`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;
const Pad = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 8px;
  margin-bottom: 8px;
`;
const KeyCell = styled.View`
  width: 33.3333%;
  height: 64px;
  padding: 3px;
`;
const Key = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
`;
const KeyText = styled.Text`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;
const SaveBtn = styled.View`
  height: 64px;
  align-items: center;
  justify-content: center;
  border-radius: 32px;
`;
const SaveText = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
`;