package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Optional;
import java.util.UUID;

/**
 * The reason attached to a moderation action. Every audited action requires one, so the constraint
 * lives here instead of being re-checked inside each service.
 */
public class ModerationReasonForm {
  public static final int MIN_LENGTH = 3;
  public static final int MAX_LENGTH = 2000;

  @NotBlank(message = "{validation.reason.required}")
  @Size(min = MIN_LENGTH, max = MAX_LENGTH, message = "{validation.reason.length}")
  private String reason = "";

  /** Optional report this action resolves, so the queue entry closes alongside the action. */
  private UUID reportId;

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason == null ? "" : reason.trim();
  }

  public UUID getReportId() {
    return reportId;
  }

  public void setReportId(UUID reportId) {
    this.reportId = reportId;
  }

  public Optional<UUID> linkedReport() {
    return Optional.ofNullable(reportId);
  }
}
