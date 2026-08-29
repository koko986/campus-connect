package com.takka.admin.service;

import com.takka.admin.form.ReportDecisionForm;
import com.takka.admin.mapper.ReportMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.model.ReportView;
import com.takka.admin.repository.ReportRepository;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Report queue reads and decisions. */
@Service
public class ReportModerationService {
  private final ReportRepository reportRepository;
  private final AuditTrailService auditTrail;

  public ReportModerationService(ReportRepository reportRepository, AuditTrailService auditTrail) {
    this.reportRepository = reportRepository;
    this.auditTrail = auditTrail;
  }

  public Page<ReportView> queue(Optional<ReportStatus> status, PageRequest request) {
    return reportRepository.findPage(status, request).map(ReportMapper::toView);
  }

  public List<ReportView> oldestUnresolved(int limit) {
    return reportRepository.findOldestUnresolved(limit).stream().map(ReportMapper::toView).toList();
  }

  public long openCount() {
    return reportRepository.countByStatus(ReportStatus.awaitingAttention());
  }

  /**
   * Applies a decision to one report. Closing decisions are audited; moving a report to
   * {@code REVIEWING} only claims it, so it produces no audit entry.
   */
  public ReportStatus decide(AdminIdentity administrator, UUID reportId, ReportDecisionForm form) {
    AdminAccess.requireAdministrator(administrator);
    ReportStatus status = ReportStatus.require(form.getStatus());

    JsonNode updated = reportRepository
        .applyDecision(reportId, status, administrator.userId(), form.getNotes())
        .orElseThrow(() -> new MessageException("error.report.notFound"));

    if (status.isClosed()) {
      ModerationAction action =
          status == ReportStatus.RESOLVED ? ModerationAction.RESOLVE_REPORT : ModerationAction.DISMISS_REPORT;
      auditTrail.record(administrator, action, reportId, form.getNotes(), reportId, updated.path("target_snapshot"));
    }
    return status;
  }

  /**
   * Closes the report that prompted a moderation action, so the queue entry does not linger after
   * the account or post has already been dealt with.
   */
  public void closeLinkedReport(AdminIdentity administrator, Optional<UUID> reportId, String reason) {
    reportId.ifPresent(id -> reportRepository.resolveAlongsideAction(id, administrator.userId(), reason));
  }
}
