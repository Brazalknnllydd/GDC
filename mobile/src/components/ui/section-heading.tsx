import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { textRoles, textSizes } from '../../constants/theme';

type SectionHeadingProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export function SectionHeading({ children, style }: SectionHeadingProps) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  heading: {
    color: '#2D3141',
    ...textRoles.label,
    fontSize: textSizes.small + 2,
    letterSpacing: 3,
  },
});
