import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { isAdmin, permissions } = useAuth();

  const canView = (page: string) => {
    if (isAdmin) return true;
    return permissions[page]?.can_view === true;
  };

  const canCreate = (page: string) => {
    if (isAdmin) return true;
    return permissions[page]?.can_create === true;
  };

  const canEdit = (page: string) => {
    if (isAdmin) return true;
    return permissions[page]?.can_edit === true;
  };

  const canDelete = (page: string) => {
    if (isAdmin) return true;
    return permissions[page]?.can_delete === true;
  };

  return {
    isAdmin,
    permissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
