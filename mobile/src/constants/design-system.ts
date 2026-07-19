import { colors } from './theme';

// Design system rules:
// 1. Use spacing tokens instead of raw padding/margin values whenever possible.
// 2. Use radius tokens for cards, pills, and inputs instead of ad hoc borderRadius values.
// 3. Use typography roles from theme.ts:
//    - label for meta, tabs, helper text
//    - body for general readable copy
//    - value for numbers and important values
//    - heading for major titles
// 4. Prefer shared shadows and layout widths for consistency across admin screens.

export const spacing = {
  xs: 4,
  sm: 6,
  md: 9,
  lg: 12,
  xl: 15,
  xxl: 17,
  section: 21,
  block: 26,
};

export const radius = {
  sm: 7,
  md: 9,
  lg: 12,
  xl: 14,
  xxl: 18,
  round: 999,
};

export const iconSizes = {
  sm: 15,
  md: 18,
  lg: 20,
  xl: 25,
};

export const controlHeights = {
  sm: 34,
  md: 42,
  lg: 50,
  xl: 66,
  inputCompact: 48,
  input: 64,
  inputMultilineCompact: 88,
  inputMultiline: 104,
  iconButton: 36,
  fab: 58,
};

export const layout = {
  headerPaddingX: spacing.xxl,
  screenPaddingX: spacing.xxl,
  screenPaddingTop: spacing.xl,
  screenPaddingBottom: 94,
  cardGap: spacing.md,
  floatingContentPadding: 140,
  floatingContentPaddingCompact: 132,
};

export const shadows = {
  card: {
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  floating: {
    shadowColor: colors.textDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
};
