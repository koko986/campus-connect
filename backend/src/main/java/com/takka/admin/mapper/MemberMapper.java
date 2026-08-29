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
        accountTypeKey(Json.text(row, "account_type")),
        Json.text(university, "name"),
        verificationKey(Json.text(student, "verification_status")),
        AccountStatus.parse(Json.text(moderation, "status")).orElse(AccountStatus.ACTIVE),
        Json.text(moderation, "reason"),
        Timestamps.format(Json.optionalInstant(row, "created_at")),
        Timestamps.format(Json.optionalInstant(moderation, "blocked_at")),
        administratorIds.contains(id));
  }

  /**
   * A message key rather than a label, so the accounts table reads in the administrator's language.
   * Values the check constraint does not allow still resolve, to a key meaning "unknown", because a
   * console row must never render a raw column value.
   */
  private static String accountTypeKey(String value) {
    return switch (value) {
      case "current_student", "prospective_student" -> "enum.accountType." + value;
      default -> "enum.accountType.unknown";
    };
  }

  /** Empty when the member is not a student at all, which the template renders as a blank cell. */
  private static String verificationKey(String value) {
    return switch (value) {
      case "verified", "pending", "rejected" -> "enum.verification." + value;
      default -> "";
    };
  }
}
