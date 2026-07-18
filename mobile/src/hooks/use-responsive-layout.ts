import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    compactPhone: width < 390,
    isCompactPhone: width < 390,
    isTablet: width >= 820,
    isWideTablet: width >= 1080,
  };
}
