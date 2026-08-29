package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.superAdmin;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.AuditRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AuditTrailServiceTest {
  private final AuditRepository repository = mock(AuditRepository.class);
  private final AuditTrailService service = new AuditTrailService(repository);

  private final UUID entryId = UUID.randomUUID();

  private tools.jackson.databind.JsonNode entry() {
    return json("""
        {"id":"%s","admin_email":"super@takka.test","action":"REMOVE_POST","target_type":"POST",
         "target_id":"%s","reason":"Spam","report_id":null,"created_at":"2026-08-21T11:30:00Z",
         "target_snapshot":{"body":"Buy followers"}}
        """.formatted(entryId, entryId));
  }

  @Test
  void recordingAnActionDelegatesToTheAppendOnlyRepository() {
    var administrator = superAdmin();
    var targetId = UUID.randomUUID();
    var snapshot = json("{\"full_name\":\"Ada\"}");

    service.record(administrator, ModerationAction.BLOCK_USER, targetId, "Harassment", null, snapshot);

    verify(repository)
        .append(eq(administrator), eq(ModerationAction.BLOCK_USER), eq(targetId), eq("Harassment"), eq(null), any());
  }

  @Test
  void entriesArePagedAndMapped() {
    var request = PageRequest.of(0, 50);
    when(repository.findPage(request)).thenReturn(new Page<>(List.of(entry()), 0, 50, true));

    var page = service.entries(request);

    assertEquals("Removed post", page.items().get(0).actionLabel());
    assertEquals("Buy followers", page.items().get(0).targetLabel());
    assertEquals(true, page.hasNext());
  }

  @Test
  void recentEntriesAreMappedForTheOverview() {
    when(repository.findRecent(8)).thenReturn(List.of(entry()));

    assertEquals(1, service.recentEntries(8).size());
    assertEquals("danger", service.recentEntries(8).get(0).actionTone());
  }
}
