import { useRouter } from 'expo-router';

import type { BottomNavItem } from '../../lib/app-routes';
import { AppBottomNav } from './app-bottom-nav';

type AdminBottomNavProps = {
  items: BottomNavItem[];
};

export function AdminBottomNav({ items }: AdminBottomNavProps) {
  const router = useRouter();

  return (
    <AppBottomNav
      activeKey={items.find((item) => item.active)?.label ?? items[0]?.label ?? ''}
      activeMarker="top-line"
      items={items.map((item) => ({
        icon: item.icon,
        key: item.label,
        label: item.label,
      }))}
      onSelect={(key) => {
        const selectedItem = items.find((item) => item.label === key);

        if (selectedItem?.route) {
          router.replace(selectedItem.route);
        }
      }}
    />
  );
}
