import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { radius, spacing } from '../../constants/design-system';
import { colors, fonts, textRoles, textSizes } from '../../constants/theme';

type PaginationControlsProps = {
  currentPage: number;
  endItem?: number;
  onPageChange: (page: number) => void;
  startItem?: number;
  totalItems?: number;
  totalPages: number;
  visiblePageNumbers?: number[];
  borderless?: boolean;
};

export function PaginationControls({
  currentPage,
  endItem = 0,
  onPageChange,
  startItem = 0,
  totalItems = 0,
  totalPages,
  visiblePageNumbers = [],
  borderless = false,
}: PaginationControlsProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  if (borderless) {
    return (
      <View style={styles.borderlessContainer}>
        <Text style={styles.summaryTextBorderless}>
          {`Page ${currentPage + 1} of ${totalPages || 1}`}
        </Text>
        <View style={styles.borderlessButtonsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={currentPage === 0}
            onPress={() => onPageChange(Math.max(currentPage - 1, 0))}
            style={[
              styles.borderlessTextButton,
              currentPage === 0 && styles.borderlessTextButtonDisabled,
            ]}>
            <Text
              style={[
                styles.borderlessTextButtonLabel,
                currentPage === 0 && styles.borderlessTextButtonLabelDisabled,
              ]}>
              Previous
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={currentPage >= totalPages - 1}
            onPress={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
            style={[
              styles.borderlessTextButton,
              currentPage >= totalPages - 1 && styles.borderlessTextButtonDisabled,
            ]}>
            <Text
              style={[
                styles.borderlessTextButtonLabel,
                currentPage >= totalPages - 1 && styles.borderlessTextButtonLabelDisabled,
              ]}>
              Next
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, isCompactPhone ? styles.cardCompact : undefined]}>
      <Text style={[styles.summaryText, isCompactPhone ? styles.summaryTextCompact : undefined]}>
        {`${startItem}-${endItem} of ${totalItems}`}
      </Text>
      <View style={[styles.controls, isCompactPhone ? styles.controlsCompact : undefined]}>
        <Pressable
          accessibilityRole="button"
          disabled={currentPage === 0}
          onPress={() => onPageChange(Math.max(currentPage - 1, 0))}
          style={[
            styles.textButton,
            isCompactPhone ? styles.textButtonCompact : undefined,
            currentPage === 0 && styles.textButtonDisabled,
          ]}>
          <Text
            style={[
              styles.textButtonLabel,
              isCompactPhone ? styles.textButtonLabelCompact : undefined,
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
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 430;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.pageButton,
        isCompactPhone ? styles.pageButtonCompact : undefined,
        active && styles.pageButtonActive,
      ]}>
      <Text
        style={[
          styles.pageButtonLabel,
          isCompactPhone ? styles.pageButtonLabelCompact : undefined,
          active && styles.pageButtonLabelActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderInput,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardCompact: {
    paddingHorizontal: spacing.md,
  },
  summaryText: {
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: textSizes.body,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  summaryTextCompact: {
    fontSize: textSizes.small + 1,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  controlsCompact: {
    gap: spacing.xs,
  },
  textButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceOverlayMuted,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: spacing.md,
  },
  textButtonCompact: {
    minWidth: 78,
    paddingHorizontal: spacing.sm,
  },
  textButtonDisabled: {
    backgroundColor: colors.surfaceDisabled,
  },
  textButtonLabel: {
    color: colors.secondary,
    ...textRoles.label,
    fontSize: textSizes.body,
  },
  textButtonLabelCompact: {
    fontSize: textSizes.small + 1,
  },
  textButtonLabelDisabled: {
    color: colors.textSubtle,
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
    borderColor: colors.borderInput,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    minWidth: 42,
    paddingHorizontal: spacing.sm,
  },
  pageButtonCompact: {
    height: 38,
    minWidth: 38,
    paddingHorizontal: spacing.xs + 2,
  },
  pageButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  pageButtonLabel: {
    color: colors.textHeading,
    ...textRoles.label,
    fontSize: textSizes.body,
  },
  pageButtonLabelCompact: {
    fontSize: textSizes.small + 1,
  },
  pageButtonLabelActive: {
    color: colors.textInverse,
  },
  ellipsis: {
    color: colors.textSubtle,
    fontFamily: fonts.regular,
    fontSize: textSizes.medium,
  },
  cardBorderless: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginTop: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  borderlessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryTextBorderless: {
    color: '#344054',
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  borderlessButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  borderlessTextButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D0D5DD',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  borderlessTextButtonDisabled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F2F4F7',
    opacity: 0.6,
  },
  borderlessTextButtonLabel: {
    color: '#344054',
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  borderlessTextButtonLabelDisabled: {
    color: '#D0D5DD',
  },
});
