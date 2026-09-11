package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.OpportunityRepository;
import com.takka.admin.support.MessageException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OpportunityModerationServiceTest {
  private final OpportunityRepository opportunities = mock(OpportunityRepository.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final OpportunityModerationService service =
      new OpportunityModerationService(opportunities, auditTrail);
  private final UUID opportunityId = UUID.fromString("11111111-1111-4111-8111-111111111111");

  @Test
  void approvalPublishesAndRecordsTheDecision() {
    when(opportunities.decide(eq(opportunityId), eq("published"), any(), eq("Source checked")))
        .thenReturn(
            Optional.of(
                json("{\"id\":\"%s\",\"title\":\"Scholarship\"}".formatted(opportunityId))));

    service.decide(moderator(), opportunityId, "published", "Source checked");

    verify(auditTrail).record(any(), eq(ModerationAction.APPROVE_OPPORTUNITY),
        eq(opportunityId), eq("Source checked"), eq(null), any());
  }

  @Test
  void unsupportedDecisionNeverWrites() {
    assertThrows(MessageException.class,
        () -> service.decide(moderator(), opportunityId, "archived", ""));
    verify(opportunities, never()).decide(any(), any(), any(), any());
  }

  @Test
  void pendingCountComesFromTheModerationQueue() {
    when(opportunities.statusCounts()).thenReturn(Map.of("pending", 4L, "published", 9L));

    assertEquals(4L, service.pendingCount());
  }
}
