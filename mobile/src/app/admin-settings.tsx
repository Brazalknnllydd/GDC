import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LogOut, Plus, ShieldCheck, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { tabs as productTabs, type Category } from '../components/admin-products/products-screen-data';
import { AdminModalShell } from '../components/ui/admin-modal-shell';
import { AdminPageScreen } from '../components/ui/admin-page-screen';
import { AppButton } from '../components/ui/app-button';
import { FilterChip } from '../components/ui/filter-chip';
import { ModalActions } from '../components/ui/modal-actions';
import { ProductFormInput } from '../components/ui/product-form-input';
import { SurfaceCard } from '../components/ui/surface-card';
import { layout, radius, spacing } from '../constants/design-system';
import { colors, textRoles, textSizes } from '../constants/theme';
import { apiClient } from '../lib/api';

type StaffCashier = {
  allowedCategories: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  id: number;
  name: string;
  role: string;
  username: string;
};

type FormErrors = Partial<Record<'allowedCategories' | 'name' | 'password' | 'username', string>>;

export default function AdminSettingsScreen() {
  const router = useRouter();
  const settingsTabs = productTabs.map((tab) =>
    tab.label === 'Settings'
      ? { ...tab, active: true, route: '/admin-settings' as const }
      : { ...tab, active: false }
  );

  const [cashiers, setCashiers] = useState<StaffCashier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [screenError, setScreenError] = useState('');
  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCashier, setIsSavingCashier] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [cashierUsername, setCashierUsername] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState('');

  async function loadSettingsData() {
    try {
      setScreenError('');
      setIsLoading(true);

      const [cashiersResponse, categoriesResponse] = await Promise.all([
        apiClient.get<StaffCashier[]>('/staff/cashiers'),
        apiClient.get<Category[]>('/categories'),
      ]);

      setCashiers(cashiersResponse.data);
      setCategories(categoriesResponse.data.sort((left, right) => left.name.localeCompare(right.name)));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setScreenError(error.response?.data?.message ?? 'Could not load admin settings right now.');
        return;
      }

      setScreenError('Could not load admin settings right now.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSettingsData();
  }, []);

  const assignedCategoryCount = useMemo(
    () => cashiers.reduce((sum, cashier) => sum + cashier.allowedCategories.length, 0),
    [cashiers]
  );

  function resetCashierForm() {
    setCashierName('');
    setCashierUsername('');
    setCashierPassword('');
    setSelectedCategoryIds([]);
    setFormErrors({});
    setFormMessage('');
  }

  function closeAddCashierModal() {
    if (isSavingCashier) {
      return;
    }

    setShowAddCashierModal(false);
    resetCashierForm();
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((value) => value !== categoryId)
        : [...current, categoryId]
    );

    setFormErrors((current) => ({
      ...current,
      allowedCategories: undefined,
    }));
  }

  async function handleSaveCashier() {
    const trimmedName = cashierName.trim();
    const trimmedUsername = cashierUsername.trim();
    const trimmedPassword = cashierPassword.trim();
    const nextErrors: FormErrors = {};

    if (!trimmedName) {
      nextErrors.name = 'Cashier name is required.';
    }

    if (!trimmedUsername) {
      nextErrors.username = 'Username is required.';
    }

    if (!trimmedPassword) {
      nextErrors.password = 'Password is required.';
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (selectedCategoryIds.length === 0) {
      nextErrors.allowedCategories = 'Choose at least one category this cashier can sell.';
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSavingCashier(true);
      setFormMessage('');

      const response = await apiClient.post<StaffCashier>('/staff/cashiers', {
        allowedCategoryIds: selectedCategoryIds,
        name: trimmedName,
        password: trimmedPassword,
        username: trimmedUsername,
      });

      setCashiers((current) => [response.data, ...current]);
      setShowAddCashierModal(false);
      resetCashierForm();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ?? 'Could not create cashier right now.';
        setFormMessage(message);
        return;
      }

      setFormMessage('Could not create cashier right now.');
    } finally {
      setIsSavingCashier(false);
    }
  }

  return (
    <AdminPageScreen
      title="Settings"
      introDescription="Control cashier access and decide which product categories each cashier is allowed to sell."
      bottomNavItems={settingsTabs}>
      <SurfaceCard style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.iconWrap}>
            <ShieldCheck color={colors.secondary} size={24} strokeWidth={2} />
          </View>

          <AppButton
            disabled={categories.length === 0}
            fullWidth={false}
            icon={({ color, size }) => <Plus color={color} size={size} strokeWidth={2.2} />}
            label="Add Cashier"
            onPress={() => {
              resetCashierForm();
              setShowAddCashierModal(true);
            }}
            size="sm"
            variant="primary"
          />
        </View>

        <Text style={styles.heroTitle}>Cashier Category Access</Text>
        <Text style={styles.heroText}>
          Create cashier accounts and limit them to the product categories you assign. Products
          from those categories automatically become the only items they can sell.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Cashiers</Text>
            <Text style={styles.summaryValue}>{cashiers.length}</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>Assigned Categories</Text>
            <Text style={styles.summaryValue}>{assignedCategoryCount}</Text>
          </View>
        </View>

        {categories.length === 0 ? (
          <Text style={styles.helperText}>
            Add product categories first before creating cashier access rules.
          </Text>
        ) : null}
      </SurfaceCard>

      <Text style={styles.sectionTitle}>Cashier Access List</Text>
      {isLoading ? (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Loading cashier access...</Text>
        </SurfaceCard>
      ) : cashiers.length > 0 ? (
        <View style={styles.cashierList}>
          {cashiers.map((cashier) => (
            <SurfaceCard key={cashier.id} style={styles.cashierCard}>
              <View style={styles.cashierCardHeader}>
                <View style={styles.cashierIdentityRow}>
                  <View style={styles.cashierAvatar}>
                    <UserRound color={colors.secondary} size={18} strokeWidth={2.1} />
                  </View>
                  <View style={styles.cashierIdentityText}>
                    <Text style={styles.cashierName}>{cashier.name}</Text>
                    <Text style={styles.cashierMeta}>
                      @{cashier.username} • {cashier.role}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cashierCreatedAt}>
                  {new Date(cashier.createdAt).toLocaleDateString('en-PH', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.assignmentLabel}>Allowed categories</Text>
              <View style={styles.categoryWrap}>
                {cashier.allowedCategories.length > 0 ? (
                  cashier.allowedCategories.map((category) => (
                    <View key={category.id} style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{category.name}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.categoryPillMuted}>
                    <Text style={styles.categoryPillMutedText}>All categories</Text>
                  </View>
                )}
              </View>
            </SurfaceCard>
          ))}
        </View>
      ) : (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No cashier accounts added yet</Text>
          <Text style={styles.emptyText}>
            Add your first cashier, assign the categories they can sell, and their product list will
            follow those category rules automatically.
          </Text>
        </SurfaceCard>
      )}

      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

      <AppButton
        fullWidth={false}
        icon={({ color, size }) => <LogOut color={color} size={size} strokeWidth={2.2} />}
        label="Logout"
        onPress={() => router.replace('/')}
        style={styles.logoutButton}
        variant="danger"
      />

      <AdminModalShell
        footer={
          <ModalActions stacked>
            <AppButton
              disabled={categories.length === 0}
              label="Create Cashier"
              loading={isSavingCashier}
              onPress={handleSaveCashier}
              variant="primary"
            />
            <AppButton
              disabled={isSavingCashier}
              label="Cancel"
              onPress={closeAddCashierModal}
              variant="secondary"
            />
          </ModalActions>
        }
        maxHeight="88%"
        onClose={closeAddCashierModal}
        title="Add Cashier"
        visible={showAddCashierModal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProductFormInput
            errorMessage={formErrors.name}
            label="CASHIER NAME"
            onChangeText={(value) => {
              setCashierName(value);
              if (formErrors.name) {
                setFormErrors((current) => ({ ...current, name: undefined }));
              }
            }}
            placeholder="Enter cashier full name"
            value={cashierName}
          />

          <ProductFormInput
            errorMessage={formErrors.username}
            label="USERNAME"
            onChangeText={(value) => {
              setCashierUsername(value);
              if (formErrors.username) {
                setFormErrors((current) => ({ ...current, username: undefined }));
              }
            }}
            placeholder="Create a login username"
            value={cashierUsername}
          />

          <ProductFormInput
            errorMessage={formErrors.password}
            label="PASSWORD"
            onChangeText={(value) => {
              setCashierPassword(value);
              if (formErrors.password) {
                setFormErrors((current) => ({ ...current, password: undefined }));
              }
            }}
            placeholder="At least 6 characters"
            secureTextEntry
            value={cashierPassword}
          />

          <Text style={styles.modalSectionLabel}>ALLOWED CATEGORIES</Text>
          <Text style={styles.modalSectionText}>
            Choose the categories this cashier is allowed to sell. Their cashier product list will
            only show items from the selected categories.
          </Text>

          <View style={styles.modalCategoryWrap}>
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                active={selectedCategoryIds.includes(category.id)}
                label={category.name}
                onPress={() => toggleCategory(category.id)}
              />
            ))}
          </View>

          {formErrors.allowedCategories ? (
            <Text style={styles.formErrorText}>{formErrors.allowedCategories}</Text>
          ) : null}

          {formMessage ? <Text style={styles.formErrorText}>{formMessage}</Text> : null}
        </ScrollView>
      </AdminModalShell>
    </AdminPageScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  heroTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: textSizes.large,
    marginBottom: spacing.sm,
  },
  heroText: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 15,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  summaryPill: {
    backgroundColor: '#F7F8FC',
    borderColor: '#DBE0EE',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    color: '#6B7280',
    ...textRoles.label,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#1B1F2D',
    ...textRoles.value,
    fontSize: 20,
  },
  helperText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: '#171C28',
    ...textRoles.value,
    fontSize: textSizes.large,
    marginBottom: spacing.md,
    marginTop: spacing.section,
  },
  cashierList: {
    gap: spacing.md,
  },
  cashierCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  cashierCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cashierIdentityRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: spacing.md,
  },
  cashierAvatar: {
    alignItems: 'center',
    backgroundColor: '#F1F4FE',
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  cashierIdentityText: {
    flex: 1,
  },
  cashierName: {
    color: '#1B1F2D',
    ...textRoles.value,
    fontSize: 17,
    marginBottom: 2,
  },
  cashierMeta: {
    color: '#697082',
    ...textRoles.label,
    fontSize: 13,
  },
  cashierCreatedAt: {
    color: '#7A8092',
    ...textRoles.label,
    fontSize: 12,
    marginTop: 2,
  },
  assignmentLabel: {
    color: '#5D6476',
    ...textRoles.label,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryPill: {
    backgroundColor: '#EEF2FF',
    borderColor: '#CBD5FF',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryPillText: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 12,
  },
  categoryPillMuted: {
    backgroundColor: '#F4F5F7',
    borderColor: '#DFE3EA',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryPillMutedText: {
    color: '#697082',
    ...textRoles.label,
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.secondary,
    ...textRoles.value,
    fontSize: 17,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: 13,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  logoutButton: {
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  modalSectionLabel: {
    color: '#373C4A',
    ...textRoles.label,
    fontSize: textSizes.medium,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  modalSectionText: {
    color: '#5D6476',
    ...textRoles.body,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  modalCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: layout.cardGap,
  },
  formErrorText: {
    color: '#B3261E',
    ...textRoles.label,
    fontSize: 13,
    marginBottom: spacing.md,
  },
});
