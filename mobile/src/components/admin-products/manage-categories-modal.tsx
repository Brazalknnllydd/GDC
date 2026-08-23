import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

import type { Category } from './products-screen-data';
import { spacing } from '../../constants/design-system';
import { colors, textRoles } from '../../constants/theme';
import { AdminModalShell } from '../ui/admin-modal-shell';
import { AppButton } from '../ui/app-button';
import { ModalActions } from '../ui/modal-actions';
import { SurfaceCard } from '../ui/surface-card';

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
  return (
    <AdminModalShell
      height="72%"
      maxHeight="72%"
      onClose={onClose}
      title="Manage Categories"
      visible={visible}
      footer={
        <ModalActions>
          <AppButton label="Add New Category" onPress={onCreate} variant="primary" />
        </ModalActions>
      }>
      <ScrollView
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={styles.scrollView}>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories created yet.</Text>
        ) : (
          categories.map((category) => {
            const canDelete = category.productCount === 0;

            return (
              <SurfaceCard key={category.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {category.productCount} product{category.productCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <AppButton
                      fullWidth={false}
                      icon={({ color, size }) => (
                        <Pencil color={color} size={size} strokeWidth={2.1} />
                      )}
                      label="Edit"
                      onPress={() => onEdit(category)}
                      size="sm"
                      variant="secondary"
                    />
                    <AppButton
                      disabled={!canDelete}
                      fullWidth={false}
                      icon={({ color, size }) => (
                        <Trash2 color={color} size={size} strokeWidth={2.1} />
                      )}
                      label="Delete"
                      onPress={() => onDelete(category)}
                      size="sm"
                      variant="dangerOutline"
                    />
                  </View>
                </View>
                <Text style={styles.description}>
                  {category.description?.trim() || 'No description added yet.'}
                </Text>
                {!canDelete ? (
                  <Text style={styles.helperText}>
                    Remove or reassign products before deleting this category.
                  </Text>
                ) : null}
              </SurfaceCard>
            );
          })
        )}
      </ScrollView>
    </AdminModalShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textTertiary,
    ...textRoles.body,
    fontSize: 16,
    paddingBottom: spacing.lg,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardHeader: {
    gap: 12,
  },
  cardTitleWrap: {
    gap: 4,
  },
  categoryName: {
    color: colors.textStrong,
    ...textRoles.value,
    fontSize: 18,
  },
  categoryCount: {
    color: colors.textTertiary,
    ...textRoles.label,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  description: {
    color: colors.textSoft,
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
  },
  helperText: {
    color: colors.dangerStrong,
    ...textRoles.label,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});
