package com.takka.admin.form;

import com.takka.admin.model.CatalogResource;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * One catalog entry. Campuses, departments, and programs share enough shape to use a single form;
 * {@link #toAttributes(CatalogResource)} emits only the columns that the chosen table has.
 */
public class CatalogItemForm {
  /** Present when editing, absent when creating. */
  private UUID id;

  @NotNull(message = "Choose a university")
  private UUID universityId;

  @NotBlank(message = "A name is required")
  @Size(max = 200, message = "Name is too long")
  private String name = "";

  @Size(max = 120, message = "City is too long")
  private String city = "";

  @Size(max = 300, message = "Address is too long")
  private String address = "";

  @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
  @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
  private Double latitude;

  @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
  @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
  private Double longitude;

  @Size(max = 60, message = "Degree level is too long")
  private String degreeLevel = "";

  @Size(max = 2000, message = "Description is too long")
  private String description = "";

  private UUID departmentId;

  @Size(max = 500, message = "Source URL is too long")
  private String sourceUrl = "";

  public Map<String, Object> toAttributes(CatalogResource resource) {
    var attributes = new HashMap<String, Object>();
    attributes.put("university_id", universityId);
    attributes.put("name", name);
    attributes.put("source_url", blankToNull(sourceUrl));
    switch (resource) {
      case CAMPUSES -> {
        attributes.put("city", city);
        attributes.put("address", blankToNull(address));
        attributes.put("latitude", latitude);
        attributes.put("longitude", longitude);
      }
      case PROGRAMS -> {
        attributes.put("degree_level", blankToNull(degreeLevel));
        attributes.put("description", blankToNull(description));
        attributes.put("department_id", departmentId);
      }
      case DEPARTMENTS -> {
        // Departments carry only a name and source URL.
      }
    }
    return attributes;
  }

  /** Campuses require a city because the column is non-nullable. */
  public boolean isMissingRequiredCity(CatalogResource resource) {
    return resource.isCampuses() && city.isBlank();
  }

  public boolean isEditing() {
    return id != null;
  }

  private static String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUniversityId() {
    return universityId;
  }

  public void setUniversityId(UUID universityId) {
    this.universityId = universityId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name == null ? "" : name.trim();
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city == null ? "" : city.trim();
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address == null ? "" : address.trim();
  }

  public Double getLatitude() {
    return latitude;
  }

  public void setLatitude(Double latitude) {
    this.latitude = latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public void setLongitude(Double longitude) {
    this.longitude = longitude;
  }

  public String getDegreeLevel() {
    return degreeLevel;
  }

  public void setDegreeLevel(String degreeLevel) {
    this.degreeLevel = degreeLevel == null ? "" : degreeLevel.trim();
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description == null ? "" : description.trim();
  }

  public UUID getDepartmentId() {
    return departmentId;
  }

  public void setDepartmentId(UUID departmentId) {
    this.departmentId = departmentId;
  }

  public String getSourceUrl() {
    return sourceUrl;
  }

  public void setSourceUrl(String sourceUrl) {
    this.sourceUrl = sourceUrl == null ? "" : sourceUrl.trim();
  }
}
