import React from 'react';
import { Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled, { useTheme } from 'styled-components/native';
import { GlassView } from './GlassView';
import { Icon, IconName } from './icons';

const ICONS: Record<string, IconName> = {
  Home: 'home',
  History: 'list',
  Fixed: 'repeat',
  Budget: 'wallet',
};

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Wrap style={{ bottom: Math.max(insets.bottom, 12) }} pointerEvents="box-none">
      <GlassView radius={32} interactive style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
        <Row>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const label = descriptors[route.key].options.title ?? route.name;
            const color = focused ? colors.accent : colors.subText;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                onPress={onPress}
                style={{ flex: 1 }}
              >
                <Item $focused={focused}>
                  <Icon name={ICONS[route.name] ?? 'home'} size={23} color={color} />
                  <Label style={{ color, fontWeight: focused ? '700' : '500' }}>{label}</Label>
                </Item>
              </Pressable>
            );
          })}
        </Row>
      </GlassView>
    </Wrap>
  );
}

const Wrap = styled.View`
  position: absolute;
  left: 20px;
  right: 20px;
`;

const Row = styled.View`
  flex-direction: row;
`;

const Item = styled.View<{ $focused: boolean }>`
  align-items: center;
  justify-content: center;
  padding: 9px 0 8px;
  border-radius: 26px;
  background-color: ${({ $focused }) => ($focused ? 'rgba(255,255,255,0.55)' : 'transparent')};
`;

const Label = styled.Text`
  margin-top: 3px;
  font-size: 11px;
`;
