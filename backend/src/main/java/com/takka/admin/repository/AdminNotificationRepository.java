package com.takka.admin.repository;

import com.takka.admin.support.Json;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and updates notification rows for the server-rendered admin console. */
@Repository
public class AdminNotificationRepository {
  private static final String SELECT = "id,body,entity_type,entity_id,read_at,created_at";
  private static final String RETURN_ROW = "return=representation";

  private final SupabaseGateway supabase;

  public AdminNotificationRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public List<JsonNode> recent(UUID userId, int limit) {
    var query = Query.from("notifications")
        .select(SELECT)
        .eq("user_id", userId)
        .orderBy("created_at", Query.Direction.DESCENDING)
        .limit(limit);
    return Json.rows(supabase.get(query.build()));
  }

  public long unreadCount(UUID userId) {
    var query = Query.from("notifications").select("id").eq("user_id", userId).isNull("read_at");
    return Json.rows(supabase.get(query.build())).size();
  }

  public Optional<JsonNode> findForUser(UUID notificationId, UUID userId) {
    var query = Query.from("notifications")
        .select(SELECT)
        .eq("id", notificationId)
        .eq("user_id", userId)
        .limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public void markRead(UUID notificationId, UUID userId) {
    var attributes = new HashMap<String, Object>();
    attributes.put("read_at", Instant.now().toString());
    var query = Query.from("notifications").select("id").eq("id", notificationId).eq("user_id", userId);
    supabase.patch(query.build(), attributes, RETURN_ROW);
  }
}
