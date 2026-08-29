package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import java.util.Arrays;
import java.util.List;

/**
 * The console's own navigation. This is the only menu an administrator sees: none of the student
 * app's pages appear here, and the console has no link back into a member account.
 */
public enum ConsoleSection {
  OVERVIEW("Overview", "/admin", "Console overview"),
  REPORTS("Reports", "/admin/reports", "Report queue"),
  ACCOUNTS("Accounts", "/admin/members", "Member accounts"),
  POSTS("Posts", "/admin/posts", "Post moderation"),
  UNIVERSITIES("Universities", "/admin/universities", "University directory"),
  CATALOG("Catalog", "/admin/catalog", "Campuses, departments, and programs"),
  AUDIT("Audit log", "/admin/audit", "Moderation audit trail");

  private final String label;
  private final String href;
  private final String title;

  ConsoleSection(String label, String href, String title) {
    this.label = label;
    this.href = href;
    this.title = title;
  }

  public String label() {
    return label;
  }

  public String href() {
    return href;
  }

  public String title() {
    return title;
  }

  /** Sections available to an administrator; every section is readable by both roles. */
  public static List<ConsoleSection> navigationFor(AdminIdentity administrator) {
    return administrator == null ? List.of() : Arrays.asList(values());
  }
}
