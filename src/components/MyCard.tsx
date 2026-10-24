import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Text } from 'react-native';

export function MyCard() {
  return (
    <LiquidGlassView
      style={[
        { width: 200, height: 100, borderRadius: 20 },
        !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.5)' }
      ]}
      interactive
      effect="clear"
    >
      <Text style={{ fontWeight: '600' }}>Hello World</Text>
    </LiquidGlassView>
  );
}