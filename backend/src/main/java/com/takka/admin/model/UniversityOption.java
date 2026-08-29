package com.takka.admin.model;

import java.util.UUID;

/** Lightweight university reference for select inputs on the catalog page. */
public record UniversityOption(UUID id, String name, String shortName) {
  public String label() {
    return shortName == null || shortName.isBlank() || shortName.equals(name) ? name : name + " (" + shortName + ")";
  }
}
