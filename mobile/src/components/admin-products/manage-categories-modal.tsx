import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

import type { Category } from './products-screen-data';
import { spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { ActionIconButton } from '../ui/action-icon-button';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';

type CategoryWithCount = Category & {
  productCount: number;
};

type ManageCategoriesModalProps = {
  categories: CategoryWithCount[];
  onClose: () => void;
  onCreate: () => void;
  onDelete: (category: CategoryWithCount) => void;
  onEdit: (category: CategoryWithCount) => void;
  visible: boolean;
};

export function ManageCategoriesModal({
  categories,
  onClose,
  onCreate,
  onDelete,
  onEdit,
  visible,
}: ManageCategoriesModalProps) {
  const { isTablet } = useResponsiveLayout();
  const renderActions = (category: CategoryWithCount, canDelete: boolean) => (
    <View style={styles.actions}>
      <ActionIconButton
        accessibilityLabel={`Edit category ${category.name}`}
        icon={Pencil}
        onPress={() => onEdit(category)}
      />
      <ActionIconButton
        accessibilityLabel={`Delete category ${category.name}`}
        disabled={!canDelete}
        icon={Trash2}
        onPress={() => onDelete(category)}
      />
    </View>
  );

  return (
    <AdminModalShell
      compact={!isTablet}
      height={isTablet ? '62%' : '72%'}
      maxHeight={isTablet ? '78%' : '82%'}
      maxWidth={isTablet ? 760 : 450}
      onClose={onClose}
      title="Manage Categories"
      visible={visible}
      widthRatio={isTablet ? 0.82 : 0.94}
      footer={
        <ModalActions>
          <AppButton label="Add New Category" onPress={onCreate} variant="primary" />
        </ModalActions>
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={styles.scrollView}>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories created yet.</Text>
        ) : !isTablet ? (
          <View style={styles.table}>
            <View style={styles.phoneTableHeader}>
              <Text style={[styles.headerCell, styles.phoneNameCol]}>CATEGORY</Text>
              <Text style={[styles.headerCell, styles.phoneCountCol]}>PRODUCTS</Text>
            </View>

            {categories.map((category) => {
              const canDelete = category.productCount === 0;

              return (
                <View key={category.id} style={styles.phoneRow}>
                  <View style={styles.phoneRowTop}>
                    <View style={styles.phoneNameCol}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text style={styles.phoneDescription} numberOfLines={2}>
                        {category.description?.trim() || 'No description added yet.'}
                      </Text>
                      {!canDelete ? (
                        <Text style={styles.helperText} numberOfLines={2}>
                          Remove or reassign products before deleting.
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.bodyCell, styles.phoneCountCol]}>
                      {category.productCount}
                    </Text>
                  </View>
                  <View style={styles.phoneActionsWrap}>
                    {renderActions(category, canDelete)}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.table, styles.tableWide]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.nameCol]}>CATEGORY</Text>
                <Text style={[styles.headerCell, styles.countCol]}>PRODUCTS</Text>
                <Text style={[styles.headerCell, styles.descriptionCol]}>DESCRIPTION</Text>
                <Text style={[styles.headerCell, styles.actionCol]}>ACTIONS</Text>
              </View>

              {categories.map((category) => {
                const canDelete = category.productCount === 0;

                return (
                  <View key={category.id} style={styles.tableRow}>
                    <View style={styles.nameCol}>
                      <Text style={styles.categoryName} numberOfLines={1}>
                        {category.name}
                      </Text>
                      {!canDelete ? (
                        <Text style={styles.helperText} numberOfLines={2}>
                          Remove or reassign products before deleting.
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.bodyCell, styles.countCol]}>
                      {category.productCount}
                    </Text>
                    <Text style={[styles.bodyCell, styles.descriptionCol]} numberOfLines={2}>
                      {category.description?.trim() || 'No description added yet.'}
                    </Text>
                    {renderActions(category, canDelete)}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textTertiary,
    ...textRoles.body,
    fontSize: 14,
    paddingBottom: spacing.lg,
  },
  table: {
    borderColor: colors.borderPanel,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  tableWide: {
    minWidth: 620,
  },
  tableHeader: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  tableRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  headerCell: {
    color: colors.textSecondary,
    ...textRoles.label,
    fontSize: 10,
  },
  bodyCell: {
    color: colors.textSoft,
    ...textRoles.body,
    fontSize: 13,
  },
  nameCol: {
    flex: 1.1,
    minWidth: 150,
    paddingRight: spacing.md,
  },
  countCol: {
    minWidth: 80,
    textAlign: 'center',
    width: 90,
  },
  descriptionCol: {
    flex: 1.6,
    minWidth: 190,
    paddingRight: spacing.md,
  },
  actionCol: {
    minWidth: 92,
    textAlign: 'center',
    width: 104,
  },
  categoryName: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minWidth: 92,
    width: 104,
  },
  phoneTableHeader: {
    alignItems: 'center',
    backgroundColor: colors.surfaceNeutral,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
  },
  phoneRow: {
    backgroundColor: colors.card,
    borderBottomColor: colors.borderPanel,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  phoneRowTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneNameCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  phoneCountCol: {
    minWidth: 64,
    textAlign: 'center',
    width: 72,
  },
  phoneDescription: {
    color: colors.textSoft,
    ...textRoles.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  phoneActionsWrap: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  helperText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
});
