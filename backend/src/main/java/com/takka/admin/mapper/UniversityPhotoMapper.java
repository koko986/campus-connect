package com.takka.admin.mapper;

import com.takka.admin.model.UniversityPhotoView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import tools.jackson.databind.JsonNode;

/** Maps a university photo row and its embedded university/uploader relations. */
public final class UniversityPhotoMapper {
  private UniversityPhotoMapper() {}

  public static UniversityPhotoView toView(JsonNode row, String imageUrl) {
    var created = Json.optionalInstant(row, "created_at");
    JsonNode university = Json.embeddedRow(row, "university");
    JsonNode uploader = Json.embeddedRow(row, "uploader");
    return new UniversityPhotoView(
        Json.uuid(row, "id"),
        Json.uuid(row, "university_id"),
        Json.text(university, "name"),
        Json.text(uploader, "full_name", "Deleted member"),
        imageUrl,
        Json.text(row, "caption"),
        Json.text(row, "status", "PENDING"),
        Timestamps.format(created),
        Timestamps.age(created));
  }
}
