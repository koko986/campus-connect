package com.takka.admin.repository;

import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import com.takka.admin.support.Query;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

/** Reads and updates community posts for moderation. */
@Repository
public class PostRepository {
  private static final String POST_SELECT =
      "id,body,created_at,moderation_status,removal_reason,removed_at,author_id,profiles(full_name,email)";
  private static final String SNAPSHOT_SELECT = "id,body,author_id,moderation_status";

  private final SupabaseGateway supabase;

  public PostRepository(SupabaseGateway supabase) {
    this.supabase = supabase;
  }

  public Page<JsonNode> findPage(Optional<PostModerationStatus> status, PageRequest request) {
    var query = Query.from("posts")
        .select(POST_SELECT)
        .orderBy("created_at", Query.Direction.DESCENDING)
        .page(request);
    status.ifPresent(value -> query.eq("moderation_status", value));
    return Page.ofLookahead(Json.rows(supabase.get(query.build())), request);
  }

  public JsonNode requireById(UUID postId) {
    var query = Query.from("posts").select(SNAPSHOT_SELECT).eq("id", postId).limit(1);
    return Json.requireFirstRow(supabase.get(query.build()), "Post not found");
  }

  public void applyModeration(UUID postId, PostModerationStatus status, String reason, UUID administratorId) {
    boolean removed = status == PostModerationStatus.REMOVED;
    var attributes = new HashMap<String, Object>();
    attributes.put("moderation_status", status.name());
    attributes.put("removed_at", removed ? Instant.now().toString() : null);
    attributes.put("removed_by", removed ? administratorId : null);
    attributes.put("removal_reason", removed ? reason : null);
    attributes.put("updated_at", Instant.now().toString());

    var query = Query.from("posts").eq("id", postId);
    supabase.patch(query.build(), attributes, null);
  }

  public long countAll() {
    return Json.requireArray(supabase.get(Query.from("posts").select("id").build())).size();
  }

  public long countWithStatus(PostModerationStatus status) {
    var query = Query.from("posts").select("moderation_status");
    return Json.countMatching(supabase.get(query.build()), "moderation_status", status.name());
  }
}
