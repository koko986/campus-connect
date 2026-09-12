package com.takka.admin.repository;

import static com.takka.admin.Fixtures.emptyRows;
import static com.takka.admin.Fixtures.json;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.support.PageRequest;
import com.takka.supabase.SupabaseGateway;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OpportunityRepositoryTest {
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final OpportunityRepository repository = new OpportunityRepository(supabase);
  private final UUID opportunityId = UUID.fromString("11111111-1111-4111-8111-111111111111");

  @Test
  void pageFallsBackWhenRelationshipEmbedsAreUnavailable() {
    when(supabase.get(contains("universities!opportunities_university_id_fkey")))
        .thenThrow(new IllegalStateException("relationship missing"));
    when(supabase.get(contains("select=id,title,organization"))).thenReturn(emptyRows());

    var page = repository.findPage("pending", PageRequest.of(0));

    assertTrue(page.isEmpty());
    verify(supabase).get(contains("select=id,title,organization"));
  }

  @Test
  void decisionFallsBackWhenRelationshipEmbedsAreUnavailable() {
    when(supabase.patch(contains("universities!opportunities_university_id_fkey"), org.mockito.ArgumentMatchers.any(), eq("return=representation")))
        .thenThrow(new IllegalStateException("relationship missing"));
    when(supabase.patch(contains("select=id,title,organization"), org.mockito.ArgumentMatchers.any(), eq("return=representation")))
        .thenReturn(json("""
            [{ "id": "%s", "title": "Scholarship", "status": "published" }]
            """.formatted(opportunityId)));

    var updated = repository.decide(opportunityId, "published", UUID.randomUUID(), "Source checked");

    assertEquals(opportunityId, UUID.fromString(updated.orElseThrow().path("id").asString()));
    verify(supabase).patch(
        contains("select=id,title,organization"), org.mockito.ArgumentMatchers.any(), eq("return=representation"));
  }
}
