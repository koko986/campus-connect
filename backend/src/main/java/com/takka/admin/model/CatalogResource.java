package com.takka.admin.model;

import java.util.Locale;
import java.util.Optional;

/** The three catalog tables an administrator can curate under a university. */
public enum CatalogResource {
  CAMPUSES("campuses", "Campuses", "Campus"),
  DEPARTMENTS("departments", "Departments", "Department"),
  PROGRAMS("programs", "Programs", "Program");

  private final String table;
  private final String label;
  private final String singular;

  CatalogResource(String table, String label, String singular) {
    this.table = table;
    this.label = label;
    this.singular = singular;
  }

  public String table() {
    return table;
  }

  public String label() {
    return label;
  }

  public String singular() {
    return singular;
  }

  /** Path segment used in console URLs, matching the existing catalog API vocabulary. */
  public String slug() {
    return table;
  }

  public boolean isCampuses() {
    return this == CAMPUSES;
  }

  public boolean isPrograms() {
    return this == PROGRAMS;
  }

  public static Optional<CatalogResource> parse(String value) {
    if (value == null || value.isBlank()) return Optional.empty();
    try {
      return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
    } catch (IllegalArgumentException unknown) {
      return Optional.empty();
    }
  }

  public static CatalogResource require(String value) {
    return parse(value).orElseThrow(() -> new IllegalArgumentException("Unsupported catalog resource: " + value));
  }
}
