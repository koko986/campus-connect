package com.takka.admin.repository;

import com.takka.admin.model.ReportStatus;
import com.takka.admin.model.ReportTargetType;
import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and updates the {@code reports} queue. */
@Repository
public class ReportRepository {
  private static final String RETURN_ROW = "return=representation";
  private final SupabaseGateway supabase;

  public ReportRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Page<JsonNode> findPage(Optional<ReportStatus> status, PageRequest request) {
    var query = Query.from("reports")
        .select("*")
        .orderBy("created_at", Query.Direction.DESCENDING)
        .page(request);
    status.ifPresent(value -> query.eq("status", value));
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  /** The oldest still-open reports, surfaced on the overview page. */
  public List<JsonNode> findOldestUnresolved(int limit) {
    var query = Query.from("reports")
        .select("*")
        .in("status", ReportStatus.awaitingAttention())
        .orderBy("created_at", Query.Direction.ASCENDING)
        .limit(limit);
    return Json.rows(supabase.get(query.build()));
  }

  public Optional<JsonNode> findById(UUID reportId) {
    var query = Query.from("reports").select("*").eq("id", reportId).limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public long countByStatus(Collection<ReportStatus> statuses) {
    var query = Query.from("reports").select("status");
    JsonNode rows = supabase.get(query.build());
    return Json.rows(rows).stream()
        .map(row -> ReportStatus.parse(Json.text(row, "status")))
        .filter(Optional::isPresent)
        .map(Optional::get)
        .filter(statuses::contains)
        .count();
  }

  /** Number of reports filed against each post, keyed by post id. */
  public Map<UUID, Integer> countByReportedPost() {
    var query = Query.from("reports").select("target_id").eq("target_type", ReportTargetType.POST);
    var counts = new HashMap<UUID, Integer>();
    for (JsonNode row : Json.rows(supabase.get(query.build()))) {
      Json.optionalUuid(row, "target_id").ifPresent(id -> counts.merge(id, 1, Integer::sum));
    }
    return counts;
  }

  /** Applies a decision and returns the stored row, or empty when the report no longer exists. */
  public Optional<JsonNode> applyDecision(UUID reportId, ReportStatus status, UUID administratorId, String notes) {
    Instant now = Instant.now();
    var attributes = new HashMap<String, Object>();
    attributes.put("status", status.name());
    attributes.put("assigned_to", administratorId);
    attributes.put("resolution_notes", notes);
    attributes.put("updated_at", now.toString());
    attributes.put("resolved_at", status.isClosed() ? now.toString() : null);

    var query = Query.from("reports").select("*").eq("id", reportId);
    return Json.firstRow(supabase.patch(query.build(), attributes, RETURN_ROW));
  }

  /** Closes a report as resolved because a moderation action dealt with its target. */
  public void resolveAlongsideAction(UUID reportId, UUID administratorId, String notes) {
    applyDecision(reportId, ReportStatus.RESOLVED, administratorId, notes);
  }
}
