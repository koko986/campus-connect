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

import com.takka.admin.form.ReportDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.repository.ReportRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

class ReportModerationServiceTest {
  private final ReportRepository reportRepository = mock(ReportRepository.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final ReportModerationService service = new ReportModerationService(reportRepository, auditTrail);
  private final AdminIdentity administrator = moderator();
  private final UUID reportId = UUID.randomUUID();

  private ReportDecisionForm form(String status, String notes) {
    var form = new ReportDecisionForm();
    form.setStatus(status);
    form.setNotes(notes);
    return form;
  }

  private JsonNode storedReport(String status) {
    return json("""
        { "id": "%s", "target_type": "ACCOUNT", "target_id": "%s", "reason": "SPAM",
          "status": "%s", "created_at": "2026-08-20T09:00:00Z",
          "target_snapshot": { "full_name": "Ada" } }
        """.formatted(reportId, reportId, status));
  }

  @Test
  void resolvingAReportAuditsTheDecision() {
    when(reportRepository.applyDecision(eq(reportId), eq(ReportStatus.RESOLVED), any(), eq("Handled it")))
        .thenReturn(Optional.of(storedReport("RESOLVED")));

    var applied = service.decide(administrator, reportId, form("RESOLVED", "Handled it"));

    assertEquals(ReportStatus.RESOLVED, applied);
    verify(auditTrail)
        .record(
            eq(administrator),
            eq(ModerationAction.RESOLVE_REPORT),
            eq(reportId),
            eq("Handled it"),
            eq(reportId),
            any());
  }

  @Test
  void dismissingAReportRecordsTheDismissAction() {
    when(reportRepository.applyDecision(eq(reportId), eq(ReportStatus.DISMISSED), any(), any()))
        .thenReturn(Optional.of(storedReport("DISMISSED")));

    service.decide(administrator, reportId, form("dismissed", "Not a violation"));

    verify(auditTrail)
        .record(any(), eq(ModerationAction.DISMISS_REPORT), eq(reportId), any(), eq(reportId), any());
  }

  @Test
  void claimingAReportForReviewIsNotAudited() {
    when(reportRepository.applyDecision(eq(reportId), eq(ReportStatus.REVIEWING), any(), any()))
        .thenReturn(Optional.of(storedReport("REVIEWING")));

    var applied = service.decide(administrator, reportId, form("REVIEWING", "Looking into this"));

    assertEquals(ReportStatus.REVIEWING, applied);
    verify(auditTrail, never()).record(any(), any(), any(), any(), any(), any());
  }

  @Test
  void anUnknownDecisionIsRejectedBeforeTouchingTheDatabase() {
    assertThrows(
        IllegalArgumentException.class, () -> service.decide(administrator, reportId, form("ESCALATE", "why")));

    verify(reportRepository, never()).applyDecision(any(), any(), any(), any());
  }

  @Test
  void aMissingReportIsReportedAsSuch() {
    when(reportRepository.applyDecision(any(), any(), any(), any())).thenReturn(Optional.empty());

    var error = assertThrows(
        IllegalArgumentException.class, () -> service.decide(administrator, reportId, form("RESOLVED", "notes")));

    assertEquals("error.report.notFound", error.getMessage());
  }

  @Test
  void aLinkedReportIsClosedAlongsideTheAction() {
    service.closeLinkedReport(administrator, Optional.of(reportId), "Blocked the account");

    verify(reportRepository).resolveAlongsideAction(reportId, administrator.userId(), "Blocked the account");
  }

  @Test
  void nothingHappensWhenAnActionHasNoLinkedReport() {
    service.closeLinkedReport(administrator, Optional.empty(), "Blocked the account");

    verify(reportRepository, never()).resolveAlongsideAction(any(), any(), any());
  }

  @Test
  void theQueueIsMappedIntoViewRows() {
    var request = PageRequest.of(0, 25);
    when(reportRepository.findPage(Optional.of(ReportStatus.OPEN), request))
        .thenReturn(new Page<>(List.of(storedReport("OPEN")), 0, 25, false));

    var page = service.queue(Optional.of(ReportStatus.OPEN), request);

    assertEquals(1, page.items().size());
    assertEquals("Ada", page.items().get(0).targetLabel());
  }

  @Test
  void theOpenCountUsesTheAwaitingAttentionStatuses() {
    when(reportRepository.countByStatus(ReportStatus.awaitingAttention())).thenReturn(4L);

    assertEquals(4L, service.openCount());
  }

  @Test
  void theOverviewPreviewMapsTheOldestReports() {
    when(reportRepository.findOldestUnresolved(5)).thenReturn(List.of(storedReport("OPEN")));

    assertEquals(1, service.oldestUnresolved(5).size());
  }
}
