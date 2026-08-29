package com.takka.admin.service;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.mapper.PostMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.model.PostView;
import com.takka.admin.repository.PostRepository;
import com.takka.admin.repository.ReportRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

/** Post listing plus removal and restoration. */
@Service
public class PostModerationService {
  private final PostRepository postRepository;
  private final ReportRepository reportRepository;
  private final ReportModerationService reportModeration;
  private final AuditTrailService auditTrail;

  public PostModerationService(
      PostRepository postRepository,
      ReportRepository reportRepository,
      ReportModerationService reportModeration,
      AuditTrailService auditTrail) {
    this.postRepository = postRepository;
    this.reportRepository = reportRepository;
    this.reportModeration = reportModeration;
    this.auditTrail = auditTrail;
  }

  public Page<PostView> posts(Optional<PostModerationStatus> status, PageRequest request) {
    Map<UUID, Integer> reportCounts = reportRepository.countByReportedPost();
    return postRepository.findPage(status, request).map(row -> PostMapper.toView(row, reportCounts));
  }

  public long totalPosts() {
    return postRepository.countAll();
  }

  public long removedPosts() {
    return postRepository.countWithStatus(PostModerationStatus.REMOVED);
  }

  public void remove(AdminIdentity administrator, UUID postId, ModerationReasonForm form) {
    AdminAccess.requireAdministrator(administrator);
    JsonNode post = postRepository.requireById(postId);

    postRepository.applyModeration(postId, PostModerationStatus.REMOVED, form.getReason(), administrator.userId());
    auditTrail.record(
        administrator, ModerationAction.REMOVE_POST, postId, form.getReason(), form.getReportId(), post);
    reportModeration.closeLinkedReport(administrator, form.linkedReport(), form.getReason());
  }

  public void restore(AdminIdentity administrator, UUID postId, ModerationReasonForm form) {
    AdminAccess.requireAdministrator(administrator);
    JsonNode post = postRepository.requireById(postId);

    postRepository.applyModeration(postId, PostModerationStatus.PUBLISHED, form.getReason(), administrator.userId());
    auditTrail.record(
        administrator, ModerationAction.RESTORE_POST, postId, form.getReason(), form.getReportId(), post);
  }
}
