package com.takka.admin.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

class AdminOverviewServiceTest {
  private final ReportModerationService reports = mock(ReportModerationService.class);
  private final AccountModerationService accounts = mock(AccountModerationService.class);
  private final PostModerationService posts = mock(PostModerationService.class);
  private final UniversityDirectoryService universities = mock(UniversityDirectoryService.class);
  private final AdminOverviewService service =
      new AdminOverviewService(reports, accounts, posts, universities);

  @Test
  void collectsEachHeadlineCountFromItsOwnDomainService() {
    when(reports.openCount()).thenReturn(6L);
    when(accounts.totalMembers()).thenReturn(240L);
    when(accounts.blockedMembers()).thenReturn(9L);
    when(posts.totalPosts()).thenReturn(1_500L);
    when(posts.removedPosts()).thenReturn(35L);
    when(universities.totalUniversities()).thenReturn(48L);
    when(universities.publishedUniversities()).thenReturn(41L);

    var metrics = service.metrics();

    assertEquals(6L, metrics.openReports());
    assertEquals(240L, metrics.members());
    assertEquals(231L, metrics.activeMembers());
    assertEquals(1_465L, metrics.visiblePosts());
    assertEquals(7L, metrics.draftUniversities());
    assertTrue(metrics.hasQueue());
  }

  @Test
  void anIdleInstallationReportsNoQueue() {
    var metrics = service.metrics();

    assertEquals(0L, metrics.openReports());
    assertTrue(!metrics.hasQueue());
  }
}
