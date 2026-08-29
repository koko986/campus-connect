package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * The console's own navigation. This is the only menu an administrator sees: none of the student
 * app's pages appear here, and the console has no link back into a member account.
 */
public enum ConsoleSection {
  OVERVIEW("/admin"),
  REPORTS("/admin/reports"),
  ACCOUNTS("/admin/members"),
  POSTS("/admin/posts"),
  UNIVERSITIES("/admin/universities"),
  CATALOG("/admin/catalog"),
  AUDIT("/admin/audit");

  private final String href;

  ConsoleSection(String href) {
    this.href = href;
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
    return name().toLowerCase(Locale.ROOT);
  }

  /** Sections available to an administrator; every section is readable by both roles. */
  public static List<ConsoleSection> navigationFor(AdminIdentity administrator) {
    return administrator == null ? List.of() : Arrays.asList(values());
  }
}
