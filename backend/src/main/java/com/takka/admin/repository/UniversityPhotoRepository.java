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

/** Reads and decides the verified-student university photo queue. */
@Repository
public class UniversityPhotoRepository {
  private static final String RETURN_ROW = "return=representation";
  private static final String SELECT =
      "*,university:universities!university_photos_university_id_fkey(name),"
          + "uploader:profiles!university_photos_uploader_id_fkey(full_name)";

  private final SupabaseGateway supabase;

  public UniversityPhotoRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Page<JsonNode> findPage(String status, PageRequest request) {
    var query =
        Query.from("university_photos")
            .select(SELECT)
            .orderBy("created_at", Query.Direction.ASCENDING)
            .page(request);
    if (status != null && !status.isBlank()) query.eq("status", status);
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  public Optional<JsonNode> findById(UUID id) {
    var query = Query.from("university_photos").select(SELECT).eq("id", id).limit(1);
    return Json.firstRow(supabase.get(query.build()));
  }

  public Optional<JsonNode> decide(UUID id, String status, UUID administratorId, String note) {
    var attributes = new HashMap<String, Object>();
    attributes.put("status", status);
    attributes.put("reviewed_at", Instant.now().toString());
    attributes.put("reviewed_by", administratorId);
    attributes.put("review_note", note == null || note.isBlank() ? null : note.trim());
    var query = Query.from("university_photos").select(SELECT).eq("id", id).eq("status", "PENDING");
    return Json.firstRow(supabase.patch(query.build(), attributes, RETURN_ROW));
  }

  public void useAsCoverIfMissing(UUID universityId, String imagePath, String uploaderName) {
    Map<String, Object> attributes =
        Map.of(
            "cover_image_path",
            imagePath,
            "cover_image_credit",
            "Photo submitted by " + uploaderName,
            "cover_image_license",
            "Student contribution",
            "updated_at",
            Instant.now().toString());
    var query = Query.from("universities").eq("id", universityId).isNull("cover_image_path");
    supabase.patch(query.build(), attributes, null);
  }

  public String imageUrl(String path) {
    return supabase.publicStorageUrl("university-media", path);
  }
}
