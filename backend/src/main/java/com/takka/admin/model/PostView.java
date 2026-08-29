package com.takka.admin.model;

import java.util.UUID;

/** A row in the post moderation table. */
public record PostView(
    UUID id,
    String excerpt,
    String authorName,
    String authorEmail,
    PostModerationStatus status,
    String removalReason,
    int reportCount,
    String created,
    String removed) {

  private static final int EXCERPT_LIMIT = 240;

  /** Truncates long post bodies so one removed post cannot dominate the table. */
  public static String excerptOf(String body) {
    if (body == null) return "";
    String collapsed = body.replaceAll("\\s+", " ").trim();
    return collapsed.length() <= EXCERPT_LIMIT ? collapsed : collapsed.substring(0, EXCERPT_LIMIT) + "…";
  }

  public boolean isPublished() {
    return status.isVisible();
  }

  public boolean isReported() {
    return reportCount > 0;
  }

  public boolean hasRemovalReason() {
    return removalReason != null && !removalReason.isBlank();
  }

  public boolean hasAuthor() {
    return authorName != null && !authorName.isBlank();
  }

  public String statusTone() {
    return switch (status) {
      case PUBLISHED -> "success";
      case REMOVED -> "danger";
      case ARCHIVED -> "muted";
    };
  }
}
