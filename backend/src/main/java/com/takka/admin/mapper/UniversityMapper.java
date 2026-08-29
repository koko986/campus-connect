package com.takka.admin.mapper;

import com.takka.admin.form.UniversityForm;
import com.takka.admin.model.UniversityOption;
import com.takka.admin.model.UniversityView;
import com.takka.admin.support.Json;
import com.takka.admin.support.Timestamps;
import tools.jackson.databind.JsonNode;

/** Maps {@code universities} rows onto the directory table, the edit form, and select options. */
public final class UniversityMapper {
  private UniversityMapper() {}

  public static UniversityView toView(JsonNode row) {
    return new UniversityView(
        Json.uuid(row, "id"),
        Json.text(row, "slug"),
        Json.text(row, "name"),
        Json.text(row, "short_name"),
        Json.text(row, "university_type"),
        Json.text(row, "city"),
        Json.text(row, "region"),
        Json.bool(row, "is_published"),
        Json.optionalInstant(row, "archived_at").isPresent(),
        Json.embeddedCount(row, "campuses"),
        Json.embeddedCount(row, "departments"),
        Json.embeddedCount(row, "programs"),
        Timestamps.format(Json.optionalInstant(row, "updated_at")));
  }

  public static UniversityOption toOption(JsonNode row) {
    return new UniversityOption(Json.uuid(row, "id"), Json.text(row, "name"), Json.text(row, "short_name"));
  }

  public static UniversityForm toForm(JsonNode row) {
    var form = new UniversityForm();
    form.setSlug(Json.text(row, "slug"));
    form.setName(Json.text(row, "name"));
    form.setShortName(Json.text(row, "short_name"));
    form.setUniversityType(Json.text(row, "university_type", "public"));
    form.setCity(Json.text(row, "city"));
    form.setRegion(Json.text(row, "region"));
    form.setCountryCode(Json.text(row, "country_code", "MM"));
    form.setDescription(Json.text(row, "description"));
    form.setAbout(Json.text(row, "about"));
    form.setWebsiteUrl(Json.text(row, "website_url"));
    form.setLogoPath(Json.text(row, "logo_path"));
    form.setCoverImagePath(Json.text(row, "cover_image_path"));
    form.setCoverImageCredit(Json.text(row, "cover_image_credit"));
    form.setCoverImageSourceUrl(Json.text(row, "cover_image_source_url"));
    form.setCoverImageLicense(Json.text(row, "cover_image_license"));
    form.setContactEmail(Json.text(row, "contact_email"));
    form.setContactPhone(Json.text(row, "contact_phone"));
    form.setDataSourceUrl(Json.text(row, "data_source_url"));
    form.setFoundedYear(Json.optionalInteger(row, "founded_year").orElse(null));
    form.setPublished(Json.bool(row, "is_published"));
    return form;
  }
}
