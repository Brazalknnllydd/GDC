import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;

  return {
    width,
    height,
    compactPhone: !isTablet,
    isCompactPhone: !isTablet,
    isTablet,
    isWideTablet: width >= 1080,
  };
}
