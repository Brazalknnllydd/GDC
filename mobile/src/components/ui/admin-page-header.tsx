import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Avatar, IconButton, Surface } from 'react-native-paper';

import { controlHeights, layout, radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  showNotificationDot?: boolean;
};

export function AdminPageHeader({
  title,
  subtitle = 'INVENTORY PRO',
  showNotificationDot = true,
}: AdminPageHeaderProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return (
    <Surface elevation={1} style={styles.header}>
      <View style={styles.headerIdentity}>
        <Avatar.Image
          size={54}
          source={require('../../../assets/images/logo.jpg')}
          style={styles.avatar}
        />
        <View>
          <Text style={[styles.headerTitle, isCompactPhone ? styles.headerTitleCompact : undefined]}>
            {title}
          </Text>
          <Text
            style={[styles.headerSubtitle, isCompactPhone ? styles.headerSubtitleCompact : undefined]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.headerIconWrap}>
        <IconButton
          icon={() => <Bell color={colors.textSecondary} size={22} strokeWidth={2.05} />}
          onPress={() => {}}
          size={22}
          style={styles.headerIconButton}
        />
        {showNotificationDot ? <View style={styles.notificationDot} /> : null}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.borderInput,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.headerPaddingX,
    paddingVertical: spacing.md + 2,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  avatar: {
    marginRight: spacing.md,
  },
  headerTitle: {
    color: colors.secondary,
    ...textRoles.heading,
    lineHeight: 28,
  },
  headerTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerSubtitle: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 2.6,
    marginTop: 2,
  },
  headerSubtitleCompact: {
    fontSize: textSizes.xsmall,
    letterSpacing: 2.1,
  },
  headerIconWrap: {
    position: 'relative',
  },
  headerIconButton: {
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radius.round,
    height: controlHeights.iconButton,
    margin: 0,
    width: controlHeights.iconButton,
  },
  notificationDot: {
    backgroundColor: colors.dangerDot,
    borderRadius: radius.round,
    borderColor: colors.card,
    borderWidth: 1.5,
    height: 10,
    position: 'absolute',
    right: 1,
    top: 1,
    width: 10,
  },
});
