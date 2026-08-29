package com.takka.admin.mapper;

import com.takka.admin.model.CatalogItemView;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.support.Json;
import tools.jackson.databind.JsonNode;

/** Maps campus, department, and program rows onto one shared catalog view model. */
public final class CatalogMapper {
  private CatalogMapper() {}

  public static CatalogItemView toView(JsonNode row, CatalogResource resource) {
    JsonNode department = Json.embeddedRow(row, "departments");

    return new CatalogItemView(
        Json.uuid(row, "id"),
        resource,
        Json.text(row, "name"),
        Json.text(row, "city"),
        Json.text(row, "address"),
        Json.text(row, "degree_level"),
        Json.text(row, "description"),
        Json.text(department, "name"),
        Json.optionalUuid(row, "department_id").orElse(null),
        Json.text(row, "source_url"));
  }

  /** Columns to request per resource, including the department name embed used by programs. */
  public static String selectFor(CatalogResource resource) {
    return switch (resource) {
      case CAMPUSES -> "id,name,city,address,latitude,longitude,source_url,university_id";
      case DEPARTMENTS -> "id,name,source_url,university_id";
      case PROGRAMS -> "id,name,degree_level,description,source_url,university_id,department_id,departments(name)";
    };
  }
}
