package com.takka.admin.service;

import com.takka.admin.model.OverviewMetrics;
import java.util.function.LongSupplier;
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
        safeCount(reportModeration::openCount),
        safeCount(opportunityModeration::pendingCount),
        safeCount(accountModeration::totalMembers),
        safeCount(accountModeration::blockedMembers),
        safeCount(postModeration::totalPosts),
        safeCount(postModeration::removedPosts),
        safeCount(universityDirectory::totalUniversities),
        safeCount(universityDirectory::publishedUniversities));
  }

  private static long safeCount(LongSupplier count) {
    try {
      return count.getAsLong();
    } catch (RuntimeException unavailable) {
      return 0;
    }
  }
}
