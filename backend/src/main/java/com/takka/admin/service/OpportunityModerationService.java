package com.takka.admin.service;

import com.takka.admin.mapper.OpportunityMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.OpportunityView;
import com.takka.admin.repository.OpportunityRepository;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Queue, decisions, notifications and audit history for student opportunity submissions. */
@Service
public class OpportunityModerationService {
  public static final List<String> STATUSES = List.of("pending", "published", "rejected", "closed", "archived", "all");

  private final OpportunityRepository opportunities;
  private final AuditTrailService auditTrail;

  public OpportunityModerationService(OpportunityRepository opportunities, AuditTrailService auditTrail) {
    this.opportunities = opportunities;
    this.auditTrail = auditTrail;
  }

  public Page<OpportunityView> queue(String status, PageRequest request) {
    String filter = STATUSES.contains(status) ? status : "pending";
    return opportunities.findPage(filter, request).map(OpportunityMapper::toView);
  }

  public Map<String, Long> statusCounts() {
    return opportunities.statusCounts();
  }

  public void decide(AdminIdentity administrator, UUID id, String decision, String note) {
    AdminAccess.requireAdministrator(administrator);
    if (!List.of("published", "rejected").contains(decision)) {
      throw new MessageException("error.opportunity.invalidDecision");
    }
    var updated = opportunities.decide(id, decision, administrator.userId(), note)
        .orElseThrow(() -> new MessageException("error.opportunity.notFound"));
    var action = "published".equals(decision)
        ? ModerationAction.APPROVE_OPPORTUNITY
        : ModerationAction.REJECT_OPPORTUNITY;
    var reason = note == null || note.isBlank()
        ? ("published".equals(decision) ? "Approved opportunity" : "Rejected opportunity")
        : note.trim();
    auditTrail.record(administrator, action, id, reason, null, updated);
  }
}
