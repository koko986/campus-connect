package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** Moderation state of a member account, mirroring {@code account_moderation.status}. */
public enum AccountStatus {
  ACTIVE,
  BLOCKED;

  public String labelKey() {
    return "enum.accountStatus." + name();
  }

  public boolean isBlocked() {
    return this == BLOCKED;
  }

  public static Optional<AccountStatus> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }
}
