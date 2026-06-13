import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';

import { layout, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';

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
  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <Image
          source={require('../../../assets/images/logo.jpg')}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Pressable style={styles.headerIconButton}>
        <Bell color="#383B4F" size={23} strokeWidth={2.1} />
        {showNotificationDot ? <View style={styles.notificationDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#D7DAE3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.headerPaddingX,
    paddingVertical: 14,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  avatar: {
    borderRadius: 24,
    height: 56,
    marginRight: spacing.md,
    width: 56,
  },
  headerTitle: {
    color: colors.secondary,
    ...textRoles.heading,
    lineHeight: 28,
  },
  headerSubtitle: {
    color: '#383D4A',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 2,
  },
  headerIconButton: {
    padding: 2,
    position: 'relative',
  },
  notificationDot: {
    backgroundColor: '#D92926',
    borderRadius: 999,
    height: 6,
    position: 'absolute',
    right: 0,
    top: 2,
    width: 6,
  },
});
