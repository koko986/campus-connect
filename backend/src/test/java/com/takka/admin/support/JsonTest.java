package com.takka.admin.support;

import static com.takka.admin.Fixtures.json;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

class JsonTest {
  @Test
  void readsRowsFromAnArray() {
    assertEquals(2, Json.rows(json("[{\"id\":1},{\"id\":2}]")).size());
  }

  @Test
  void rejectsANonArrayResponse() {
    assertThrows(IllegalStateException.class, () -> Json.rows(json("{\"id\":1}")));
  }

  @Test
  void firstRowIsEmptyForAnEmptyArray() {
    assertTrue(Json.firstRow(json("[]")).isEmpty());
  }

  @Test
  void requiringAMissingRowFails() {
    var error = assertThrows(IllegalArgumentException.class, () -> Json.requireFirstRow(json("[]"), "Nope"));

    assertEquals("Nope", error.getMessage());
  }

  @Test
  void readsTextWithFallbacks() {
    JsonNode row = json("{\"name\":\"Ada\",\"missing\":null}");

    assertEquals("Ada", Json.text(row, "name"));
    assertEquals("", Json.text(row, "absent"));
    assertEquals("fallback", Json.text(row, "missing", "fallback"));
    assertTrue(Json.optionalText(row, "missing").isEmpty());
  }

  @Test
  void readsIdentifiersAndTimestamps() {
    var id = UUID.randomUUID();
    JsonNode row = json("{\"id\":\"" + id + "\",\"created_at\":\"2026-08-29T10:15:30Z\"}");

    assertEquals(id, Json.uuid(row, "id"));
    assertEquals(Instant.parse("2026-08-29T10:15:30Z"), Json.optionalInstant(row, "created_at").orElseThrow());
  }

  @Test
  void malformedIdentifiersAndTimestampsBecomeEmpty() {
    JsonNode row = json("{\"id\":\"not-a-uuid\",\"created_at\":\"yesterday\"}");

    assertTrue(Json.optionalUuid(row, "id").isEmpty());
    assertTrue(Json.optionalInstant(row, "created_at").isEmpty());
  }

  @Test
  void readsNumbersAndBooleans() {
    JsonNode row = json("{\"count\":7,\"ratio\":1.5,\"flag\":true,\"text\":\"nine\"}");

    assertEquals(7, Json.integer(row, "count"));
    assertEquals(1.5, Json.optionalDecimal(row, "ratio").orElseThrow());
    assertTrue(Json.bool(row, "flag"));
    assertFalse(Json.bool(row, "absent"));
    assertTrue(Json.optionalInteger(row, "text").isEmpty());
  }

  @Test
  void readsEmbeddedRelationsWhetherArrayOrObject() {
    assertEquals(
        "Ada", Json.text(Json.embeddedRow(json("{\"profiles\":[{\"full_name\":\"Ada\"}]}"), "profiles"), "full_name"));
    assertEquals(
        "Grace",
        Json.text(Json.embeddedRow(json("{\"profiles\":{\"full_name\":\"Grace\"}}"), "profiles"), "full_name"));
    assertEquals("", Json.text(Json.embeddedRow(json("{\"profiles\":[]}"), "profiles"), "full_name"));
  }

  @Test
  void readsAggregateEmbedCounts() {
    assertEquals(4, Json.embeddedCount(json("{\"campuses\":[{\"count\":4}]}"), "campuses"));
    assertEquals(0, Json.embeddedCount(json("{\"campuses\":[]}"), "campuses"));
  }

  @Test
  void countsMatchingRows() {
    JsonNode rows = json("[{\"status\":\"OPEN\"},{\"status\":\"RESOLVED\"},{\"status\":\"OPEN\"}]");

    assertEquals(2, Json.countMatching(rows, "status", "OPEN"));
  }
}
