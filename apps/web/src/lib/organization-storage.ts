export const ORGANIZATION_STORAGE_KEY = 'surveyos_selected_organization_id';

export function getSelectedOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ORGANIZATION_STORAGE_KEY);
}

export function setSelectedOrganizationId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORGANIZATION_STORAGE_KEY, id);
}

export function clearSelectedOrganizationId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
}
