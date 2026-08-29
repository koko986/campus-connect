package com.takka.admin.support;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;

/** Null-tolerant reads over Supabase responses so mappers stay free of defensive branching. */
public final class Json {
  private Json() {}

  public static ArrayNode requireArray(JsonNode node) {
    if (node == null || !node.isArray()) throw new IllegalStateException("Unexpected Supabase response");
    return (ArrayNode) node;
  }

  public static List<JsonNode> rows(JsonNode node) {
    var array = requireArray(node);
    var rows = new ArrayList<JsonNode>(array.size());
    array.forEach(rows::add);
    return rows;
  }

  public static Optional<JsonNode> firstRow(JsonNode node) {
    var array = requireArray(node);
    return array.isEmpty() ? Optional.empty() : Optional.of(array.get(0));
  }

  /** {@code missingKey} names a message in the console bundle, not the sentence itself. */
  public static JsonNode requireFirstRow(JsonNode node, String missingKey) {
    return firstRow(node).orElseThrow(() -> new MessageException(missingKey));
  }

  public static String text(JsonNode node, String field) {
    return text(node, field, "");
  }

  public static String text(JsonNode node, String field, String fallback) {
    if (node == null) return fallback;
    JsonNode value = node.path(field);
    return value.isNull() || value.isMissingNode() ? fallback : value.asText(fallback);
  }

  public static Optional<String> optionalText(JsonNode node, String field) {
    String value = text(node, field, "");
    return value.isBlank() ? Optional.empty() : Optional.of(value);
  }

  public static UUID uuid(JsonNode node, String field) {
    return optionalUuid(node, field)
        .orElseThrow(() -> new IllegalStateException("Missing identifier '" + field + "' in Supabase response"));
  }

  public static Optional<UUID> optionalUuid(JsonNode node, String field) {
    Optional<String> value = optionalText(node, field);
    if (value.isEmpty()) return Optional.empty();
    try {
      return Optional.of(UUID.fromString(value.get()));
    } catch (IllegalArgumentException malformed) {
      return Optional.empty();
    }
  }

  public static Optional<Instant> optionalInstant(JsonNode node, String field) {
    Optional<String> value = optionalText(node, field);
    if (value.isEmpty()) return Optional.empty();
    try {
      return Optional.of(Instant.parse(value.get()));
    } catch (DateTimeParseException malformed) {
      return Optional.empty();
    }
  }

  public static boolean bool(JsonNode node, String field) {
    return node != null && node.path(field).asBoolean();
  }

  public static int integer(JsonNode node, String field) {
    return optionalInteger(node, field).orElse(0);
  }

  public static Optional<Integer> optionalInteger(JsonNode node, String field) {
    if (node == null) return Optional.empty();
    JsonNode value = node.path(field);
    return value.isNumber() ? Optional.of(value.asInt()) : Optional.empty();
  }

  public static Optional<Double> optionalDecimal(JsonNode node, String field) {
    if (node == null) return Optional.empty();
    JsonNode value = node.path(field);
    return value.isNumber() ? Optional.of(value.asDouble()) : Optional.empty();
  }

  /** Reads the first row of an embedded PostgREST relation, which arrives as an array. */
  public static JsonNode embeddedRow(JsonNode node, String field) {
    if (node == null) return null;
    JsonNode value = node.path(field);
    if (!value.isArray()) return value;
    return value.isEmpty() ? null : value.get(0);
  }

  /** Reads a PostgREST aggregate embed such as {@code campuses(count)}. */
  public static int embeddedCount(JsonNode node, String field) {
    return integer(embeddedRow(node, field), "count");
  }

  public static long countMatching(JsonNode node, String field, String expected) {
    return rows(node).stream().filter(row -> expected.equals(text(row, field))).count();
  }

  public static long countMatching(JsonNode node, String field, boolean expected) {
    return rows(node).stream().filter(row -> bool(row, field) == expected).count();
  }
}
