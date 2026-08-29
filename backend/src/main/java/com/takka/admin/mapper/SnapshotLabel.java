package com.takka.admin.mapper;

import com.takka.admin.model.PostView;
import com.takka.admin.support.Json;
import tools.jackson.databind.JsonNode;

/**
 * Derives a human label from a {@code target_snapshot} column. Snapshots are taken at report or
 * action time, so they remain readable even after the underlying row is deleted.
 */
public final class SnapshotLabel {
  private SnapshotLabel() {}

  public static String of(JsonNode snapshot) {
    if (snapshot == null || snapshot.isNull() || snapshot.isMissingNode()) return "";
    String name = Json.text(snapshot, "full_name");
    if (!name.isBlank()) return name;
    String universityName = Json.text(snapshot, "name");
    if (!universityName.isBlank()) return universityName;
    String body = Json.text(snapshot, "body");
    if (!body.isBlank()) return PostView.excerptOf(body);
    String email = Json.text(snapshot, "email");
    if (!email.isBlank()) return email;
    return Json.text(snapshot, "reason");
  }
}
