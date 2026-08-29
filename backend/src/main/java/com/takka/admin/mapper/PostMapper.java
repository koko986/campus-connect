package com.takka.admin.mapper;

import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.model.PostView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import java.util.Map;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** Maps {@code posts} rows onto the moderation table, folding in the per-post report tally. */
public final class PostMapper {
  private PostMapper() {}

  public static PostView toView(JsonNode row, Map<UUID, Integer> reportCounts) {
    UUID id = Json.uuid(row, "id");
    JsonNode author = Json.embeddedRow(row, "profiles");

    return new PostView(
        id,
        PostView.excerptOf(Json.text(row, "body")),
        Json.text(author, "full_name"),
        Json.text(author, "email"),
        PostModerationStatus.parse(Json.text(row, "moderation_status")).orElse(PostModerationStatus.PUBLISHED),
        Json.text(row, "removal_reason"),
        reportCounts.getOrDefault(id, 0),
        Timestamps.format(Json.optionalInstant(row, "created_at")),
        Timestamps.format(Json.optionalInstant(row, "removed_at")));
  }
}
