export const colors = {
  primary: '#FBC02D',
  secondary: '#1A237E',
  tertiary: '#D32F2F',
  neutral: '#212121',

  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#212121',
  muted: '#6B7280',
  border: '#E5E7EB',
  input: '#F9FAFB',
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const textSizes = {
  small: 12,
  medium: 16,
  large: 22,
};

// Typography rule:
// labels/meta use medium, body copy uses regular, and numeric/value content uses bold.
export const textRoles = {
  body: {
    fontFamily: fonts.regular,
    fontSize: textSizes.medium,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: textSizes.large,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: textSizes.small,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: textSizes.medium,
  },
};
