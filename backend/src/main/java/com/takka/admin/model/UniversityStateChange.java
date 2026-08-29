package com.takka.admin.model;

import com.takka.admin.support.MessageException;
import java.util.Locale;
import java.util.Optional;

/** Directory visibility transitions available on a university record. */
public enum UniversityStateChange {
  PUBLISH(ModerationAction.PUBLISH_UNIVERSITY),
  UNPUBLISH(ModerationAction.UNPUBLISH_UNIVERSITY),
  ARCHIVE(ModerationAction.ARCHIVE_UNIVERSITY);

  private final ModerationAction auditAction;

  UniversityStateChange(ModerationAction auditAction) {
    this.auditAction = auditAction;
  }

  /** The button that starts the change. */
  public String labelKey() {
    return "enum.universityState." + name();
  }

  /** The state the university ends up in, used when confirming the change afterwards. */
  public String appliedKey() {
    return "enum.universityState.applied." + name();
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
    return parse(value).orElseThrow(() -> new MessageException("error.university.unknownOperation", value));
  }
}
