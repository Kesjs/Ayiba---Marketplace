export type UserRole = 'client' | 'vendeur' | 'livreur' | 'admin';

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  client: '/catalogue',
  vendeur: '/vendeur/dashboard',
  livreur: '/livreur/missions',
  admin: '/admin/dashboard',
};

export function getRedirectPathForRole(role: UserRole | null): string {
  if (!role) return '/';
  return ROLE_REDIRECTS[role] || '/';
}

export function isValidRole(role: string): role is UserRole {
  return ['client', 'vendeur', 'livreur', 'admin'].includes(role);
}
