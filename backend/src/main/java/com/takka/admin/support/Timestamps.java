package com.takka.admin.support;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Timestamp formatting for the console. Templates receive ready-made strings so no date dialect or
 * locale guessing is needed in the view layer.
 */
public final class Timestamps {
  private static final DateTimeFormatter ABSOLUTE =
      DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm").withZone(ZoneOffset.UTC);

  private Timestamps() {}

  public static String format(Optional<Instant> instant) {
    return instant.map(Timestamps::format).orElse("—");
  }

  public static String format(Instant instant) {
    return instant == null ? "—" : ABSOLUTE.format(instant) + " UTC";
  }

  /** Compact age label such as "3d" or "12h", used in the report queue to surface stale items. */
  public static String age(Optional<Instant> instant) {
    return instant.map(value -> age(value, Instant.now())).orElse("—");
  }

  public static String age(Instant from, Instant now) {
    if (from == null || now == null) return "—";
    Duration elapsed = Duration.between(from, now);
    if (elapsed.isNegative()) return "now";
    long days = elapsed.toDays();
    if (days > 0) return days + "d";
    long hours = elapsed.toHours();
    if (hours > 0) return hours + "h";
    long minutes = elapsed.toMinutes();
    return minutes > 0 ? minutes + "m" : "now";
  }
}
