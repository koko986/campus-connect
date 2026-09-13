package com.takka.admin.model;

/** One label/value row in an admin preview page. */
public record AdminPreviewField(String labelKey, String value) {
  public boolean hasValue() {
    return value != null && !value.isBlank();
  }
}
