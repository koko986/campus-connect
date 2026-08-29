package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** What a report points at, mirroring the {@code reports.target_type} check constraint. */
public enum ReportTargetType {
  ACCOUNT("Account"),
  POST("Post");

  private final String label;

  ReportTargetType(String label) {
    this.label = label;
  }

  public String label() {
    return label;
  }

  public static Optional<ReportTargetType> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }
}
