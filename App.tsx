import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import { theme } from './src/theme/theme';
import { SettingsProvider } from './src/settings/SettingsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

const navTheme = {
  ...NavDefaultTheme,
  colors: { ...NavDefaultTheme.colors, background: 'transparent' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <SettingsProvider>
          <StatusBar barStyle="dark-content" />
          <View style={styles.root}>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </View>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: "#f4f4f4" } });