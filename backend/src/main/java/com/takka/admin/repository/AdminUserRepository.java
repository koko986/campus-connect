package com.takka.admin.repository;

import com.takka.admin.model.AdminRole;
import com.takka.admin.support.Json;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** Reads the server-managed {@code admin_users} assignments. */
@Repository
public class AdminUserRepository {
  private final SupabaseGateway supabase;

  public AdminUserRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
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
}
