package com.takka.admin.model;

import com.takka.admin.support.Age;
import java.util.UUID;

/** A verified-student campus photo awaiting an administrator's decision. */
public record UniversityPhotoView(
    UUID id,
    UUID universityId,
    String universityName,
    String uploaderName,
    String imageUrl,
    String caption,
    String status,
    String submitted,
    Age age) {

  public boolean hasCaption() {
    return caption != null && !caption.isBlank();
  }

  public boolean isPending() {
    return "PENDING".equals(status);
  }

  public String statusTone() {
    return switch (status) {
      case "APPROVED" -> "success";
      case "REJECTED" -> "danger";
      default -> "warning";
    };
  }
}
