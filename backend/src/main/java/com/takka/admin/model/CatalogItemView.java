package com.takka.admin.model;

import java.util.UUID;

/** A campus, department, or program row under one university. */
public record CatalogItemView(
    UUID id,
    CatalogResource resource,
    String name,
    String city,
    String address,
    String degreeLevel,
    String description,
    String department,
    UUID departmentId,
    String sourceUrl) {

  public boolean hasCity() {
    return city != null && !city.isBlank();
  }

  public boolean hasAddress() {
    return address != null && !address.isBlank();
  }

  public boolean hasDegreeLevel() {
    return degreeLevel != null && !degreeLevel.isBlank();
  }

  public boolean hasDepartment() {
    return department != null && !department.isBlank();
  }

  public boolean hasSourceUrl() {
    return sourceUrl != null && !sourceUrl.isBlank();
  }

  /** Secondary line shown under the name, varying by resource type. */
  public String detail() {
    return switch (resource) {
      case CAMPUSES -> hasAddress() ? address : city;
      case DEPARTMENTS -> hasSourceUrl() ? sourceUrl : "";
      case PROGRAMS -> hasDepartment() ? department : "";
    };
  }
}
