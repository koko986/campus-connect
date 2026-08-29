package com.takka.admin.service;

import static com.takka.admin.Fixtures.json;
import static com.takka.admin.Fixtures.moderator;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.ModerationAction;
import com.takka.admin.model.PostModerationStatus;
import com.takka.admin.repository.PostRepository;
import com.takka.admin.repository.ReportRepository;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

class PostModerationServiceTest {
  private final PostRepository posts = mock(PostRepository.class);
  private final ReportRepository reports = mock(ReportRepository.class);
  private final ReportModerationService reportModeration = mock(ReportModerationService.class);
  private final AuditTrailService auditTrail = mock(AuditTrailService.class);
  private final PostModerationService service =
      new PostModerationService(posts, reports, reportModeration, auditTrail);

  private final UUID postId = UUID.randomUUID();

  private JsonNode post(String status) {
    return json("{\"id\":\"" + postId + "\",\"body\":\"Hello campus\",\"moderation_status\":\"" + status + "\"}");
  }

  private ModerationReasonForm reason(String text) {
    var form = new ModerationReasonForm();
    form.setReason(text);
    return form;
  }

  @Test
  void removingAPostRecordsTheReasonAgainstTheSnapshot() {
    when(posts.requireById(postId)).thenReturn(post("PUBLISHED"));

    service.remove(moderator(), postId, reason("Spam link"));

    verify(posts).applyModeration(eq(postId), eq(PostModerationStatus.REMOVED), eq("Spam link"), any());
    verify(auditTrail).record(any(), eq(ModerationAction.REMOVE_POST), eq(postId), eq("Spam link"), any(), any());
  }

  @Test
  void restoringAPostPublishesItAgain() {
    when(posts.requireById(postId)).thenReturn(post("REMOVED"));

    service.restore(moderator(), postId, reason("Removed by mistake"));

    verify(posts).applyModeration(eq(postId), eq(PostModerationStatus.PUBLISHED), any(), any());
    verify(auditTrail).record(any(), eq(ModerationAction.RESTORE_POST), eq(postId), any(), any(), any());
  }

  @Test
  void removingAPostClosesTheReportThatPromptedIt() {
    when(posts.requireById(postId)).thenReturn(post("PUBLISHED"));
    var reportId = UUID.randomUUID();
    var form = reason("Spam link");
    form.setReportId(reportId);

    service.remove(moderator(), postId, form);

    verify(reportModeration).closeLinkedReport(any(), eq(Optional.of(reportId)), eq("Spam link"));
  }

  @Test
  void restoringAPostDoesNotCloseAnyReport() {
    when(posts.requireById(postId)).thenReturn(post("REMOVED"));

    service.restore(moderator(), postId, reason("Appeal accepted"));

    verify(reportModeration, never()).closeLinkedReport(any(), any(), any());
  }

  @Test
  void listingPostsFoldsInTheReportTally() {
    var request = PageRequest.of(0, 25);
    when(reports.countByReportedPost()).thenReturn(Map.of(postId, 2));
    when(posts.findPage(Optional.of(PostModerationStatus.PUBLISHED), request))
        .thenReturn(new Page<>(List.of(post("PUBLISHED")), 0, 25, false));

    var page = service.posts(Optional.of(PostModerationStatus.PUBLISHED), request);

    assertEquals(1, page.items().size());
    assertEquals(2, page.items().get(0).reportCount());
    assertTrue(page.items().get(0).isReported());
  }

  @Test
  void countsComeFromTheRepository() {
    when(posts.countAll()).thenReturn(310L);
    when(posts.countWithStatus(PostModerationStatus.REMOVED)).thenReturn(12L);

    assertEquals(310L, service.totalPosts());
    assertEquals(12L, service.removedPosts());
  }
}
