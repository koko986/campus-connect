package com.takka.admin.support;

import java.util.Locale;

/**
 * How long ago something happened, kept as a number and a unit rather than a formatted string. The
 * view layer joins the two, because "3d" and its Burmese equivalent put the number and the unit in
 * different places.
 */
public record Age(Unit unit, long amount) {
  public enum Unit {
    DAYS,
    HOURS,
    MINUTES,
    NOW,
    UNKNOWN
  }

  public static final Age UNKNOWN = new Age(Unit.UNKNOWN, 0);
  public static final Age NOW = new Age(Unit.NOW, 0);

  public static Age ofDays(long days) {
    return new Age(Unit.DAYS, days);
  }

  public static Age ofHours(long hours) {
    return new Age(Unit.HOURS, hours);
  }

  public static Age ofMinutes(long minutes) {
    return new Age(Unit.MINUTES, minutes);
  }

  public String messageKey() {
    return "time.age." + unit.name().toLowerCase(Locale.ROOT);
  }
}
