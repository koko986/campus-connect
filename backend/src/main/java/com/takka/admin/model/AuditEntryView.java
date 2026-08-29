package com.takka.admin.model;

import java.util.UUID;

/** An immutable entry from the moderation audit trail. */
public record AuditEntryView(
    UUID id,
    String adminEmail,
    ModerationAction action,
    String rawAction,
    String targetType,
    UUID targetId,
    String targetLabel,
    String reason,
    boolean linkedToReport,
    String recorded) {

  public boolean hasTargetLabel() {
    return targetLabel != null && !targetLabel.isBlank();
  }

  /**
   * The audit trail is immutable and older than the current action list, so an entry may name an
   * action this build no longer knows. Those keep their stored value; the rest are translated.
   */
  public boolean isTranslatable() {
    return action != null;
  }

  public String actionKey() {
    return action == null ? "" : action.labelKey();
  }

  public String actionTone() {
    if (action == null) return "muted";
    return switch (action) {
      case BLOCK_USER, DELETE_USER, REMOVE_POST, ARCHIVE_UNIVERSITY -> "danger";
      case UNBLOCK_USER,
          RESTORE_POST,
          RESOLVE_REPORT,
          PUBLISH_UNIVERSITY,
          APPROVE_UNIVERSITY_PHOTO -> "success";
      case DISMISS_REPORT, UNPUBLISH_UNIVERSITY, REJECT_UNIVERSITY_PHOTO -> "warning";
      case CREATE_UNIVERSITY, UPDATE_UNIVERSITY -> "info";
    };
  }
}
