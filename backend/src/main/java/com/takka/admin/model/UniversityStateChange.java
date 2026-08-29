package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** Directory visibility transitions available on a university record. */
public enum UniversityStateChange {
  PUBLISH("Publish", ModerationAction.PUBLISH_UNIVERSITY),
  UNPUBLISH("Unpublish", ModerationAction.UNPUBLISH_UNIVERSITY),
  ARCHIVE("Archive", ModerationAction.ARCHIVE_UNIVERSITY);

  private final String label;
  private final ModerationAction auditAction;

  UniversityStateChange(String label, ModerationAction auditAction) {
    this.label = label;
    this.auditAction = auditAction;
  }

  public String label() {
    return label;
  }

  public ModerationAction auditAction() {
    return auditAction;
  }

  public String slug() {
    return name().toLowerCase(Locale.ROOT);
  }

  public static Optional<UniversityStateChange> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }

  public static UniversityStateChange require(String value) {
    return parse(value).orElseThrow(() -> new IllegalArgumentException("Unknown university operation: " + value));
  }
}
