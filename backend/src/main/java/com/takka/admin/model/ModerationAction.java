package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/**
 * Auditable administrator actions. The names match the {@code moderation_actions.action} check
 * constraint exactly, so an unknown value fails here rather than as a Postgres constraint error.
 */
public enum ModerationAction {
  BLOCK_USER("Blocked account", "ACCOUNT"),
  UNBLOCK_USER("Unblocked account", "ACCOUNT"),
  DELETE_USER("Deleted account", "ACCOUNT"),
  REMOVE_POST("Removed post", "POST"),
  RESTORE_POST("Restored post", "POST"),
  RESOLVE_REPORT("Resolved report", "REPORT"),
  DISMISS_REPORT("Dismissed report", "REPORT"),
  CREATE_UNIVERSITY("Created university", "UNIVERSITY"),
  UPDATE_UNIVERSITY("Updated university", "UNIVERSITY"),
  PUBLISH_UNIVERSITY("Published university", "UNIVERSITY"),
  UNPUBLISH_UNIVERSITY("Unpublished university", "UNIVERSITY"),
  ARCHIVE_UNIVERSITY("Archived university", "UNIVERSITY");

  private final String label;
  private final String targetType;

  ModerationAction(String label, String targetType) {
    this.label = label;
    this.targetType = targetType;
  }

  public String label() {
    return label;
  }

  public String targetType() {
    return targetType;
  }

  public static Optional<ModerationAction> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }
}
