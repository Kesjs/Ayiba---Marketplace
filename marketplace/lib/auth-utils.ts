export type UserRole = 'client' | 'vendeur' | 'livreur' | 'admin';

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  client: '/catalogue',
  vendeur: '/vendeur/dashboard',
  livreur: '/livreur/missions',
  admin: '/admin/dashboard',
};

export function getRedirectPathForRole(role: UserRole | null): string {
  if (!role) return '/auth/choix-role';
  return ROLE_REDIRECTS[role] || '/auth/choix-role';
}

export function isValidRole(role: string): role is UserRole {
  return ['client', 'vendeur', 'livreur', 'admin'].includes(role);
}
