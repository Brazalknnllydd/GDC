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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 22,
  section: 28,
  block: 34,
};

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 22,
  round: 999,
};

export const iconSizes = {
  sm: 16,
  md: 22,
  lg: 24,
  xl: 31,
};

export const layout = {
  headerPaddingX: spacing.xxl,
  screenPaddingX: spacing.xxl,
  screenPaddingTop: spacing.xxl,
  screenPaddingBottom: 120,
  cardGap: spacing.md + 2,
};

export const shadows = {
  card: {
    shadowColor: '#121B3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  floating: {
    shadowColor: '#0C2546',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
};
