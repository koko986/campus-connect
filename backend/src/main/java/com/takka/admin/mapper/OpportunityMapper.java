package com.takka.admin.mapper;

import com.takka.admin.model.OpportunityView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import tools.jackson.databind.JsonNode;

/** Maps an opportunity with its submitting member and optional university. */
public final class OpportunityMapper {
  private OpportunityMapper() {}

  public static OpportunityView toView(JsonNode row) {
    var created = Json.optionalInstant(row, "created_at");
    var deadline = Json.optionalInstant(row, "deadline_at");
    var university = Json.embeddedRow(row, "university");
    var submitter = Json.embeddedRow(row, "submitter");
    return new OpportunityView(
        Json.uuid(row, "id"),
        Json.text(row, "title"),
        Json.text(row, "organization"),
        Json.text(row, "opportunity_type"),
        Json.text(row, "description"),
        Json.text(row, "eligibility"),
        Json.text(row, "location"),
        Json.text(row, "external_url"),
        Json.text(university, "name"),
        Json.text(submitter, "full_name", "Deleted member"),
        Json.text(row, "status", "pending"),
        Timestamps.format(deadline),
        Timestamps.format(created),
        Json.text(row, "review_note"),
        Timestamps.age(created));
  }
}
