import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlassTabBar } from '../components/GlassTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import type { RootStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const History = () => <PlaceholderScreen title="내역" desc="월별 거래 · 항목 → 카드 트리" />;
const Fixed = () => <PlaceholderScreen title="고정비" desc="매달 나가는 돈을 직접 등록" />;
const Budget = () => <PlaceholderScreen title="예산" desc="항목별 월 예산 설정" />;

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // 탭바가 콘텐츠 위에 떠 있도록 화면 쪽에서 하단 여백을 직접 확보
        tabBarStyle: { position: 'absolute' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="History" component={History} options={{ title: '내역' }} />
      <Tab.Screen name="Fixed" component={Fixed} options={{ title: '고정비' }} />
      <Tab.Screen name="Budget" component={Budget} options={{ title: '예산' }} />
    </Tab.Navigator>
  );
}

// 탭 위에 입력 화면을 모달로 올리는 루트. App에서는 기존처럼 <RootTabs />만 쓰면 됨
export function RootTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'fullScreenModal', headerShown: false,  contentStyle: { backgroundColor: "#FFFFFF" },
    gestureEnabled: false, // 스와이프로 닫히는 걸 막고 싶을 때
     }} />
    </Stack.Navigator>
  );
}