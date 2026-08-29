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
    assertEquals("29 Aug 2026 12:00 UTC", Timestamps.format(NOW));
  }

  @Test
  void missingTimestampsRenderAsADash() {
    assertEquals("—", Timestamps.format(Optional.empty()));
    assertEquals("—", Timestamps.format((Instant) null));
    assertEquals("—", Timestamps.age(Optional.empty()));
  }

  @Test
  void agePrefersTheLargestWholeUnit() {
    assertEquals("3d", Timestamps.age(NOW.minus(Duration.ofDays(3)), NOW));
    assertEquals("5h", Timestamps.age(NOW.minus(Duration.ofHours(5)), NOW));
    assertEquals("20m", Timestamps.age(NOW.minus(Duration.ofMinutes(20)), NOW));
  }

  @Test
  void veryRecentAndFutureTimestampsReadAsNow() {
    assertEquals("now", Timestamps.age(NOW.minus(Duration.ofSeconds(20)), NOW));
    assertEquals("now", Timestamps.age(NOW.plus(Duration.ofHours(2)), NOW));
  }
}
