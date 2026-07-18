import { StyleSheet, Text, useWindowDimensions, type StyleProp, type TextStyle } from 'react-native';

import { colors, textRoles, textSizes } from '../../constants/theme';

type SectionHeadingProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export function SectionHeading({ children, style }: SectionHeadingProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return (
    <Text style={[styles.heading, isCompactPhone ? styles.headingCompact : undefined, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.small + 2,
    letterSpacing: 2.4,
  },
  headingCompact: {
    fontSize: 13,
    letterSpacing: 2.1,
  },
});
