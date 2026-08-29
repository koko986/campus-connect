package com.takka.admin.support;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Timestamp formatting for the console. Absolute times use an all-numeric pattern in UTC, which
 * reads the same in every language the console is published in, so no month name has to be
 * translated and no view has to guess a locale. Relative ages are returned as data and worded by
 * the template.
 */
public final class Timestamps {
  private static final DateTimeFormatter ABSOLUTE =
      DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneOffset.UTC);
  public static final String UNKNOWN = "—";

  private Timestamps() {}

  public static String format(Optional<Instant> instant) {
    return instant.map(Timestamps::format).orElse(UNKNOWN);
  }

  public static String format(Instant instant) {
    return instant == null ? UNKNOWN : ABSOLUTE.format(instant) + " UTC";
  }

  /** Coarse age used in the report queue to surface stale items. */
  public static Age age(Optional<Instant> instant) {
    return instant.map(value -> age(value, Instant.now())).orElse(Age.UNKNOWN);
  }

  public static Age age(Instant from, Instant now) {
    if (from == null || now == null) return Age.UNKNOWN;
    Duration elapsed = Duration.between(from, now);
    if (elapsed.isNegative()) return Age.NOW;
    long days = elapsed.toDays();
    if (days > 0) return Age.ofDays(days);
    long hours = elapsed.toHours();
    if (hours > 0) return Age.ofHours(hours);
    long minutes = elapsed.toMinutes();
    return minutes > 0 ? Age.ofMinutes(minutes) : Age.NOW;
  }
}
