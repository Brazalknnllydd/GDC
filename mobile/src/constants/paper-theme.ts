import { MD3LightTheme, configureFonts } from 'react-native-paper';

import { colors, fonts } from './theme';

const fontConfig = {
  bodyLarge: { fontFamily: fonts.regular },
  bodyMedium: { fontFamily: fonts.regular },
  bodySmall: { fontFamily: fonts.regular },
  displayLarge: { fontFamily: fonts.bold },
  displayMedium: { fontFamily: fonts.bold },
  displaySmall: { fontFamily: fonts.bold },
  headlineLarge: { fontFamily: fonts.bold },
  headlineMedium: { fontFamily: fonts.bold },
  headlineSmall: { fontFamily: fonts.bold },
  labelLarge: { fontFamily: fonts.medium },
  labelMedium: { fontFamily: fonts.medium },
  labelSmall: { fontFamily: fonts.medium },
  titleLarge: { fontFamily: fonts.bold },
  titleMedium: { fontFamily: fonts.semiBold },
  titleSmall: { fontFamily: fonts.semiBold },
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: colors.background,
    error: colors.dangerStrong,
    onPrimary: colors.textInverse,
    onSurface: colors.text,
    outline: colors.borderStrong,
    primary: colors.secondary,
    secondary: colors.primary,
    surface: colors.card,
    surfaceVariant: colors.surfaceSubtle,
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 16,
};
