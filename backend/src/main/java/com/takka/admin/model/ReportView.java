package com.takka.admin.model;

import com.takka.admin.support.Age;
import java.util.UUID;

/** A row in the report queue, pre-formatted for the console table. */
public record ReportView(
    UUID id,
    ReportTargetType targetType,
    UUID targetId,
    String reason,
    String details,
    ReportStatus status,
    String targetLabel,
    String resolutionNotes,
    String submitted,
    Age age,
    boolean assigned) {

  public boolean hasDetails() {
    return details != null && !details.isBlank();
  }

  public boolean hasResolutionNotes() {
    return resolutionNotes != null && !resolutionNotes.isBlank();
  }

  public boolean isActionable() {
    return !status.isClosed();
  }

  /** CSS modifier used by the status pill in the templates. */
  public String statusTone() {
    return switch (status) {
      case OPEN -> "danger";
      case REVIEWING -> "warning";
      case RESOLVED -> "success";
      case DISMISSED -> "muted";
    };
  }
}
