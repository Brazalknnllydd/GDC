import type { ComponentType, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout } from '../../constants/design-system';
import { AdminBottomNav } from './admin-bottom-nav';
import { AdminPageHeader } from './admin-page-header';
import { AdminPageIntro } from './admin-page-intro';

type IconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

type NavItem = {
  label: string;
  icon: ComponentType<IconProps>;
  active?: boolean;
  route?: '/admin' | '/admin-products' | '/admin-sales' | '/admin-reports' | '/admin-settings';
};

type AdminPageScreenProps = {
  title: string;
  introDescription: string;
  children: ReactNode;
  bottomNavItems?: NavItem[];
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
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, pageStyle]}>
        <AdminPageHeader title={title} />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
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
    backgroundColor: '#F7F7FA',
  },
  page: {
    flex: 1,
    backgroundColor: '#F7F7FA',
  },
  scrollContent: {
    paddingBottom: layout.screenPaddingBottom,
    paddingHorizontal: layout.screenPaddingX,
    paddingTop: layout.screenPaddingTop,
  },
});
