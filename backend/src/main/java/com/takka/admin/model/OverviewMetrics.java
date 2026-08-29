package com.takka.admin.model;

/** Headline counts shown on the console landing page. */
public record OverviewMetrics(
    long openReports,
    long members,
    long blockedMembers,
    long posts,
    long removedPosts,
    long universities,
    long publishedUniversities) {

  public static OverviewMetrics empty() {
    return new OverviewMetrics(0, 0, 0, 0, 0, 0, 0);
  }

  public boolean hasQueue() {
    return openReports > 0;
  }

  public long draftUniversities() {
    return Math.max(0, universities - publishedUniversities);
  }

  public long activeMembers() {
    return Math.max(0, members - blockedMembers);
  }

  public long visiblePosts() {
    return Math.max(0, posts - removedPosts);
  }
}
