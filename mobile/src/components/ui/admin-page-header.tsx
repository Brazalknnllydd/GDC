import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Bell } from 'lucide-react-native';

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
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <Image
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
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconButtonPressed]}>
          <Bell color={colors.textSecondary} size={20} strokeWidth={2.05} />
        </Pressable>
        {showNotificationDot ? <View style={styles.notificationDot} /> : null}
      </View>
    </View>
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
    paddingVertical: spacing.md,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  avatar: {
    borderRadius: radius.round,
    height: 46,
    marginRight: spacing.md,
    width: 46,
  },
  headerTitle: {
    color: colors.secondary,
    ...textRoles.heading,
    lineHeight: 25,
  },
  headerTitleCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  headerSubtitle: {
    color: colors.textHeading,
    fontFamily: fonts.medium,
    fontSize: textSizes.smallCaps,
    letterSpacing: 2.2,
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
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: controlHeights.iconButton,
    justifyContent: 'center',
    margin: 0,
    width: controlHeights.iconButton,
  },
  headerIconButtonPressed: {
    opacity: 0.7,
  },
  notificationDot: {
    backgroundColor: colors.dangerDot,
    borderRadius: radius.round,
    borderColor: colors.card,
    borderWidth: 1.5,
    height: 9,
    position: 'absolute',
    right: 1,
    top: 1,
    width: 9,
  },
});
