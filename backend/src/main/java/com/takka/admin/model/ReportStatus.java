package com.takka.admin.model;

import com.takka.admin.support.MessageException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Lifecycle of a user-submitted report, mirroring the {@code reports.status} check constraint. */
public enum ReportStatus {
  OPEN("queued"),
  REVIEWING("queued"),
  RESOLVED("closed"),
  DISMISSED("closed");

  private final String group;

  ReportStatus(String group) {
    this.group = group;
  }

  public String labelKey() {
    return "enum.reportStatus." + name();
  }

  /** Phrasing used when reporting the decision back, as in "marked as resolved". */
  public String decidedKey() {
    return "enum.reportStatus.decided." + name();
  }

  /** True once the report no longer needs attention. */
  public boolean isClosed() {
    return "closed".equals(group);
  }

  /** Statuses that count towards the "open reports" metric on the overview page. */
  public static List<ReportStatus> awaitingAttention() {
    return List.of(OPEN, REVIEWING);
  }

  /** Decisions an administrator can apply from the report queue. */
  public static List<ReportStatus> decisions() {
    return List.of(RESOLVED, DISMISSED, REVIEWING);
  }

  public static Optional<ReportStatus> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }

  public static ReportStatus require(String value) {
    return parse(value).orElseThrow(() -> new MessageException("error.report.unknownStatus", value));
  }
}
