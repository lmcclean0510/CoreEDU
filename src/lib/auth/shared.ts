import type { UserProfile } from '@/lib/types';

export type NormalizedUser = {
  uid: string;
  email: string | null;
  role: UserProfile['role'];
  isAdmin: boolean;
};

export function isAdmin(user: Pick<NormalizedUser, 'isAdmin'> | null | undefined): boolean {
  return !!user?.isAdmin;
}

export function hasRole(
  user: Pick<NormalizedUser, 'role'> | null | undefined,
  role: Exclude<UserProfile['role'], null>
): boolean {
  return !!user && user.role === role;
}

export function isTeacher(user: Pick<NormalizedUser, 'role'> | null | undefined): boolean {
  return hasRole(user, 'teacher');
}

export function isStudent(user: Pick<NormalizedUser, 'role'> | null | undefined): boolean {
  return hasRole(user, 'student');
}
