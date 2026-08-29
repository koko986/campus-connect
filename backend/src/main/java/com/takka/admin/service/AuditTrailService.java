package com.takka.admin.service;

import com.takka.admin.mapper.AuditMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AuditEntryView;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.repository.AuditRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Records administrator actions and exposes the trail for reading. */
@Service
public class AuditTrailService {
  private final AuditRepository auditRepository;

  public AuditTrailService(AuditRepository auditRepository) {
    this.auditRepository = auditRepository;
  }

  public void record(
      AdminIdentity administrator,
      ModerationAction action,
      UUID targetId,
      String reason,
      UUID reportId,
      JsonNode targetSnapshot) {
    auditRepository.append(administrator, action, targetId, reason, reportId, targetSnapshot);
  }

  public Page<AuditEntryView> entries(PageRequest request) {
    return auditRepository.findPage(request).map(AuditMapper::toView);
  }

  public List<AuditEntryView> recentEntries(int limit) {
    return auditRepository.findRecent(limit).stream().map(AuditMapper::toView).toList();
  }
}
