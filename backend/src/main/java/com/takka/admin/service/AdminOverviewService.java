package com.takka.admin.service;

import com.takka.admin.model.OverviewMetrics;
import org.springframework.stereotype.Service;

/** Collects the headline counts for the console landing page. */
@Service
public class AdminOverviewService {
  private final ReportModerationService reportModeration;
  private final AccountModerationService accountModeration;
  private final PostModerationService postModeration;
  private final UniversityDirectoryService universityDirectory;
  private final OpportunityModerationService opportunityModeration;

  public AdminOverviewService(
      ReportModerationService reportModeration,
      AccountModerationService accountModeration,
      PostModerationService postModeration,
      UniversityDirectoryService universityDirectory,
      OpportunityModerationService opportunityModeration) {
    this.reportModeration = reportModeration;
    this.accountModeration = accountModeration;
    this.postModeration = postModeration;
    this.universityDirectory = universityDirectory;
    this.opportunityModeration = opportunityModeration;
  }

  public OverviewMetrics metrics() {
    return new OverviewMetrics(
        reportModeration.openCount(),
        opportunityModeration.pendingCount(),
        accountModeration.totalMembers(),
        accountModeration.blockedMembers(),
        postModeration.totalPosts(),
        postModeration.removedPosts(),
        universityDirectory.totalUniversities(),
        universityDirectory.publishedUniversities());
  }
}
