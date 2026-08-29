package com.takka.admin.repository;

import com.takka.admin.model.AccountStatus;
import com.takka.admin.support.Json;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** Reads and writes the {@code account_moderation} table. */
@Repository
public class AccountModerationRepository {
  private static final String UPSERT_MERGE = "resolution=merge-duplicates";
  private final SupabaseGateway supabase;

  public AccountModerationRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Optional<AccountStatus> findStatus(UUID userId) {
    var query = Query.from("account_moderation").select("status").eq("user_id", userId).limit(1);
    return Json.firstRow(supabase.get(query.build()))
        .flatMap(row -> AccountStatus.parse(Json.text(row, "status")));
  }

  public List<UUID> findBlockedUserIds() {
    var query = Query.from("account_moderation").select("user_id").eq("status", AccountStatus.BLOCKED);
    var ids = new ArrayList<UUID>();
    for (var row : Json.rows(supabase.get(query.build()))) {
      Json.optionalUuid(row, "user_id").ifPresent(ids::add);
    }
    return ids;
  }

  public long countBlocked() {
    return findBlockedUserIds().size();
  }

  public void block(UUID userId, String reason, UUID administratorId) {
    Instant now = Instant.now();
    var attributes = new HashMap<String, Object>();
    attributes.put("user_id", userId);
    attributes.put("status", AccountStatus.BLOCKED.name());
    attributes.put("reason", reason);
    attributes.put("blocked_at", now.toString());
    attributes.put("blocked_by", administratorId);
    attributes.put("updated_at", now.toString());
    upsert(attributes);
  }

  public void unblock(UUID userId, String reason) {
    var attributes = new HashMap<String, Object>();
    attributes.put("user_id", userId);
    attributes.put("status", AccountStatus.ACTIVE.name());
    attributes.put("reason", reason);
    // The table's check constraint requires both block columns to be null while active.
    attributes.put("blocked_at", null);
    attributes.put("blocked_by", null);
    attributes.put("updated_at", Instant.now().toString());
    upsert(attributes);
  }

  private void upsert(HashMap<String, Object> attributes) {
    var query = Query.from("account_moderation").upsertOn("user_id");
    supabase.post(query.build(), attributes, UPSERT_MERGE);
  }
}
