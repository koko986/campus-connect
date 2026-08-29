package com.takka.admin.support;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class TimestampsTest {
  private static final Instant NOW = Instant.parse("2026-08-29T12:00:00Z");

  @Test
  void formatsInUtcWithAnExplicitZoneLabel() {
    assertEquals("2026-08-29 12:00 UTC", Timestamps.format(NOW));
  }

  @Test
  void missingTimestampsRenderAsADash() {
    assertEquals("—", Timestamps.format(Optional.empty()));
    assertEquals("—", Timestamps.format((Instant) null));
    assertEquals(Age.UNKNOWN, Timestamps.age(Optional.empty()));
  }

  @Test
  void agePrefersTheLargestWholeUnit() {
    assertEquals(Age.ofDays(3), Timestamps.age(NOW.minus(Duration.ofDays(3)), NOW));
    assertEquals(Age.ofHours(5), Timestamps.age(NOW.minus(Duration.ofHours(5)), NOW));
    assertEquals(Age.ofMinutes(20), Timestamps.age(NOW.minus(Duration.ofMinutes(20)), NOW));
  }

  @Test
  void veryRecentAndFutureTimestampsReadAsNow() {
    assertEquals(Age.NOW, Timestamps.age(NOW.minus(Duration.ofSeconds(20)), NOW));
    assertEquals(Age.NOW, Timestamps.age(NOW.plus(Duration.ofHours(2)), NOW));
  }

  @Test
  void anAgeNamesTheMessageKeyThatWordsIt() {
    assertEquals("time.age.days", Age.ofDays(3).messageKey());
    assertEquals("time.age.now", Age.NOW.messageKey());
    assertEquals("time.age.unknown", Age.UNKNOWN.messageKey());
  }
}
