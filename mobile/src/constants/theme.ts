export const colors = {
  primary: '#FBC02D',
  secondary: '#1A237E',
  tertiary: '#D32F2F',
  neutral: '#212121',
  white: '#FFFFFF',

  background: '#FAFAFA',
  backgroundMuted: '#F7F7FA',
  card: '#FFFFFF',
  cardAlt: '#F8F9FD',
  text: '#212121',
  textStrong: '#131927',
  textHeading: '#2D3141',
  muted: '#6B7280',
  textSecondary: '#5B6477',
  textTertiary: '#697285',
  textSubtle: '#80879A',
  textSoft: '#4B5563',
  textDark: '#1A2030',
  textInverse: '#FFFFFF',
  textOnSecondaryMuted: '#D8DEFF',
  border: '#E5E7EB',
  borderStrong: '#CED3E3',
  borderInput: '#D7DCEC',
  borderSoft: '#E6EAF4',
  borderMuted: '#DDE2F0',
  borderPanel: '#DDE4F3',
  borderInfo: '#CAD7FB',
  borderInfoStrong: '#B9C4F4',
  borderSuccess: '#A7F3D0',
  borderDanger: '#FECACA',
  borderDangerSoft: '#F2B8B5',
  input: '#F9FAFB',
  divider: '#E3E7F1',
  dividerStrong: '#E4E8F2',
  surfaceMuted: '#F3F6FF',
  surfaceSubtle: '#F6F8FC',
  surfaceSoft: '#F8FAFF',
  surfaceInfo: '#EEF3FF',
  surfaceInfoMuted: '#EEF4FF',
  surfaceSuccess: '#ECFDF5',
  surfaceSuccessMuted: '#EAF8EF',
  surfaceDanger: '#FEF2F2',
  surfaceDangerMuted: '#FDEEEE',
  surfaceNeutral: '#F4F4F6',
  surfaceHeader: '#F5F7FD',
  surfaceOverlay: '#E0E7FF',
  surfaceOverlayMuted: '#EEF1F8',
  surfacePurple: '#F5EDFF',
  surfaceDisabled: '#F5F6FA',
  surfaceBrandMuted: '#EAF0FF',
  surfaceBrandSoft: '#EEF2FF',
  surfaceSuccessSoft: '#ECFDF3',
  surfaceWarningSoft: '#FFF4DE',
  success: '#059669',
  successStrong: '#047857',
  successBright: '#16A34A',
  danger: '#DC2626',
  dangerStrong: '#B91C1C',
  dangerAccent: '#D22D2D',
  dangerDot: '#D92926',
  info: '#2563EB',
  infoStrong: '#2A3CC7',
  warning: '#A76300',
  warningStrong: '#8A5A00',
  purple: '#7C3AED',
  hero: '#133CBE',
  accentDot: '#5BF08C',
  fallbackImage: '#D8DEE9',
  overlayInverse12: 'rgba(255,255,255,0.12)',
  overlayInverse72: 'rgba(255,255,255,0.72)',
  overlayScrim: 'rgba(19,25,39,0.34)',
};

export const colorChannels = {
  secondary: '26,35,126',
  textSecondary: '91,100,119',
};

export function withOpacity(channel: string, opacity: number) {
  return `rgba(${channel}, ${opacity})`;
}

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const textSizes = {
  xsmall: 10,
  smallCaps: 11,
  small: 11,
  body: 12,
  bodyLarge: 13,
  medium: 14,
  title: 16,
  titleLarge: 17,
  large: 18,
  xlarge: 20,
  hero: 24,
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
