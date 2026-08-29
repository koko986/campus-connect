package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Approve or reject one verified-student campus photo. */
public class UniversityPhotoDecisionForm {
  @NotBlank(message = "{validation.photo.decision.required}")
  @Pattern(regexp = "APPROVED|REJECTED", message = "{validation.photo.decision.invalid}")
  private String decision = "";

  @Size(max = 1000, message = "{validation.photo.note.tooLong}")
  private String note = "";

  public String getDecision() {
    return decision;
  }

  public void setDecision(String decision) {
    this.decision = decision == null ? "" : decision.trim().toUpperCase(java.util.Locale.ROOT);
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note == null ? "" : note.trim();
  }
}
