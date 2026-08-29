package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** Moderation state of a member account, mirroring {@code account_moderation.status}. */
public enum AccountStatus {
  ACTIVE("Active"),
  BLOCKED("Blocked");

  private final String label;

  AccountStatus(String label) {
    this.label = label;
  }

  public String label() {
    return label;
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
