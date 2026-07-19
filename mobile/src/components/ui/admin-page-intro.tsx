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
    fontSize: textSizes.title,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textHeading,
    ...textRoles.body,
    fontSize: textSizes.title,
    lineHeight: 26,
    marginBottom: spacing.xl,
    maxWidth: 500,
  },
  descriptionCompact: {
    fontSize: textSizes.medium,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
});
