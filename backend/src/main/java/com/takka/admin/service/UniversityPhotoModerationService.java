package com.takka.admin.service;

import com.takka.admin.mapper.UniversityPhotoMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.UniversityPhotoView;
import com.takka.admin.repository.UniversityPhotoRepository;
import com.takka.admin.support.Json;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Queue and decisions for campus photos submitted by verified students. */
@Service
public class UniversityPhotoModerationService {
  public static final List<String> STATUSES = List.of("PENDING", "APPROVED", "REJECTED");

  private final UniversityPhotoRepository photos;

  public UniversityPhotoModerationService(UniversityPhotoRepository photos) {
    this.photos = photos;
  }

  public Page<UniversityPhotoView> queue(String status, PageRequest request) {
    String filter = STATUSES.contains(status) ? status : "PENDING";
    return photos
        .findPage(filter, request)
        .map(row -> UniversityPhotoMapper.toView(row, photos.imageUrl(Json.text(row, "image_path"))));
  }

  public void decide(
      AdminIdentity administrator, UUID photoId, String decision, String reviewNote) {
    AdminAccess.requireAdministrator(administrator);
    if (!STATUSES.contains(decision) || "PENDING".equals(decision)) {
      throw new MessageException("error.photo.invalidDecision");
    }

    JsonNode updated =
        photos
            .decide(photoId, decision, administrator.userId(), reviewNote)
            .orElseThrow(() -> new MessageException("error.photo.notFound"));

    if ("APPROVED".equals(decision)) {
      photos.useAsCoverIfMissing(
          Json.uuid(updated, "university_id"),
          Json.text(updated, "image_path"),
          Json.text(Json.embeddedRow(updated, "uploader"), "full_name", "TAKKA student"));
    }
  }
}
