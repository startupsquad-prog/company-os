/**
 * Standalone permission check utility
 * Can be used in server components with session data
 */
export function can(
  permissions: string[],
  permission: string,
  allowedModules?: string[],
  module?: string
): boolean {
  // Check if user has the permission
  const hasPermission = permissions.includes(permission)

  // If module specified, also check if user has access to that module
  if (module && allowedModules) {
    const hasModuleAccess = allowedModules.includes(module)
    return hasPermission && hasModuleAccess
  }

  return hasPermission
}
