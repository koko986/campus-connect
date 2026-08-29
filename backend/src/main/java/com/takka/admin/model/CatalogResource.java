package com.takka.admin.model;

import com.takka.admin.support.MessageException;
import java.util.Locale;
import java.util.Optional;

/** The three catalog tables an administrator can curate under a university. */
public enum CatalogResource {
  CAMPUSES("campuses"),
  DEPARTMENTS("departments"),
  PROGRAMS("programs");

  private final String table;

  CatalogResource(String table) {
    this.table = table;
  }

  public String table() {
    return table;
  }

  public String labelKey() {
    return "enum.catalog.plural." + name();
  }

  public String singularKey() {
    return "enum.catalog.singular." + name();
  }

  /** Per-resource keys, so each sentence reads naturally rather than splicing in a noun. */
  public String notFoundKey() {
    return "error.catalog.notFound." + name();
  }

  public String notSavedKey() {
    return "error.catalog.notSaved." + name();
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
    return parse(value).orElseThrow(() -> new MessageException("error.catalog.unsupportedResource", value));
  }
}
