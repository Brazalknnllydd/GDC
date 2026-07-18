import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '../../constants/design-system';
import { colors, textRoles, textSizes } from '../../constants/theme';

type AdminPageIntroProps = {
  title?: string;
  description: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function AdminPageIntro({
  title = 'Overview',
  description,
  style,
  children,
}: AdminPageIntroProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return (
    <View style={style}>
      <Text style={styles.title}>{title}</Text>
      <Text
        style={[
          styles.description,
          isCompactPhone ? styles.descriptionCompact : undefined,
        ]}>
        {description}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 20,
    marginBottom: 10,
  },
  description: {
    color: colors.textHeading,
    ...textRoles.body,
    fontSize: textSizes.large,
    lineHeight: 32,
    marginBottom: spacing.section,
    maxWidth: 500,
  },
  descriptionCompact: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: spacing.xl + 2,
  },
});
