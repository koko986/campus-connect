package com.takka.admin.mapper;

import com.takka.admin.model.ReportStatus;
import com.takka.admin.model.ReportTargetType;
import com.takka.admin.model.ReportView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import tools.jackson.databind.JsonNode;

/** Maps {@code reports} rows onto the console view model. */
public final class ReportMapper {
  private ReportMapper() {}

  public static ReportView toView(JsonNode row) {
    var created = Json.optionalInstant(row, "created_at");
    return new ReportView(
        Json.uuid(row, "id"),
        ReportTargetType.parse(Json.text(row, "target_type")).orElse(ReportTargetType.ACCOUNT),
        Json.optionalUuid(row, "target_id").orElse(null),
        Json.text(row, "reason"),
        Json.text(row, "details"),
        ReportStatus.parse(Json.text(row, "status")).orElse(ReportStatus.OPEN),
        SnapshotLabel.of(row.path("target_snapshot")),
        Json.text(row, "resolution_notes"),
        Timestamps.format(created),
        Timestamps.age(created),
        Json.optionalUuid(row, "assigned_to").isPresent());
  }
}
