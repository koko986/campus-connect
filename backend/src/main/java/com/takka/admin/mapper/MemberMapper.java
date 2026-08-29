package com.takka.admin.mapper;

import com.takka.admin.model.AccountStatus;
import com.takka.admin.model.MemberView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import java.util.Set;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** Maps {@code profiles} rows, with their moderation and student embeds, onto the accounts table. */
public final class MemberMapper {
  private MemberMapper() {}

  public static MemberView toView(JsonNode row, Set<UUID> administratorIds) {
    UUID id = Json.uuid(row, "id");
    JsonNode student = Json.embeddedRow(row, "student_profiles");
    JsonNode moderation = Json.embeddedRow(row, "account_moderation");
    JsonNode university = Json.embeddedRow(student, "universities");

    return new MemberView(
        id,
        Json.text(row, "full_name"),
        Json.text(row, "email"),
        accountTypeLabel(Json.text(row, "account_type")),
        Json.text(university, "name"),
        verificationLabel(Json.text(student, "verification_status")),
        AccountStatus.parse(Json.text(moderation, "status")).orElse(AccountStatus.ACTIVE),
        Json.text(moderation, "reason"),
        Timestamps.format(Json.optionalInstant(row, "created_at")),
        Timestamps.format(Json.optionalInstant(moderation, "blocked_at")),
        administratorIds.contains(id));
  }

  private static String accountTypeLabel(String value) {
    return switch (value) {
      case "current_student" -> "Current student";
      case "prospective_student" -> "Prospective student";
      case "" -> "Unknown";
      default -> value.replace('_', ' ');
    };
  }

  private static String verificationLabel(String value) {
    return switch (value) {
      case "verified" -> "Verified";
      case "pending" -> "Pending";
      case "rejected" -> "Rejected";
      case "" -> "";
      default -> value;
    };
  }
}
