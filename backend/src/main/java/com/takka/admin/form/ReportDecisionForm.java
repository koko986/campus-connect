package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A decision applied to a queued report. */
public class ReportDecisionForm {
  @NotBlank(message = "{validation.report.status.required}")
  private String status = "";

  @NotBlank(message = "{validation.report.notes.required}")
  @Size(min = 3, max = 2000, message = "{validation.report.notes.length}")
  private String notes = "";

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status == null ? "" : status.trim();
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes == null ? "" : notes.trim();
  }
}
