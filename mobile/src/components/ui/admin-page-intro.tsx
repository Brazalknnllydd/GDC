import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

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
  return (
    <View style={style}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
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
    color: '#2E3341',
    ...textRoles.body,
    fontSize: textSizes.large,
    lineHeight: 32,
    marginBottom: spacing.section,
    maxWidth: 500,
  },
});
