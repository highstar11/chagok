import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

type Props = { visible: boolean };

/** 최상단 전체 화면을 덮고 가운데에 스피너만 표시. 표시 중에는 아래 화면 터치가 차단된다. */
export function Loading({ visible }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {}} // Android 뒤로가기 방지
    >
      <View
        style={styles.overlay}
        accessibilityRole="progressbar"
        accessibilityLabel="저장 중"
        accessibilityLiveRegion="polite"
      >
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  box: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(60,60,67,0.9)',
  },
});