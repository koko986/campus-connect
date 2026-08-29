package com.takka.admin;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AdminRole;
import java.util.UUID;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Shared builders for the admin tests: parsed Supabase payloads and administrator identities. */
public final class Fixtures {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private Fixtures() {}

  /** Parses a Supabase-shaped payload, failing the test outright if the literal is malformed. */
  public static JsonNode json(String raw) {
    try {
      return MAPPER.readTree(raw);
    } catch (Exception malformed) {
      throw new IllegalStateException("Malformed test fixture: " + raw, malformed);
    }
  }

  public static JsonNode emptyRows() {
    return json("[]");
  }

  public static AdminIdentity superAdmin() {
    return new AdminIdentity(UUID.randomUUID(), "super@takka.test", AdminRole.SUPER_ADMIN);
  }

  public static AdminIdentity moderator() {
    return new AdminIdentity(UUID.randomUUID(), "mod@takka.test", AdminRole.MODERATOR);
  }
}
