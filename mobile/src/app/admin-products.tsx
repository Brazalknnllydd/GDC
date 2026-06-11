import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  Bell,
  Camera,
  ChevronDown,
  LayoutDashboard,
  Package,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors, fonts } from '../constants/theme';
import { AdminBottomNav } from '../components/ui/admin-bottom-nav';
import { FilterChip } from '../components/ui/filter-chip';
import { InventoryStatCard } from '../components/ui/inventory-stat-card';
import { ProductListItem } from '../components/ui/product-list-item';
import { ProductFormInput } from '../components/ui/product-form-input';
import { SectionHeading } from '../components/ui/section-heading';

const overviewCards = [
  { title: 'TOTAL\nPRODUCTS', value: '1,248', detail: '+12%', accent: 'success' as const },
  { title: 'LOW STOCK', value: '8', detail: 'Requires Action', accent: 'danger' as const },
  { title: 'CATEGORIES', value: '12', detail: 'Active Sections', accent: 'default' as const },
  { title: 'INVENTORY VALUE', value: 'P2.4M', detail: 'Market Valuation', accent: 'default' as const },
];

const categories = [
  { label: 'All', active: true },
  { label: 'Frozen Meat' },
  { label: 'Seafood' },
  { label: 'Vegetables' },
];

const recentlyAdded = [
  {
    category: 'Frozen Meat',
    emoji: '🍗',
    low: true,
    name: 'Whole Frozen Chicken',
    price: 'P450.00',
    sku: 'SKU-7721-B',
    unitsText: '8 units left',
  },
  {
    category: 'Seafood',
    emoji: '🍣',
    name: 'Atlantic Salmon',
    price: 'P1,200.00',
    sku: 'SKU-8829-S',
    unitsText: '42 units left',
  },
  {
    category: 'Vegetables',
    emoji: '🥦',
    name: 'Mixed Vegetables',
    price: 'P185.00',
    sku: 'SKU-4412-V',
    unitsText: '156 units left',
  },
];

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, route: '/admin' as const },
  { label: 'Products', icon: Package, active: true, route: '/admin-products' as const },
  { label: 'Sales', icon: ReceiptText, active: false },
  { label: 'Reports', icon: BarChart3, active: false },
  { label: 'Settings', icon: Settings, active: false, route: '/admin-settings' as const },
];

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export default function AdminProductsScreen() {
  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState('');
  const [categoryValue, setCategoryValue] = useState('Frozen Goods');
  const [barcode, setBarcode] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [weightVolume, setWeightVolume] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.headerTitle}>Products</Text>
              <Text style={styles.headerSubtitle}>INVENTORY PRO</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconButton}>
              <Search color="#383B4F" size={23} strokeWidth={2.1} />
            </Pressable>
            <Pressable style={styles.headerIconButton}>
              <Bell color="#383B4F" size={23} strokeWidth={2.1} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.overviewLabel}>Overview</Text>
          <Text style={styles.overviewText}>Manage inventory and pricing across all stores.</Text>

          <View style={styles.cardsGrid}>
            {overviewCards.map((card) => (
              <InventoryStatCard
                key={card.title}
                accent={card.accent}
                detail={card.detail}
                title={card.title}
                value={card.value}
              />
            ))}
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search color="#6F7487" size={22} strokeWidth={2} />
              <TextInput
                placeholder="Search products..."
                placeholderTextColor="#747B8D"
                style={styles.searchInput}
              />
            </View>

            <Pressable style={styles.filterButton}>
              <SlidersHorizontal color={colors.secondary} size={22} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {categories.map((category) => (
              <FilterChip key={category.label} active={category.active} label={category.label} />
            ))}
          </ScrollView>

          <SectionHeading style={styles.sectionHeading}>RECENTLY ADDED</SectionHeading>
          <View style={styles.productsList}>
            {recentlyAdded.map((product) => (
              <ProductListItem key={product.sku} {...product} />
            ))}
          </View>
        </ScrollView>

        <Pressable onPress={() => setShowAddProduct(true)} style={styles.fab}>
          <Text style={styles.fabPlus}>+</Text>
        </Pressable>

        <AdminBottomNav items={tabs} />

        <Modal
          animationType="fade"
          transparent
          visible={showAddProduct}
          onRequestClose={() => setShowAddProduct(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Product</Text>
                <Pressable onPress={() => setShowAddProduct(false)} style={styles.modalCloseButton}>
                  <X color="#444857" size={30} strokeWidth={2.2} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}>
                <ProductFormInput
                  label="PRODUCT NAME"
                  onChangeText={setProductName}
                  placeholder="e.g. Frozen Atlantic Salmon"
                  value={productName}
                />

                <ProductFormInput
                  editable={false}
                  label="CATEGORY"
                  onChangeText={setCategoryValue}
                  placeholder="Frozen Goods"
                  rightSlot={<ChevronDown color="#4B5060" size={24} strokeWidth={2.2} />}
                  value={categoryValue}
                />

                <ProductFormInput
                  keyboardType="numeric"
                  label="BARCODE / SKU"
                  onChangeText={setBarcode}
                  placeholder="0000 0000 0000"
                  rightSlot={
                    <View style={styles.barcodeSlot}>
                      <ScanLine color={colors.secondary} size={24} strokeWidth={2.1} />
                    </View>
                  }
                  value={barcode}
                />

                <View style={styles.twoColumnRow}>
                  <View style={styles.halfField}>
                    <ProductFormInput
                      keyboardType="number-pad"
                      label="UNIT PRICE (₱)"
                      onChangeText={(value) => setUnitPrice(digitsOnly(value))}
                      placeholder="0"
                      value={unitPrice}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <ProductFormInput
                      keyboardType="number-pad"
                      label="INITIAL STOCK"
                      onChangeText={(value) => setInitialStock(digitsOnly(value))}
                      placeholder="0"
                      value={initialStock}
                    />
                  </View>
                </View>

                <ProductFormInput
                  label="WEIGHT / VOLUME"
                  onChangeText={setWeightVolume}
                  placeholder="e.g. 500g, 1kg, 2L"
                  value={weightVolume}
                />

                <Pressable style={styles.imageDropzone}>
                  <Camera color="#7A7E8C" size={42} strokeWidth={1.9} />
                  <Text style={styles.imageDropzoneText}>Tap to add product image</Text>
                </Pressable>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Add Product</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#D7DAE3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    borderRadius: 24,
    height: 56,
    marginRight: 12,
    width: 56,
  },
  headerTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  headerSubtitle: {
    color: '#383D4A',
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
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
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  overviewLabel: {
    color: colors.secondary,
    fontFamily: fonts.medium,
    fontSize: 20,
    marginBottom: 10,
  },
  overviewText: {
    color: '#2E3341',
    fontFamily: fonts.regular,
    fontSize: 21,
    lineHeight: 32,
    marginBottom: 28,
    maxWidth: 470,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 20,
  },
  searchInput: {
    color: '#2E3341',
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 20,
    marginLeft: 10,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CED3E3',
    borderRadius: 18,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 68,
  },
  chipsRow: {
    gap: 12,
    paddingVertical: 24,
  },
  sectionHeading: {
    marginBottom: 18,
  },
  productsList: {
    gap: 14,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 36,
    bottom: 104,
    height: 72,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    shadowColor: '#0C2546',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: 72,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontFamily: fonts.regular,
    fontSize: 44,
    lineHeight: 46,
    marginTop: -2,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(29, 31, 42, 0.26)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 26,
  },
  modalTitle: {
    color: colors.secondary,
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  modalCloseButton: {
    padding: 2,
  },
  modalScrollContent: {
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 32,
  },
  barcodeSlot: {
    alignItems: 'center',
    backgroundColor: '#F2F3F7',
    borderRadius: 14,
    height: 64,
    justifyContent: 'center',
    width: 88,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 14,
  },
  halfField: {
    flex: 1,
  },
  imageDropzone: {
    alignItems: 'center',
    borderColor: '#C8CDDD',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 190,
    paddingHorizontal: 24,
    paddingVertical: 26,
  },
  imageDropzoneText: {
    color: '#303545',
    fontFamily: fonts.medium,
    fontSize: 18,
    marginTop: 16,
  },
  modalFooter: {
    borderTopColor: '#E5E8F0',
    borderTopWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 18,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 86,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    fontSize: 18,
  },
});
