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

/**
 * The university directory record as edited in the console.
 *
 * <p>Constraint messages are message-bundle keys in braces, which the console's validator resolves
 * against the same bundle the templates read, so a refused field explains itself in the
 * administrator's language.
 */
public class UniversityForm {
  public static final List<String> TYPES = List.of("public", "private");

  @NotBlank(message = "{validation.university.slug.required}")
  @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "{validation.university.slug.pattern}")
  @Size(max = 120, message = "{validation.university.slug.tooLong}")
  private String slug = "";

  @NotBlank(message = "{validation.university.name.required}")
  @Size(max = 200, message = "{validation.university.name.tooLong}")
  private String name = "";

  @NotBlank(message = "{validation.university.shortName.required}")
  @Size(max = 40, message = "{validation.university.shortName.tooLong}")
  private String shortName = "";

  @NotBlank(message = "{validation.university.type.required}")
  @Pattern(regexp = "public|private", message = "{validation.university.type.pattern}")
  private String universityType = "public";

  @NotBlank(message = "{validation.university.city.required}")
  @Size(max = 120, message = "{validation.university.city.tooLong}")
  private String city = "";

  @Size(max = 120, message = "{validation.university.region.tooLong}")
  private String region = "";

  @NotBlank(message = "{validation.university.countryCode.required}")
  @Pattern(regexp = "[A-Z]{2}", message = "{validation.university.countryCode.pattern}")
  private String countryCode = "MM";

  @NotBlank(message = "{validation.university.description.required}")
  @Size(max = 500, message = "{validation.university.description.tooLong}")
  private String description = "";

  @Size(max = 8000, message = "{validation.university.about.tooLong}")
  private String about = "";

  @Size(max = 500, message = "{validation.university.websiteUrl.tooLong}")
  private String websiteUrl = "";

  @Size(max = 500, message = "{validation.university.logoPath.tooLong}")
  private String logoPath = "";

  @Size(max = 500, message = "{validation.university.coverImagePath.tooLong}")
  private String coverImagePath = "";

  @Size(max = 500, message = "{validation.university.coverImageCredit.tooLong}")
  private String coverImageCredit = "";

  @Size(max = 500, message = "{validation.university.coverImageSourceUrl.tooLong}")
  private String coverImageSourceUrl = "";

  @Size(max = 120, message = "{validation.university.coverImageLicense.tooLong}")
  private String coverImageLicense = "";

  @Email(message = "{validation.university.contactEmail.invalid}")
  @Size(max = 200, message = "{validation.university.contactEmail.tooLong}")
  private String contactEmail = "";

  @Size(max = 60, message = "{validation.university.contactPhone.tooLong}")
  private String contactPhone = "";

  @Size(max = 500, message = "{validation.university.dataSourceUrl.tooLong}")
  private String dataSourceUrl = "";

  @Min(value = 1500, message = "{validation.university.foundedYear.min}")
  @Max(value = 2100, message = "{validation.university.foundedYear.max}")
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
    attributes.put("cover_image_path", blankToNull(coverImagePath));
    attributes.put("cover_image_credit", blankToNull(coverImageCredit));
    attributes.put("cover_image_source_url", blankToNull(coverImageSourceUrl));
    attributes.put("cover_image_license", blankToNull(coverImageLicense));
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

  public String getCoverImagePath() {
    return coverImagePath;
  }

  public void setCoverImagePath(String coverImagePath) {
    this.coverImagePath = coverImagePath == null ? "" : coverImagePath.trim();
  }

  public String getCoverImageCredit() {
    return coverImageCredit;
  }

  public void setCoverImageCredit(String coverImageCredit) {
    this.coverImageCredit = coverImageCredit == null ? "" : coverImageCredit.trim();
  }

  public String getCoverImageSourceUrl() {
    return coverImageSourceUrl;
  }

  public void setCoverImageSourceUrl(String coverImageSourceUrl) {
    this.coverImageSourceUrl = coverImageSourceUrl == null ? "" : coverImageSourceUrl.trim();
  }

  public String getCoverImageLicense() {
    return coverImageLicense;
  }

  public void setCoverImageLicense(String coverImageLicense) {
    this.coverImageLicense = coverImageLicense == null ? "" : coverImageLicense.trim();
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
