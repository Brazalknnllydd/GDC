import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    compactPhone: width < 768,
    isCompactPhone: width < 768,
    isTablet: width >= 768,
    isWideTablet: width >= 1080,
  };
}
