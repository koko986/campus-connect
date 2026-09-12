package com.takka.admin.repository;

import com.takka.admin.model.AdminRole;
import com.takka.admin.support.Json;
import com.takka.admin.support.Query;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/** Reads the server-managed {@code admin_users} assignments. */
@Repository
public class AdminUserRepository {
  private static final String UPSERT_MERGE = "resolution=merge-duplicates";

  private final SupabaseGateway supabase;
  private final Set<String> bootstrapEmails;

  public AdminUserRepository(
      SupabaseGateway supabase,
      @Value("${takka.admin.bootstrap-emails:admin@gmail.com}") String bootstrapEmails) {
    this.supabase = supabase;
    this.bootstrapEmails = parseEmails(bootstrapEmails);
  }

  /** The role of an active administrator, or empty when the user is not an active administrator. */
  public Optional<AdminRole> findActiveRole(UUID userId) {
    var query = Query.from("admin_users")
        .select("role,is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1);
    return Json.firstRow(supabase.get(query.build()))
        .flatMap(row -> AdminRole.parse(Json.text(row, "role")));
  }

  /**
   * Ensures the presentation/demo administrator exists even when the production database has not
   * had its latest seed migration applied yet.
   */
  public Optional<AdminRole> findActiveRole(TakkaPrincipal principal) {
    if (isBootstrapAdministrator(principal.email())) {
      upsertBootstrapAdministrator(principal.id());
    }
    return findActiveRole(principal.id());
  }

  public boolean isActiveAdmin(UUID userId) {
    return findActiveRole(userId).isPresent();
  }

  /** Ids of every active administrator, used to shield those accounts from moderation. */
  public Set<UUID> findActiveAdministratorIds() {
    var query = Query.from("admin_users").select("user_id").eq("is_active", true);
    var ids = new LinkedHashSet<UUID>();
    for (var row : Json.rows(supabase.get(query.build()))) {
      Json.optionalUuid(row, "user_id").ifPresent(ids::add);
    }
    return ids;
  }

  private boolean isBootstrapAdministrator(String email) {
    return email != null && bootstrapEmails.contains(email.trim().toLowerCase());
  }

  private void upsertBootstrapAdministrator(UUID userId) {
    var attributes = new HashMap<String, Object>();
    attributes.put("user_id", userId);
    attributes.put("role", AdminRole.SUPER_ADMIN.name());
    attributes.put("is_active", true);
    var query = Query.from("admin_users").upsertOn("user_id");
    supabase.post(query.build(), attributes, UPSERT_MERGE);
  }

  private static Set<String> parseEmails(String value) {
    var emails = new LinkedHashSet<String>();
    Arrays.stream((value == null ? "" : value).split(","))
        .map(String::trim)
        .map(String::toLowerCase)
        .filter(email -> !email.isBlank())
        .forEach(emails::add);
    return emails;
  }
}
