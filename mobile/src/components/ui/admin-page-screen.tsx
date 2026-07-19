import type { ComponentType, ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout, spacing } from '../../constants/design-system';
import { colors } from '../../constants/theme';
import type { BottomNavItem } from '../../lib/app-routes';
import { AdminBottomNav } from './admin-bottom-nav';
import { AdminPageHeader } from './admin-page-header';
import { AdminPageIntro } from './admin-page-intro';

type AdminPageScreenProps = {
  title: string;
  introDescription: string;
  children: ReactNode;
  bottomNavItems?: BottomNavItem[];
  introChildren?: ReactNode;
  floatingContent?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  pageStyle?: StyleProp<ViewStyle>;
};

export function AdminPageScreen({
  title,
  introDescription,
  children,
  bottomNavItems,
  introChildren,
  floatingContent,
  contentContainerStyle,
  pageStyle,
}: AdminPageScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isCompactPhone = width < 430;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, pageStyle]}>
        <AdminPageHeader title={title} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isCompactPhone ? styles.scrollContentCompact : undefined,
            isTablet ? styles.scrollContentTablet : undefined,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}>
          <AdminPageIntro description={introDescription}>{introChildren}</AdminPageIntro>
          {children}
        </ScrollView>

        {floatingContent}
        {bottomNavItems ? <AdminBottomNav items={bottomNavItems} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  page: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
  },
  scrollContent: {
    paddingBottom: layout.screenPaddingBottom,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: layout.screenPaddingTop,
  },
  scrollContentCompact: {
    paddingHorizontal: spacing.xl - 2,
    paddingTop: spacing.xl,
  },
  scrollContentTablet: {
    alignSelf: 'center',
    maxWidth: 980,
    width: '100%',
  },
});
