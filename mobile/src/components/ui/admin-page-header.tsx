import { StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Avatar, IconButton, Surface } from 'react-native-paper';

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
    <Surface elevation={1} style={styles.header}>
      <View style={styles.headerIdentity}>
        <Avatar.Image
          size={56}
          source={require('../../../assets/images/logo.jpg')}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <IconButton
        icon={() => <Bell color="#383B4F" size={23} strokeWidth={2.1} />}
        onPress={() => {}}
        size={22}
        style={styles.headerIconButton}
      />
        {showNotificationDot ? <View style={styles.notificationDot} /> : null}
    </Surface>
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
    marginRight: spacing.md,
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
    margin: 0,
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
