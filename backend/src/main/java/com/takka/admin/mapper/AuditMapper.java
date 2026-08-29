package com.takka.admin.mapper;

import com.takka.admin.model.AuditEntryView;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import tools.jackson.databind.JsonNode;

/** Maps {@code moderation_actions} rows onto the audit trail table. */
public final class AuditMapper {
  private AuditMapper() {}

  public static AuditEntryView toView(JsonNode row) {
    String rawAction = Json.text(row, "action");
    ModerationAction action = ModerationAction.parse(rawAction).orElse(null);

    return new AuditEntryView(
        Json.uuid(row, "id"),
        Json.text(row, "admin_email"),
        action,
        action == null ? rawAction : action.label(),
        Json.text(row, "target_type"),
        Json.optionalUuid(row, "target_id").orElse(null),
        SnapshotLabel.of(row.path("target_snapshot")),
        Json.text(row, "reason"),
        Json.optionalUuid(row, "report_id").isPresent(),
        Timestamps.format(Json.optionalInstant(row, "created_at")));
  }
}
