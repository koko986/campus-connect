package com.takka.admin.model;

import java.util.UUID;

/** A row in the university directory table. */
public record UniversityView(
    UUID id,
    String slug,
    String name,
    String shortName,
    String universityType,
    String city,
    String region,
    boolean published,
    boolean archived,
    int campuses,
    int departments,
    int programs,
    String updated) {

  public String state() {
    if (archived) return "Archived";
    return published ? "Published" : "Draft";
  }

  public String stateTone() {
    if (archived) return "muted";
    return published ? "success" : "warning";
  }

  public boolean canPublish() {
    return !published || archived;
  }

  public boolean canUnpublish() {
    return published && !archived;
  }

  public boolean canArchive() {
    return !archived;
  }

  public String location() {
    return region == null || region.isBlank() ? city : city + ", " + region;
  }
}
