import { CategoryType } from '@prisma/client';

export interface DefaultCategorySeed {
  name: string;
  color: string;
  icon: string;
  type: CategoryType;
  isDefault: boolean;
  sortOrder: number;
}

/**
 * Seeded into every new user's account at registration (see RegisterUseCase / OAuth first-login).
 * "Khác" (both EXPENSE and INCOME) is the fallback bucket a deleted category's transactions
 * are reassigned to, so it must always exist and can never be deleted.
 */
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Ăn uống', color: '#4F46E5', icon: 'restaurant', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 1 },
  { name: 'Shopping', color: '#F59E0B', icon: 'shopping_bag', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 2 },
  { name: 'Đi lại', color: '#22C55E', icon: 'directions_car', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 3 },
  { name: 'Giải trí', color: '#F43F5E', icon: 'sports_esports', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 4 },
  { name: 'Y tế', color: '#0EA5E9', icon: 'medical_services', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 5 },
  { name: 'Gia đình', color: '#8B5CF6', icon: 'home', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 6 },
  { name: 'Du lịch', color: '#F59E0B', icon: 'flight', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 7 },
  { name: 'Thú cưng', color: '#22C55E', icon: 'pets', type: CategoryType.EXPENSE, isDefault: false, sortOrder: 8 },
  { name: 'Khác', color: '#94A3B8', icon: 'category', type: CategoryType.EXPENSE, isDefault: true, sortOrder: 99 },

  { name: 'Lương', color: '#4F46E5', icon: 'payments', type: CategoryType.INCOME, isDefault: false, sortOrder: 1 },
  { name: 'Freelance', color: '#F59E0B', icon: 'laptop_mac', type: CategoryType.INCOME, isDefault: false, sortOrder: 2 },
  { name: 'Bonus', color: '#22C55E', icon: 'redeem', type: CategoryType.INCOME, isDefault: false, sortOrder: 3 },
  { name: 'Khác', color: '#94A3B8', icon: 'more_horiz', type: CategoryType.INCOME, isDefault: true, sortOrder: 99 },
];
