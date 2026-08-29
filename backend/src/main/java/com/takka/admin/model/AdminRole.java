package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** Administrator privilege level, mirroring the {@code admin_users.role} check constraint. */
public enum AdminRole {
  SUPER_ADMIN,
  MODERATOR;

  public String labelKey() {
    return "enum.role." + name();
  }

  public boolean isSuperAdmin() {
    return this == SUPER_ADMIN;
  }

  /** Spring Security authority granted to a session holding this role. */
  public String authority() {
    return "ROLE_" + name();
  }

  public static Optional<AdminRole> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }
}
