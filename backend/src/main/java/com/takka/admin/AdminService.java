package com.takka.admin;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
  private static final List<String> REPORT_STATUSES = List.of("OPEN", "REVIEWING", "RESOLVED", "DISMISSED");
  private final SupabaseGateway supabase;

  public AdminService(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Map<String, Object> me(TakkaPrincipal principal) {
    JsonNode admin = requireAdmin(principal, false);
    return Map.of("userId", principal.id(), "email", principal.email(), "role", admin.path("role").asText());
  }

  public Map<String, Object> overview(TakkaPrincipal principal) {
    requireAdmin(principal, false);
    ArrayNode reports = array(supabase.get("reports?select=status"));
    ArrayNode members = array(supabase.get("profiles?select=id"));
    ArrayNode moderation = array(supabase.get("account_moderation?select=status"));
    ArrayNode posts = array(supabase.get("posts?select=moderation_status"));
    ArrayNode universities = array(supabase.get("universities?select=id,is_published,archived_at"));
    return Map.of(
        "openReports", count(reports, "status", "OPEN") + count(reports, "status", "REVIEWING"),
        "members", members.size(),
        "blockedMembers", count(moderation, "status", "BLOCKED"),
        "posts", posts.size(),
        "removedPosts", count(posts, "moderation_status", "REMOVED"),
        "universities", universities.size(),
        "publishedUniversities", countBoolean(universities, "is_published", true));
  }

  public JsonNode reports(TakkaPrincipal principal, String status, int page, int size) {
    requireAdmin(principal, false);
    String filter = status == null || status.isBlank() ? "" : "&status=eq." + normalize(status, REPORT_STATUSES);
    return supabase.get("reports?select=*&order=created_at.desc&offset=" + offset(page, size) + "&limit=" + limit(size) + filter);
  }

  public JsonNode updateReport(TakkaPrincipal principal, UUID reportId, ReportUpdate request) {
    JsonNode admin = requireAdmin(principal, false);
    String status = normalize(request.status(), REPORT_STATUSES);
    var body = new HashMap<String, Object>();
    body.put("status", status);
    body.put("assigned_to", principal.id());
    body.put("resolution_notes", request.notes());
    body.put("updated_at", Instant.now().toString());
    body.put("resolved_at", List.of("RESOLVED", "DISMISSED").contains(status) ? Instant.now().toString() : null);
    JsonNode updated = supabase.patch("reports?id=eq." + reportId + "&select=*", body, "return=representation");
    if (array(updated).isEmpty()) throw new IllegalArgumentException("Report not found");
    if (List.of("RESOLVED", "DISMISSED").contains(status)) {
      JsonNode report = array(updated).get(0);
      audit(principal, status.equals("RESOLVED") ? "RESOLVE_REPORT" : "DISMISS_REPORT",
          "REPORT", reportId, requiredReason(request.notes()), reportId, report);
    }
    return array(updated).get(0);
  }

  public JsonNode members(TakkaPrincipal principal, String search, String status, int page, int size) {
    requireAdmin(principal, false);
    StringBuilder query = new StringBuilder("profiles?select=*,student_profiles(university_id,verification_status,universities(name)),account_moderation(status,reason,blocked_at)&order=created_at.desc");
    if (search != null && !search.isBlank()) {
      String term = SupabaseGateway.encode("*" + search.trim() + "*");
      query.append("&or=(full_name.ilike.").append(term).append(",email.ilike.").append(term).append(")");
    }
    if ("BLOCKED".equalsIgnoreCase(status)) query.append("&account_moderation.status=eq.BLOCKED");
    query.append("&offset=").append(offset(page, size)).append("&limit=").append(limit(size));
    return supabase.get(query.toString());
  }

  public void block(TakkaPrincipal principal, UUID userId, ActionRequest request) {
    requireAdmin(principal, false);
    preventProtectedTarget(principal, userId);
    JsonNode profile = one("profiles?select=id,email,full_name,account_type&id=eq." + userId, "Member not found");
    supabase.updateAuthUser(userId, Map.of("ban_duration", "876000h"));
    supabase.post("account_moderation?on_conflict=user_id", Map.of(
        "user_id", userId,
        "status", "BLOCKED",
        "reason", requiredReason(request.reason()),
        "blocked_at", Instant.now().toString(),
        "blocked_by", principal.id(),
        "updated_at", Instant.now().toString()), "resolution=merge-duplicates");
    audit(principal, "BLOCK_USER", "ACCOUNT", userId, request.reason(), request.reportId(), profile);
    resolveLinkedReport(principal, request.reportId(), request.reason());
  }

  public void unblock(TakkaPrincipal principal, UUID userId, ActionRequest request) {
    requireAdmin(principal, false);
    JsonNode profile = one("profiles?select=id,email,full_name,account_type&id=eq." + userId, "Member not found");
    supabase.updateAuthUser(userId, Map.of("ban_duration", "none"));
    var moderation = new HashMap<String, Object>();
    moderation.put("user_id", userId);
    moderation.put("status", "ACTIVE");
    moderation.put("reason", requiredReason(request.reason()));
    moderation.put("blocked_at", null);
    moderation.put("blocked_by", null);
    moderation.put("updated_at", Instant.now().toString());
    supabase.post("account_moderation?on_conflict=user_id", moderation, "resolution=merge-duplicates");
    audit(principal, "UNBLOCK_USER", "ACCOUNT", userId, request.reason(), request.reportId(), profile);
  }

  public void deleteMember(TakkaPrincipal principal, UUID userId, ActionRequest request) {
    requireAdmin(principal, true);
    preventProtectedTarget(principal, userId);
    JsonNode profile = one("profiles?select=id,email,full_name,account_type&id=eq." + userId, "Member not found");
    supabase.deleteAuthUser(userId);
    audit(principal, "DELETE_USER", "ACCOUNT", userId, request.reason(), request.reportId(), profile);
  }

  public JsonNode posts(TakkaPrincipal principal, String status, int page, int size) {
    requireAdmin(principal, false);
    String filter = status == null || status.isBlank() ? "" : "&moderation_status=eq." + SupabaseGateway.encode(status.toUpperCase(Locale.ROOT));
    ArrayNode posts = array(supabase.get("posts?select=*,profiles(full_name,email)&order=created_at.desc&offset=" + offset(page, size) + "&limit=" + limit(size) + filter));
    ArrayNode reports = array(supabase.get("reports?select=id,target_id,status&target_type=eq.POST"));
    for (JsonNode post : posts) {
      long reportCount = 0;
      for (JsonNode report : reports) if (report.path("target_id").asText().equals(post.path("id").asText())) reportCount++;
      ((tools.jackson.databind.node.ObjectNode) post).put("report_count", reportCount);
    }
    return posts;
  }

  public void moderatePost(TakkaPrincipal principal, UUID postId, ActionRequest request, boolean restore) {
    requireAdmin(principal, false);
    JsonNode post = one("posts?select=id,body,author_id,moderation_status&id=eq." + postId, "Post not found");
    var body = new HashMap<String, Object>();
    body.put("moderation_status", restore ? "PUBLISHED" : "REMOVED");
    body.put("removed_at", restore ? null : Instant.now().toString());
    body.put("removed_by", restore ? null : principal.id());
    body.put("removal_reason", restore ? null : requiredReason(request.reason()));
    body.put("updated_at", Instant.now().toString());
    supabase.patch("posts?id=eq." + postId, body, null);
    audit(principal, restore ? "RESTORE_POST" : "REMOVE_POST", "POST", postId,
        request.reason(), request.reportId(), post);
    if (!restore) resolveLinkedReport(principal, request.reportId(), request.reason());
  }

  public JsonNode auditLog(TakkaPrincipal principal, int page, int size) {
    requireAdmin(principal, false);
    return supabase.get("moderation_actions?select=*&order=created_at.desc&offset=" + offset(page, size) + "&limit=" + limit(size));
  }

  public JsonNode universities(TakkaPrincipal principal, int page, int size) {
    requireAdmin(principal, false);
    return supabase.get("universities?select=*,campuses(count),departments(count),programs(count)&order=name.asc&offset=" + offset(page, size) + "&limit=" + limit(size));
  }

  public JsonNode saveUniversity(TakkaPrincipal principal, UUID id, UniversityRequest request) {
    requireAdmin(principal, true);
    Map<String, Object> body = request.toMap();
    JsonNode result;
    String action;
    if (id == null) {
      result = supabase.post("universities?select=*", body, "return=representation");
      action = "CREATE_UNIVERSITY";
    } else {
      result = supabase.patch("universities?id=eq." + id + "&select=*", body, "return=representation");
      action = "UPDATE_UNIVERSITY";
    }
    if (array(result).isEmpty()) throw new IllegalArgumentException("University was not saved");
    JsonNode saved = array(result).get(0);
    audit(principal, action, "UNIVERSITY", UUID.fromString(saved.get("id").asText()), "University catalog update", null, saved);
    return saved;
  }

  public void setUniversityState(TakkaPrincipal principal, UUID id, String operation, ActionRequest request) {
    requireAdmin(principal, true);
    JsonNode university = one("universities?select=id,name,is_published,archived_at&id=eq." + id, "University not found");
    Map<String, Object> body = new HashMap<>();
    String action;
    switch (operation.toLowerCase(Locale.ROOT)) {
      case "publish" -> { body.put("is_published", true); body.put("archived_at", null); body.put("archived_by", null); action = "PUBLISH_UNIVERSITY"; }
      case "unpublish" -> { body.put("is_published", false); action = "UNPUBLISH_UNIVERSITY"; }
      case "archive" -> { body.put("is_published", false); body.put("archived_at", Instant.now().toString()); body.put("archived_by", principal.id()); action = "ARCHIVE_UNIVERSITY"; }
      default -> throw new IllegalArgumentException("Unknown university operation");
    }
    body.put("updated_at", Instant.now().toString());
    supabase.patch("universities?id=eq." + id, body, null);
    audit(principal, action, "UNIVERSITY", id, request.reason(), request.reportId(), university);
  }

  public JsonNode catalog(TakkaPrincipal principal, String resource, UUID universityId) {
    requireAdmin(principal, false);
    String table = catalogTable(resource);
    String filter = universityId == null ? "" : "&university_id=eq." + universityId;
    return supabase.get(table + "?select=*&order=name.asc" + filter);
  }

  public JsonNode saveCatalog(TakkaPrincipal principal, String resource, UUID id, Map<String, Object> body) {
    requireAdmin(principal, true);
    String table = catalogTable(resource);
    JsonNode result = id == null
        ? supabase.post(table + "?select=*", body, "return=representation")
        : supabase.patch(table + "?id=eq." + id + "&select=*", body, "return=representation");
    if (array(result).isEmpty()) throw new IllegalArgumentException("Catalog item was not saved");
    return array(result).get(0);
  }

  public JsonNode requireAdmin(TakkaPrincipal principal, boolean superAdmin) {
    JsonNode admin = oneOrNull("admin_users?select=role,is_active&user_id=eq." + principal.id() + "&is_active=eq.true&limit=1");
    if (admin == null || (superAdmin && !"SUPER_ADMIN".equals(admin.path("role").asText()))) {
      throw new AccessDeniedException(superAdmin ? "Super admin access required" : "Admin access required");
    }
    return admin;
  }

  private void preventProtectedTarget(TakkaPrincipal principal, UUID userId) {
    if (principal.id().equals(userId)) throw new IllegalArgumentException("You cannot moderate your own account");
    if (oneOrNull("admin_users?select=user_id&user_id=eq." + userId + "&is_active=eq.true&limit=1") != null) {
      throw new AccessDeniedException("Active administrator accounts cannot be moderated");
    }
  }

  private void resolveLinkedReport(TakkaPrincipal principal, UUID reportId, String notes) {
    if (reportId == null) return;
    supabase.patch("reports?id=eq." + reportId, Map.of(
        "status", "RESOLVED", "assigned_to", principal.id(), "resolution_notes", requiredReason(notes),
        "resolved_at", Instant.now().toString(), "updated_at", Instant.now().toString()), null);
  }

  private void audit(TakkaPrincipal principal, String action, String targetType, UUID targetId,
      String reason, UUID reportId, JsonNode snapshot) {
    var body = new HashMap<String, Object>();
    body.put("admin_id", principal.id());
    body.put("admin_email", principal.email());
    body.put("action", action);
    body.put("target_type", targetType);
    body.put("target_id", targetId);
    body.put("reason", requiredReason(reason));
    body.put("report_id", reportId);
    body.put("target_snapshot", snapshot);
    supabase.post("moderation_actions", body, null);
  }

  private JsonNode one(String query, String message) {
    JsonNode value = oneOrNull(query);
    if (value == null) throw new IllegalArgumentException(message);
    return value;
  }

  private JsonNode oneOrNull(String query) {
    ArrayNode values = array(supabase.get(query));
    return values.isEmpty() ? null : values.get(0);
  }

  private static ArrayNode array(JsonNode node) {
    if (!node.isArray()) throw new IllegalStateException("Unexpected Supabase response");
    return (ArrayNode) node;
  }

  private static int count(ArrayNode values, String field, String expected) {
    int count = 0;
    for (JsonNode value : values) if (expected.equals(value.path(field).asText())) count++;
    return count;
  }

  private static int countBoolean(ArrayNode values, String field, boolean expected) {
    int count = 0;
    for (JsonNode value : values) if (value.path(field).asBoolean() == expected) count++;
    return count;
  }

  private static int limit(int size) { return Math.max(1, Math.min(size, 100)); }
  private static int offset(int page, int size) { return Math.max(0, page) * limit(size); }

  private static String normalize(String value, List<String> allowed) {
    String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    if (!allowed.contains(normalized)) throw new IllegalArgumentException("Invalid value: " + value);
    return normalized;
  }

  private static String requiredReason(String reason) {
    if (reason == null || reason.trim().length() < 3) throw new IllegalArgumentException("A reason of at least 3 characters is required");
    return reason.trim();
  }

  private static String catalogTable(String resource) {
    return switch (resource.toLowerCase(Locale.ROOT)) {
      case "campuses" -> "campuses";
      case "departments" -> "departments";
      case "programs" -> "programs";
      default -> throw new IllegalArgumentException("Unsupported catalog resource");
    };
  }

  public record ActionRequest(String reason, UUID reportId) {}
  public record ReportUpdate(String status, String notes) {}
  public record UniversityRequest(
      String slug, String name, String shortName, String universityType, String city, String region,
      String countryCode, String description, String about, String websiteUrl, String logoPath,
      Boolean published, Integer foundedYear, String contactEmail, String contactPhone, String dataSourceUrl) {
    Map<String, Object> toMap() {
      var values = new HashMap<String, Object>();
      values.put("slug", slug); values.put("name", name); values.put("short_name", shortName);
      values.put("university_type", universityType); values.put("city", city); values.put("region", region);
      values.put("country_code", countryCode == null ? "MM" : countryCode); values.put("description", description);
      values.put("about", about); values.put("website_url", websiteUrl); values.put("logo_path", logoPath);
      values.put("is_published", Boolean.TRUE.equals(published)); values.put("founded_year", foundedYear);
      values.put("contact_email", contactEmail); values.put("contact_phone", contactPhone);
      values.put("data_source_url", dataSourceUrl); values.put("updated_at", Instant.now().toString());
      return values;
    }
  }
}
