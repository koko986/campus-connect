package com.takka.admin.model;

import java.util.Optional;

/** Result of checking whether a signed-in member is an active administrator. */
public record AdminRoleLookup(Optional<AdminRole> role, AdminRoleSource source) {
  public AdminRoleLookup {
    role = role == null ? Optional.empty() : role;
    source = source == null ? AdminRoleSource.NONE : source;
  }

  public static AdminRoleLookup of(Optional<AdminRole> role, AdminRoleSource source) {
    Optional<AdminRole> safeRole = role == null ? Optional.empty() : role;
    return new AdminRoleLookup(safeRole, safeRole.isPresent() ? source : AdminRoleSource.NONE);
  }
}
