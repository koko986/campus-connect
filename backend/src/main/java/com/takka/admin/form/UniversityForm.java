package com.takka.admin.form;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** The university directory record as edited in the console. */
public class UniversityForm {
  public static final List<String> TYPES = List.of("public", "private");

  @NotBlank(message = "A URL slug is required")
  @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "Use lowercase letters, numbers, and hyphens only")
  @Size(max = 120, message = "Slug is too long")
  private String slug = "";

  @NotBlank(message = "A name is required")
  @Size(max = 200, message = "Name is too long")
  private String name = "";

  @NotBlank(message = "A short name is required")
  @Size(max = 40, message = "Short name is too long")
  private String shortName = "";

  @NotBlank(message = "Choose a university type")
  @Pattern(regexp = "public|private", message = "Type must be public or private")
  private String universityType = "public";

  @NotBlank(message = "A city is required")
  @Size(max = 120, message = "City is too long")
  private String city = "";

  @Size(max = 120, message = "Region is too long")
  private String region = "";

  @NotBlank(message = "A country code is required")
  @Pattern(regexp = "[A-Z]{2}", message = "Use a two-letter uppercase country code")
  private String countryCode = "MM";

  @NotBlank(message = "A short description is required")
  @Size(max = 500, message = "Description must be 500 characters or fewer")
  private String description = "";

  @Size(max = 8000, message = "About text is too long")
  private String about = "";

  @Size(max = 500, message = "Website URL is too long")
  private String websiteUrl = "";

  @Size(max = 500, message = "Logo path is too long")
  private String logoPath = "";

  @Email(message = "Enter a valid contact email")
  @Size(max = 200, message = "Contact email is too long")
  private String contactEmail = "";

  @Size(max = 60, message = "Contact phone is too long")
  private String contactPhone = "";

  @Size(max = 500, message = "Data source URL is too long")
  private String dataSourceUrl = "";

  @Min(value = 1500, message = "Founded year looks too early")
  @Max(value = 2100, message = "Founded year looks too late")
  private Integer foundedYear;

  private boolean published;

  /** Column values for the Supabase insert or update. */
  public Map<String, Object> toAttributes() {
    var attributes = new HashMap<String, Object>();
    attributes.put("slug", slug);
    attributes.put("name", name);
    attributes.put("short_name", shortName);
    attributes.put("university_type", universityType);
    attributes.put("city", city);
    attributes.put("region", blankToNull(region));
    attributes.put("country_code", countryCode);
    attributes.put("description", description);
    attributes.put("about", blankToNull(about));
    attributes.put("website_url", blankToNull(websiteUrl));
    attributes.put("logo_path", blankToNull(logoPath));
    attributes.put("contact_email", blankToNull(contactEmail));
    attributes.put("contact_phone", blankToNull(contactPhone));
    attributes.put("data_source_url", blankToNull(dataSourceUrl));
    attributes.put("founded_year", foundedYear);
    attributes.put("is_published", published);
    attributes.put("updated_at", Instant.now().toString());
    return attributes;
  }

  private static String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug == null ? "" : slug.trim().toLowerCase(java.util.Locale.ROOT);
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name == null ? "" : name.trim();
  }

  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = shortName == null ? "" : shortName.trim();
  }

  public String getUniversityType() {
    return universityType;
  }

  public void setUniversityType(String universityType) {
    this.universityType = universityType == null || universityType.isBlank() ? "public" : universityType.trim();
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city == null ? "" : city.trim();
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region == null ? "" : region.trim();
  }

  public String getCountryCode() {
    return countryCode;
  }

  public void setCountryCode(String countryCode) {
    this.countryCode = countryCode == null || countryCode.isBlank()
        ? "MM"
        : countryCode.trim().toUpperCase(java.util.Locale.ROOT);
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description == null ? "" : description.trim();
  }

  public String getAbout() {
    return about;
  }

  public void setAbout(String about) {
    this.about = about == null ? "" : about.trim();
  }

  public String getWebsiteUrl() {
    return websiteUrl;
  }

  public void setWebsiteUrl(String websiteUrl) {
    this.websiteUrl = websiteUrl == null ? "" : websiteUrl.trim();
  }

  public String getLogoPath() {
    return logoPath;
  }

  public void setLogoPath(String logoPath) {
    this.logoPath = logoPath == null ? "" : logoPath.trim();
  }

  public String getContactEmail() {
    return contactEmail;
  }

  public void setContactEmail(String contactEmail) {
    this.contactEmail = contactEmail == null ? "" : contactEmail.trim();
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone == null ? "" : contactPhone.trim();
  }

  public String getDataSourceUrl() {
    return dataSourceUrl;
  }

  public void setDataSourceUrl(String dataSourceUrl) {
    this.dataSourceUrl = dataSourceUrl == null ? "" : dataSourceUrl.trim();
  }

  public Integer getFoundedYear() {
    return foundedYear;
  }

  public void setFoundedYear(Integer foundedYear) {
    this.foundedYear = foundedYear;
  }

  public boolean isPublished() {
    return published;
  }

  public void setPublished(boolean published) {
    this.published = published;
  }
}
