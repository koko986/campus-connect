package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A decision applied to a queued report. */
public class ReportDecisionForm {
  @NotBlank(message = "Choose a decision")
  private String status = "";

  @NotBlank(message = "Explain the decision")
  @Size(min = 3, max = 2000, message = "Notes must be between 3 and 2000 characters")
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
