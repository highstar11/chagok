import React from 'react';
import Svg, { Polyline } from 'react-native-svg';

const POINTS = {
  left: '14,5 7,12 14,19',
  right: '10,5 17,12 10,19',
  down: '5,9 12,16 19,9',
};

type Props = { dir: keyof typeof POINTS; size?: number; color: string; strokeWidth?: number };

export function Chevron({ dir, size = 18, color, strokeWidth = 2.4 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polyline
        points={POINTS[dir]}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}