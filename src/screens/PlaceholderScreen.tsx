import React from 'react';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '../components/GlassView';

export function PlaceholderScreen({ title, desc }: { title: string; desc: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Container style={{ paddingTop: insets.top + 16 }}>
      <Title>{title}</Title>
      <GlassView radius={28} style={{ padding: 24, marginTop: 20 }}>
        <Desc>{desc}</Desc>
        <Soon>다음 단계에서 구현됩니다</Soon>
      </GlassView>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  padding: 0 20px;
`;
const Title = styled.Text`
  font-size: 30px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;
const Desc = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;
const Soon = styled.Text`
  margin-top: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.subText};
`;
