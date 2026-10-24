import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  PlatformColor,
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
const QUICK_ADD = [
  { label: '+1,000', value: 1_000 },
  { label: '+5,000', value: 5_000 },
  { label: '+1만', value: 10_000 },
  { label: '+5만', value: 50_000 },
];

const comma = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 12500 -> "1만 2,500원"
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

  const shake = useRef(new Animated.Value(0)).current;
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
          paddingTop: insets.top + 24,
          paddingBottom: keyboardOpen ? 12 : insets.bottom + 12,
        }}
      >
        <Header>
          <HeaderTitle style={{ color: colors.text }}>지출 추가</HeaderTitle>
          <HeaderSpacer />
          <LiquidGlassView
            interactive
            effect="regular"
            style={[
                { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
                !isLiquidGlassSupported && { backgroundColor: colors.track },]}> 
            <Pressable 
                onPress={() => navigation.goBack()} 
                hitSlop={12} 
                accessibilityRole="button" 
                accessibilityLabel="닫기"
                style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                <CloseText                
                    style={{ color: isLiquidGlassSupported ? PlatformColor('labelColor') : colors.subText }}>
                    ✕ 
                </CloseText>
            </Pressable>
        </LiquidGlassView>
        </Header>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 32, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <FieldLabel style={{ color: colors.subText }}>금액</FieldLabel>
          <Animated.View
            style={{
              transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
            }}
          >
            <AmountRow>
              <AmountInput
                value={amount === 0 ? '' : comma(amount)}
                onChangeText={onChangeAmount}
                placeholder="0"
                placeholderTextColor={colors.subText}
                keyboardType="number-pad"
                autoFocus
                maxLength={11}
                contextMenuHidden
                selectionColor={colors.accent}
                accessibilityLabel="금액 입력"
                style={{ color: colors.text }}
              />
              <AmountUnit style={{ color: amount > 0 ? colors.text : colors.subText }}>원</AmountUnit>
            </AmountRow>
          </Animated.View>
          <Hint numberOfLines={1} style={{ color: colors.subText }}>
            {hint}
          </Hint>

          <QuickRow
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {QUICK_ADD.map((q) => (
              <Pressable
                key={q.label}
                onPress={() => updateAmount(amount + q.value)}
                accessibilityRole="button"
                accessibilityLabel={`${comma(q.value)}원 더하기`}
              >
                <Chip style={{ backgroundColor: colors.track }}>
                  <ChipText style={{ color: colors.text }}>{q.label}</ChipText>
                </Chip>
              </Pressable>
            ))}
          </QuickRow>

          <FieldLabel style={{ color: colors.subText, marginTop: 36 }}>내용</FieldLabel>
          <NameInput
            value={name}
            onChangeText={setName}
            placeholder="예: 배달의민족, 치킨"
            placeholderTextColor={colors.subText}
            returnKeyType="done"
            maxLength={30}
            autoCorrect={false}
            selectionColor={colors.accent}
            accessibilityLabel="지출 내용"
            style={{ backgroundColor: colors.track, color: colors.text }}
          />

          <FieldLabel style={{ color: colors.subText, marginTop: 36 }}>카테고리</FieldLabel>
          <Grid>
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
                  <Chip style={{ backgroundColor: selected ? colors.accent : colors.track }}>
                    <ChipText style={{ color: selected ? '#FFFFFF' : colors.text }}>{c.label}</ChipText>
                  </Chip>
                </Pressable>
              );
            })}
          </Grid>
        </ScrollView>

        <Pressable
          disabled={!canSave}
          onPress={save}
          accessibilityRole="button"
          accessibilityLabel="저장"
          accessibilityState={{ disabled: !canSave }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <DoneBtn style={{ backgroundColor: canSave ? colors.accent : colors.track }}>
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
  background-color: "#FFFFFF";
`;
const Header = styled.View`
  height: 48px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
const HeaderAction = styled.Text`
  font-size: 16px;
  font-weight: 500;
`;
const HeaderTitle = styled.Text`
  font-size: 17px;
  font-weight: 600;
`;
const HeaderSpacer = styled.View`
  width: 32px;
`;
const CloseText = styled.Text`  
    font-size: 14px;
    font-weight: 600;
`;
const FieldLabel = styled.Text`
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
`;
const AmountRow = styled.View`
  flex-direction: row;
  align-items: center;
`;
const AmountInput = styled.TextInput`
  flex: 1;
  height: 48px;
  padding: 0;
  font-size: 34px;
  font-weight: 700;
`;
const AmountUnit = styled.Text`
  margin-left: 4px;
  font-size: 22px;
  font-weight: 600;
`;
const Hint = styled.Text`
  min-height: 20px;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
`;
const QuickRow = styled.ScrollView`
  flex-grow: 0;
  margin-top: 16px;
`;
const NameInput = styled.TextInput`
  height: 52px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
`;
const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;
const Chip = styled.View`
  height: 36px;
  padding: 0 14px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
`;
const ChipText = styled.Text`
  font-size: 14px;
  font-weight: 600;
`;
const DoneBtn = styled.View`
  height: 64px;
  align-items: center;
  justify-content: center;
  border-radius: 32px;
`;
const DoneText = styled.Text`
  font-size: 18px;
  font-weight: 700;
`;