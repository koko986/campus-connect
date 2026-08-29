package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** Moderation state of a community post, mirroring {@code posts.moderation_status}. */
public enum PostModerationStatus {
  PUBLISHED,
  REMOVED,
  ARCHIVED;

  public String labelKey() {
    return "enum.postStatus." + name();
  }

  public boolean isVisible() {
    return this == PUBLISHED;
  }

  public static Optional<PostModerationStatus> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }
}
