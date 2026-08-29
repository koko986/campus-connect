package com.takka.admin.support;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class QueryTest {
  @Test
  void buildsASelectWithNoFilters() {
    assertEquals("reports?select=*", Query.from("reports").build());
  }

  @Test
  void appliesEqualityFilters() {
    String query = Query.from("posts").select("id,body").eq("moderation_status", "REMOVED").build();

    assertEquals("posts?select=id,body&moderation_status=eq.REMOVED", query);
  }

  @Test
  void rendersNonStringFilterValues() {
    assertEquals(
        "admin_users?select=role&is_active=eq.true",
        Query.from("admin_users").select("role").eq("is_active", true).build());
  }

  @Test
  void combinesSearchColumnsWithOrAndEncodesTheTerm() {
    String query = Query.from("profiles").containsAnyOf("ada lovelace", "full_name", "email").build();

    assertEquals(
        "profiles?select=*&or=(full_name.ilike.*ada%20lovelace*,email.ilike.*ada%20lovelace*)", query);
  }

  @Test
  void ignoresABlankSearchTerm() {
    assertEquals("profiles?select=*", Query.from("profiles").containsAnyOf("  ", "full_name").build());
  }

  @Test
  void rendersInAndNotInLists() {
    var first = UUID.fromString("11111111-1111-1111-1111-111111111111");
    var second = UUID.fromString("22222222-2222-2222-2222-222222222222");

    assertEquals(
        "profiles?select=*&id=in.(" + first + "," + second + ")",
        Query.from("profiles").in("id", List.of(first, second)).build());
    assertEquals(
        "profiles?select=*&id=not.in.(" + first + ")",
        Query.from("profiles").notIn("id", List.of(first)).build());
  }

  @Test
  void ordersAndPagesWithALookaheadRow() {
    String query = Query.from("reports")
        .orderBy("created_at", Query.Direction.DESCENDING)
        .page(PageRequest.of(2, 25))
        .build();

    assertEquals("reports?select=*&order=created_at.desc&limit=26&offset=50", query);
  }

  @Test
  void supportsUpsertOnAUniqueColumn() {
    assertEquals(
        "account_moderation?select=*&on_conflict=user_id",
        Query.from("account_moderation").upsertOn("user_id").build());
  }

  @Test
  void supportsNullChecks() {
    assertEquals(
        "universities?select=*&archived_at=is.null", Query.from("universities").isNull("archived_at").build());
  }

  @Test
  void rejectsAMissingTableName() {
    assertThrows(IllegalArgumentException.class, () -> Query.from(" "));
  }
}
