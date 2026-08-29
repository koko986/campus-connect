package com.takka.admin.repository;

import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and writes the university directory. */
@Repository
public class UniversityRepository {
  private static final String RETURN_ROW = "return=representation";
  private static final String DIRECTORY_SELECT =
      "*,campuses(count),departments(count),programs(count)";
  private static final String STATE_SELECT = "id,name,is_published,archived_at";

  private final SupabaseGateway supabase;

  public UniversityRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Page<JsonNode> findPage(PageRequest request) {
    var query = Query.from("universities")
        .select(DIRECTORY_SELECT)
        .orderBy("name", Query.Direction.ASCENDING)
        .page(request);
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  public Optional<JsonNode> findById(UUID universityId) {
    var query = Query.from("universities").select("*").eq("id", universityId).limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public JsonNode requireById(UUID universityId) {
    return findById(universityId).orElseThrow(() -> new IllegalArgumentException("University not found"));
  }

  public JsonNode requireStateById(UUID universityId) {
    var query = Query.from("universities").select(STATE_SELECT).eq("id", universityId).limit(1);
    return Json.requireFirstRow(supabase.get(query.build()), "University not found");
  }

  /** Every university, newest naming first, for the catalog page selector. */
  public List<JsonNode> findAllForSelection() {
    var query = Query.from("universities")
        .select("id,name,short_name")
        .orderBy("name", Query.Direction.ASCENDING);
    return Json.rows(supabase.get(query.build()));
  }

  public JsonNode insert(Map<String, Object> attributes) {
    var query = Query.from("universities").select("*");
    return Json.requireFirstRow(supabase.post(query.build(), attributes, RETURN_ROW), "University was not saved");
  }

  public JsonNode update(UUID universityId, Map<String, Object> attributes) {
    var query = Query.from("universities").select("*").eq("id", universityId);
    return Json.requireFirstRow(supabase.patch(query.build(), attributes, RETURN_ROW), "University was not saved");
  }

  public void applyState(UUID universityId, Map<String, Object> attributes) {
    var query = Query.from("universities").eq("id", universityId);
    supabase.patch(query.build(), attributes, null);
  }

  public long countAll() {
    return Json.requireArray(supabase.get(Query.from("universities").select("id").build())).size();
  }

  public long countPublished() {
    var query = Query.from("universities").select("is_published,archived_at");
    return Json.rows(supabase.get(query.build())).stream()
        .filter(row -> Json.bool(row, "is_published"))
        .filter(row -> Json.optionalInstant(row, "archived_at").isEmpty())
        .count();
  }
}
