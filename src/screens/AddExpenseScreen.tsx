import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  PlatformColor,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import styled, { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { CATEGORIES, suggestCategory } from '../data/category';
import type { CategoryId } from '../data/category';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

const MAX_AMOUNT = 99_999_999;
const SIDE = 24;
const FILL = 'rgba(120,120,128,0.16)'; // iOS systemFill: 라이트/다크 모두 자연스럽다
const QUICK_ADD = [
  { label: '+1천', value: 1_000 },
  { label: '+5천', value: 5_000 },
  { label: '+1만', value: 10_000 },
  { label: '+5만', value: 50_000 },
];

const comma = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const readable = (n: number) => {
  const man = Math.floor(n / 10000);
  const rest = n % 10000;
  return `${man ? `${comma(man)}만` : ''}${rest ? ` ${comma(rest)}` : ''}원`.trim();
};

export function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'AddExpense'>>();
  const [amount, setAmount] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

const amountRef = useRef<React.ComponentRef<typeof TextInput>>(null);  const shake = useRef(new Animated.Value(0)).current;
  const manualCategory = useRef(false); // 직접 고른 카테고리는 자동 추천이 덮어쓰지 않는다

  // 키보드가 올라와 있으면 홈 인디케이터 여백이 필요 없다
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // 이름이 바뀌면 카테고리를 자동 추천한다. (지금은 키워드 사전, 나중에 AI로 교체)
  useEffect(() => {
    if (manualCategory.current) return;
    let stale = false;
    const timer = setTimeout(async () => {
      const suggested = await suggestCategory(name);
      if (!stale && !manualCategory.current) setCategory(suggested);
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [name]);

  // 최대 금액을 넘기려 하면 금액이 좌우로 살짝 흔들린다
  const reject = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const updateAmount = (next: number) => {
    if (next > MAX_AMOUNT) return reject();
    setAmount(next);
  };

  const onChangeAmount = (text: string) => {
    updateAmount(Number(text.replace(/\D/g, '') || 0));
  };

  const pickCategory = (id: CategoryId) => {
    if (category === id) {
      // 같은 칩을 다시 누르면 선택 해제하고 자동 추천으로 돌아간다
      manualCategory.current = false;
      setCategory(null);
      return;
    }
    manualCategory.current = true;
    setCategory(id);
  };

  const save = () => {
    if (amount <= 0) return;
    // TODO: SQLite 저장 ({ date: params.date, amount, name: name.trim(), category: category ?? 'etc' })
    navigation.goBack();
  };

  const canSave = amount > 0;
  const hint = amount >= 10000 ? readable(amount) : ' ';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Container
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: keyboardOpen ? 12 : insets.bottom + 12,
        }}
      >
        <Header>
          <HeaderTitle style={{ color: colors.text }}>지출 추가</HeaderTitle>
          <HeaderSide />
          <HeaderSide>
            <LiquidGlassView
              interactive
              effect="regular"
              style={[
                { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
                !isLiquidGlassSupported && { backgroundColor: FILL },
              ]}
            >
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseText style={{ color: isLiquidGlassSupported ? PlatformColor('labelColor') : colors.subText }}>
                  ✕
                </CloseText>
              </Pressable>
            </LiquidGlassView>
          </HeaderSide>
        </Header>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 36 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* 금액: 화면의 주인공. 숨겨진 입력창 + 큰 숫자 표시 */}
          <Pressable onPress={() => amountRef.current?.focus()} accessible={false}>
            <Animated.View
              style={{
                alignItems: 'center',
                transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
              }}
            >
              <AmountRow>
                <AmountText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: amount > 0 ? colors.text : colors.subText }}
                >
                  {comma(amount)}
                </AmountText>
                <AmountUnit style={{ color: amount > 0 ? colors.text : colors.subText }}>원</AmountUnit>
              </AmountRow>
            </Animated.View>
          </Pressable>
          <TextInput
            ref={amountRef}
            value={amount === 0 ? '' : comma(amount)}
            onChangeText={onChangeAmount}
            keyboardType="number-pad"
            autoFocus
            caretHidden
            contextMenuHidden
            accessibilityLabel="금액 입력"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />

          {/* 내용 + 카테고리를 하나의 카드로 묶는다 */}
          <Card style={{ backgroundColor: colors.track }}>
            <NameInput
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="어디에 쓰셨나요?"
              placeholderTextColor={colors.subText}
              returnKeyType="done"
              maxLength={30}
              autoCorrect={false}
              selectionColor={colors.accent}
              accessibilityLabel="지출 내용"
              style={{ color: colors.text }}
            />
            <Divider style={{ backgroundColor: colors.subText }} />
            <ScrollView
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, padding: 14 }}
            >
              {CATEGORIES.map((c) => {
                const selected = category === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => pickCategory(c.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${c.label} 카테고리`}
                  >
                    <Chip style={{ backgroundColor: selected ? colors.accent : FILL }}>
                      <ChipText style={{ color: selected ? '#FFFFFF' : colors.text }}>{c.label}</ChipText>
                    </Chip>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>
        </ScrollView>

        {/* 하단: 금액 빠른 추가(금액 입력 중에만) + 저장
        {!nameFocused && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {QUICK_ADD.map((q) => (
              <Pressable
                key={q.label}
                style={{ flex: 1 }}
                onPress={() => updateAmount(amount + q.value)}
                accessibilityRole="button"
                accessibilityLabel={`${comma(q.value)}원 더하기`}
              >
                <QuickChip style={{ backgroundColor: FILL }}>
                  <ChipText style={{ color: colors.text }}>{q.label}</ChipText>
                </QuickChip>
              </Pressable>
            ))}
          </View>
        )} */}

        <Pressable
          disabled={!canSave}
          onPress={save}
          accessibilityRole="button"
          accessibilityLabel="저장"
          accessibilityState={{ disabled: !canSave }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <DoneBtn style={{ backgroundColor: canSave ? colors.accent : FILL }}>
            <DoneText style={{ color: canSave ? '#FFFFFF' : colors.subText }}>저장</DoneText>
          </DoneBtn>
        </Pressable>
      </Container>
    </KeyboardAvoidingView>
  );
}

const Container = styled.View`
  flex: 1;
  padding: 0 ${SIDE}px;
`;
const Header = styled.View`
  height: 44px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
const HeaderSide = styled.View`
  width: 36px;
  align-items: flex-end;
`;
const HeaderTitle = styled.Text`
  font-size: 17px;
  font-weight: 600;
`;
const CloseText = styled.Text`
  font-size: 16px;
  font-weight: 700;
`;
const AmountRow = styled.View`
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  max-width: 100%;
`;
const AmountText = styled.Text`
  flex-shrink: 1;
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -1.2px;
`;
const AmountUnit = styled.Text`
  margin-left: 8px;
  font-size: 24px;
  font-weight: 700;
`;
const Card = styled.View`
  margin-top: 56px;
  border-radius: 20px;
  overflow: hidden;
`;
const NameInput = styled.TextInput`
  padding: 18px 20px;
  font-size: 17px;
  font-weight: 500;
`;
const Divider = styled.View`
  height: 0.5px;
  margin-left: 20px;
  opacity: 0.25;
`;
const Chip = styled.View`
  height: 34px;
  padding: 0 14px;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
`;
const QuickChip = styled.View`
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
`;
const ChipText = styled.Text`
  font-size: 14px;
  font-weight: 600;
`;
const DoneBtn = styled.View`
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
`;
const DoneText = styled.Text`
  font-size: 17px;
  font-weight: 700;
`;