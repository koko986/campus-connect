package com.takka.admin.form;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Approve or reject a pending student opportunity submission. */
public class OpportunityDecisionForm {
  @NotBlank(message = "{validation.opportunity.decision.required}")
  @Pattern(regexp = "published|rejected", message = "{validation.opportunity.decision.invalid}")
  private String decision = "";

  @Size(max = 1000, message = "{validation.opportunity.note.tooLong}")
  private String note = "";

  public String getDecision() {
    return decision;
  }

  public void setDecision(String decision) {
    this.decision = decision == null ? "" : decision;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note == null ? "" : note;
  }
}
