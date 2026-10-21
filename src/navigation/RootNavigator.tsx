import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../settings/SettingsContext';
import { RootTabs } from './RootTabs';
import { BillingCycleScreen } from '../screens/BillingCycleScreen';

export type RootStackParamList = {
  Tabs: undefined;
  BillingCycle: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { ready, billingDay } = useSettings();

  if (!ready) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    >
      {billingDay == null ? (
        <Stack.Screen name="BillingCycle" component={BillingCycleScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={RootTabs} />
          <Stack.Screen
            name="BillingCycle"
            component={BillingCycleScreen}
            options={{ presentation: 'modal', animation: 'default' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
