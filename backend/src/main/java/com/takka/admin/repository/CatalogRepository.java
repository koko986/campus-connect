package com.takka.admin.repository;

import com.takka.admin.mapper.CatalogMapper;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.support.Json;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and writes campuses, departments, and programs. */
@Repository
public class CatalogRepository {
  private static final String RETURN_ROW = "return=representation";
  private final SupabaseGateway supabase;

  public CatalogRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public List<JsonNode> findAll(CatalogResource resource, UUID universityId) {
    var query = Query.from(resource.table())
        .select(CatalogMapper.selectFor(resource))
        .orderBy("name", Query.Direction.ASCENDING);
    if (universityId != null) query.eq("university_id", universityId);
    return Json.rows(supabase.get(query.build()));
  }

  public Optional<JsonNode> findById(CatalogResource resource, UUID id) {
    var query = Query.from(resource.table())
        .select(CatalogMapper.selectFor(resource))
        .eq("id", id)
        .limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public JsonNode insert(CatalogResource resource, Map<String, Object> attributes) {
    var query = Query.from(resource.table()).select("*");
    return Json.requireFirstRow(supabase.post(query.build(), attributes, RETURN_ROW), resource.notSavedKey());
  }

  public JsonNode update(CatalogResource resource, UUID id, Map<String, Object> attributes) {
    var query = Query.from(resource.table()).select("*").eq("id", id);
    return Json.requireFirstRow(supabase.patch(query.build(), attributes, RETURN_ROW), resource.notSavedKey());
  }

  /** Departments of one university, used to populate the program form's parent selector. */
  public List<JsonNode> findDepartmentOptions(UUID universityId) {
    return findAll(CatalogResource.DEPARTMENTS, universityId);
  }
}
