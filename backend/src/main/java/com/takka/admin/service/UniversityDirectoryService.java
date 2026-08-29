package com.takka.admin.service;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.form.UniversityForm;
import com.takka.admin.mapper.UniversityMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.UniversityOption;
import com.takka.admin.model.UniversityStateChange;
import com.takka.admin.model.UniversityView;
import com.takka.admin.repository.UniversityRepository;
import com.takka.admin.support.Json;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** University directory reads plus super-admin writes and visibility changes. */
@Service
public class UniversityDirectoryService {
  private static final String DIRECTORY_REASON = "University catalog update";

  private final UniversityRepository universityRepository;
  private final AuditTrailService auditTrail;

  public UniversityDirectoryService(UniversityRepository universityRepository, AuditTrailService auditTrail) {
    this.universityRepository = universityRepository;
    this.auditTrail = auditTrail;
  }

  public Page<UniversityView> directory(PageRequest request) {
    return universityRepository.findPage(request).map(UniversityMapper::toView);
  }

  public List<UniversityOption> options() {
    return universityRepository.findAllForSelection().stream().map(UniversityMapper::toOption).toList();
  }

  public UniversityForm editForm(UUID universityId) {
    return UniversityMapper.toForm(universityRepository.requireById(universityId));
  }

  public String nameOf(UUID universityId) {
    return Json.text(universityRepository.requireById(universityId), "name");
  }

  public long totalUniversities() {
    return universityRepository.countAll();
  }

  public long publishedUniversities() {
    return universityRepository.countPublished();
  }

  public UUID create(AdminIdentity administrator, UniversityForm form) {
    AdminAccess.requireSuperAdmin(administrator);
    JsonNode saved = universityRepository.insert(form.toAttributes());
    UUID id = Json.uuid(saved, "id");
    auditTrail.record(administrator, ModerationAction.CREATE_UNIVERSITY, id, DIRECTORY_REASON, null, saved);
    return id;
  }

  public UUID update(AdminIdentity administrator, UUID universityId, UniversityForm form) {
    AdminAccess.requireSuperAdmin(administrator);
    JsonNode saved = universityRepository.update(universityId, form.toAttributes());
    auditTrail.record(
        administrator, ModerationAction.UPDATE_UNIVERSITY, universityId, DIRECTORY_REASON, null, saved);
    return universityId;
  }

  /** Publishes, unpublishes, or archives a university and records the reason given. */
  public String changeState(
      AdminIdentity administrator, UUID universityId, UniversityStateChange change, ModerationReasonForm form) {
    AdminAccess.requireSuperAdmin(administrator);
    JsonNode university = universityRepository.requireStateById(universityId);

    universityRepository.applyState(universityId, attributesFor(change, administrator));
    auditTrail.record(
        administrator, change.auditAction(), universityId, form.getReason(), form.getReportId(), university);
    return Json.text(university, "name");
  }

  private static Map<String, Object> attributesFor(UniversityStateChange change, AdminIdentity administrator) {
    var attributes = new HashMap<String, Object>();
    switch (change) {
      case PUBLISH -> {
        attributes.put("is_published", true);
        // Publishing also lifts an archive so a restored record becomes visible again.
        attributes.put("archived_at", null);
        attributes.put("archived_by", null);
      }
      case UNPUBLISH -> attributes.put("is_published", false);
      case ARCHIVE -> {
        attributes.put("is_published", false);
        attributes.put("archived_at", Instant.now().toString());
        attributes.put("archived_by", administrator.userId());
      }
    }
    attributes.put("updated_at", Instant.now().toString());
    return attributes;
  }
}
