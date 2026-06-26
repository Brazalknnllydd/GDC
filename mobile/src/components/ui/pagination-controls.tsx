import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles } from '../../constants/theme';

type PaginationControlsProps = {
  currentPage: number;
  endItem: number;
  onPageChange: (page: number) => void;
  startItem: number;
  totalItems: number;
  totalPages: number;
  visiblePageNumbers: number[];
};

export function PaginationControls({
  currentPage,
  endItem,
  onPageChange,
  startItem,
  totalItems,
  totalPages,
  visiblePageNumbers,
}: PaginationControlsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.summaryText}>{`${startItem}-${endItem} of ${totalItems}`}</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          disabled={currentPage === 0}
          onPress={() => onPageChange(Math.max(currentPage - 1, 0))}
          style={[styles.textButton, currentPage === 0 && styles.textButtonDisabled]}>
          <Text
            style={[
              styles.textButtonLabel,
              currentPage === 0 && styles.textButtonLabelDisabled,
            ]}>
            Previous
          </Text>
        </Pressable>

        <View style={styles.pageNumbersRow}>
          {visiblePageNumbers[0] > 0 ? (
            <>
              <PageButton
                active={currentPage === 0}
                label="1"
                onPress={() => onPageChange(0)}
              />
              {visiblePageNumbers[0] > 1 ? <Text style={styles.ellipsis}>...</Text> : null}
            </>
          ) : null}

          {visiblePageNumbers.map((pageNumber) => (
            <PageButton
              active={currentPage === pageNumber}
              key={pageNumber}
              label={String(pageNumber + 1)}
              onPress={() => onPageChange(pageNumber)}
            />
          ))}

          {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 1 ? (
            <>
              {visiblePageNumbers[visiblePageNumbers.length - 1] < totalPages - 2 ? (
                <Text style={styles.ellipsis}>...</Text>
              ) : null}
              <PageButton
                active={currentPage === totalPages - 1}
                label={String(totalPages)}
                onPress={() => onPageChange(totalPages - 1)}
              />
            </>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={currentPage >= totalPages - 1}
          onPress={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
          style={[
            styles.textButton,
            currentPage >= totalPages - 1 && styles.textButtonDisabled,
          ]}>
          <Text
            style={[
              styles.textButtonLabel,
              currentPage >= totalPages - 1 && styles.textButtonLabelDisabled,
            ]}>
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type PageButtonProps = {
  active?: boolean;
  label: string;
  onPress: () => void;
};

function PageButton({ active = false, label, onPress }: PageButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.pageButton, active && styles.pageButtonActive]}>
      <Text style={[styles.pageButtonLabel, active && styles.pageButtonLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DCEC',
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  summaryText: {
    color: '#6B7280',
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  textButton: {
    alignItems: 'center',
    backgroundColor: '#EEF1F8',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: spacing.md,
  },
  textButtonDisabled: {
    backgroundColor: '#F5F6FA',
  },
  textButtonLabel: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: 14,
  },
  textButtonLabelDisabled: {
    color: '#98A0B3',
  },
  pageNumbersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  pageButton: {
    alignItems: 'center',
    borderColor: '#D7DCEC',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 42,
    paddingHorizontal: spacing.sm,
  },
  pageButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  pageButtonLabel: {
    color: '#354052',
    ...textRoles.label,
    fontSize: 14,
  },
  pageButtonLabelActive: {
    color: '#FFFFFF',
  },
  ellipsis: {
    color: '#7C8497',
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});
