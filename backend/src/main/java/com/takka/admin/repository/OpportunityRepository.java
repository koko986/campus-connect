package com.takka.admin.repository;

import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and decides student opportunity submissions through the service-role gateway. */
@Repository
public class OpportunityRepository {
  private static final String SELECT =
      "*,university:universities!opportunities_university_id_fkey(name),"
          + "submitter:profiles!opportunities_created_by_fkey(full_name)";

  private final SupabaseGateway supabase;

  public OpportunityRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Page<JsonNode> findPage(String status, PageRequest request) {
    var query = Query.from("opportunities").select(SELECT).orderBy("created_at", Query.Direction.ASCENDING).page(request);
    if (status != null && !status.isBlank() && !"all".equals(status)) query.eq("status", status);
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  public Map<String, Long> statusCounts() {
    var counts = new HashMap<String, Long>();
    Json.rows(supabase.get("opportunities?select=status"))
        .forEach(row -> counts.merge(Json.text(row, "status"), 1L, Long::sum));
    return counts;
  }

  public Optional<JsonNode> decide(UUID id, String status, UUID administratorId, String note) {
    var attributes = new HashMap<String, Object>();
    attributes.put("status", status);
    attributes.put("reviewed_at", Instant.now().toString());
    attributes.put("reviewed_by", administratorId);
    attributes.put("review_note", note == null || note.isBlank() ? null : note.trim());
    attributes.put("updated_at", Instant.now().toString());
    var query = Query.from("opportunities").select(SELECT).eq("id", id).eq("status", "pending");
    return Json.firstRow(supabase.patch(query.build(), attributes, "return=representation"));
  }
}
