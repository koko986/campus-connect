package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/**
 * Auditable administrator actions. The names match the {@code moderation_actions.action} check
 * constraint exactly, so an unknown value fails here rather than as a Postgres constraint error.
 */
public enum ModerationAction {
  BLOCK_USER("ACCOUNT"),
  UNBLOCK_USER("ACCOUNT"),
  DELETE_USER("ACCOUNT"),
  REMOVE_POST("POST"),
  RESTORE_POST("POST"),
  RESOLVE_REPORT("REPORT"),
  DISMISS_REPORT("REPORT"),
  CREATE_UNIVERSITY("UNIVERSITY"),
  UPDATE_UNIVERSITY("UNIVERSITY"),
  PUBLISH_UNIVERSITY("UNIVERSITY"),
  UNPUBLISH_UNIVERSITY("UNIVERSITY"),
  ARCHIVE_UNIVERSITY("UNIVERSITY");

  private final String targetType;

  ModerationAction(String targetType) {
    this.targetType = targetType;
  }

  public String labelKey() {
    return "enum.moderationAction." + name();
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
