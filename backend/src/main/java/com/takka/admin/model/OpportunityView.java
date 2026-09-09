package com.takka.admin.model;

import com.takka.admin.support.Age;
import java.util.UUID;

/** A student-submitted opportunity prepared for the administrator review queue. */
public record OpportunityView(
    UUID id,
    String title,
    String organization,
    String type,
    String description,
    String eligibility,
    String location,
    String externalUrl,
    String universityName,
    String submitterName,
    String status,
    String deadline,
    String submitted,
    String reviewNote,
    Age age) {

  public boolean isPending() {
    return "pending".equals(status);
  }

  public boolean hasLink() {
    return externalUrl != null && !externalUrl.isBlank();
  }

  public boolean hasReviewNote() {
    return reviewNote != null && !reviewNote.isBlank();
  }

  public String statusTone() {
    return switch (status) {
      case "published" -> "success";
      case "rejected", "closed" -> "danger";
      case "archived" -> "muted";
      default -> "warning";
    };
  }
}
