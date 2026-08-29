package com.takka.admin.repository;

import com.takka.admin.model.AccountStatus;
import com.takka.admin.model.MemberFilter;
import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads member accounts from {@code profiles} together with their moderation and student embeds. */
@Repository
public class ProfileRepository {
  private static final String MEMBER_SELECT = "id,full_name,email,account_type,created_at,"
      + "student_profiles(university_id,verification_status,universities(name)),"
      + "account_moderation(status,reason,blocked_at)";
  private static final String SNAPSHOT_SELECT = "id,email,full_name,account_type";

  private final SupabaseGateway supabase;

  public ProfileRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  /**
   * One page of members. Status filtering is applied through the pre-resolved blocked-id list
   * because PostgREST cannot express "has no moderation row or is active" on an embedded table.
   */
  public Page<JsonNode> findMembers(MemberFilter filter, PageRequest request, List<UUID> blockedIds) {
    Optional<AccountStatus> status = filter.status();
    if (status.filter(AccountStatus::isBlocked).isPresent() && blockedIds.isEmpty()) {
      return Page.empty(request);
    }

    var query = Query.from("profiles")
        .select(MEMBER_SELECT)
        .orderBy("created_at", Query.Direction.DESCENDING)
        .page(request);
    if (filter.hasSearch()) query.containsAnyOf(filter.search(), "full_name", "email");
    status.ifPresent(value -> {
      if (value.isBlocked()) {
        query.in("id", blockedIds);
      } else if (!blockedIds.isEmpty()) {
        query.notIn("id", blockedIds);
      }
    });

    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  /** Minimal account details used for audit snapshots and confirmation prompts. */
  public Optional<JsonNode> findById(UUID userId) {
    var query = Query.from("profiles").select(SNAPSHOT_SELECT).eq("id", userId).limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public JsonNode requireById(UUID userId) {
    return findById(userId).orElseThrow(() -> new IllegalArgumentException("Member not found"));
  }

  public long countAll() {
    var query = Query.from("profiles").select("id");
    return Json.requireArray(supabase.get(query.build())).size();
  }
}
