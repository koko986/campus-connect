package com.takka.admin.repository;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/**
 * Appends to and reads the {@code moderation_actions} audit trail. A database trigger rejects
 * updates and deletes, so this repository only ever inserts and selects.
 */
@Repository
public class AuditRepository {
  private final SupabaseGateway supabase;

  public AuditRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public void append(
      AdminIdentity administrator,
      ModerationAction action,
      UUID targetId,
      String reason,
      UUID reportId,
      JsonNode targetSnapshot) {
    var attributes = new HashMap<String, Object>();
    attributes.put("admin_id", administrator.userId());
    attributes.put("admin_email", administrator.email());
    attributes.put("action", action.name());
    attributes.put("target_type", action.targetType());
    attributes.put("target_id", targetId);
    attributes.put("reason", reason);
    attributes.put("report_id", reportId);
    attributes.put("target_snapshot", targetSnapshot);
    supabase.post(Query.from("moderation_actions").build(), attributes, null);
  }

  public Page<JsonNode> findPage(PageRequest request) {
    var query = Query.from("moderation_actions")
        .select("*")
        .orderBy("created_at", Query.Direction.DESCENDING)
        .page(request);
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  public List<JsonNode> findRecent(int limit) {
    var query = Query.from("moderation_actions")
        .select("*")
        .orderBy("created_at", Query.Direction.DESCENDING)
        .limit(limit);
    return Json.rows(supabase.get(query.build()));
  }
}
