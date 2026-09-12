package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import java.util.List;

/**
 * The console's own navigation. This is the only menu an administrator sees: none of the student
 * app's pages appear here, and the console has no link back into a member account.
 */
public enum ConsoleSection {
  OVERVIEW("/admin", "overview"),
  REPORTS("/admin/reports", "reports"),
  ACCOUNTS("/admin/members", "accounts"),
  POSTS("/admin/posts", "posts"),
  UNIVERSITIES("/admin/universities", "universities"),
  OPPORTUNITIES("/admin/opportunities", "opportunities"),
  CATALOG("/admin/catalog", "catalog"),
  AUDIT("/admin/audit", "audit");

  private final String href;
  private final String slug;

  ConsoleSection(String href, String slug) {
    this.href = href;
    this.slug = slug;
  }

  public String href() {
    return href;
  }

  /** Short name shown in the sidebar. */
  public String labelKey() {
    return "console.nav." + slug();
  }

  /** Longer heading shown at the top of the page. */
  public String titleKey() {
    return "console.title." + slug();
  }

  private String slug() {
    return slug;
  }

  /** Sections available to an administrator; every visible section is readable by both roles. */
  public static List<ConsoleSection> navigationFor(AdminIdentity administrator) {
    return administrator == null
        ? List.of()
        : List.of(OVERVIEW, REPORTS, ACCOUNTS, POSTS, UNIVERSITIES, OPPORTUNITIES);
  }
}
