package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.AuditEntryView;
import com.takka.admin.model.OverviewMetrics;
import com.takka.admin.model.ReportView;
import com.takka.admin.service.AdminOverviewService;
import com.takka.admin.service.AuditTrailService;
import com.takka.admin.service.ReportModerationService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/** Console landing page: headline counts, the stalest reports, and the latest audited actions. */
@Controller
public class ConsoleOverviewController {
  private static final int QUEUE_PREVIEW = 5;
  private static final int AUDIT_PREVIEW = 8;
  private static final List<ResponsibilityCard> RESPONSIBILITIES = List.of(
      new ResponsibilityCard(
          "page.overview.responsibility.verify.title",
          "page.overview.responsibility.verify.text",
          ConsoleSection.ACCOUNTS.href()),
      new ResponsibilityCard(
          "page.overview.responsibility.reports.title",
          "page.overview.responsibility.reports.text",
          ConsoleSection.REPORTS.href()),
      new ResponsibilityCard(
          "page.overview.responsibility.posts.title",
          "page.overview.responsibility.posts.text",
          ConsoleSection.POSTS.href()),
      new ResponsibilityCard(
          "page.overview.responsibility.opportunities.title",
          "page.overview.responsibility.opportunities.text",
          ConsoleSection.OPPORTUNITIES.href()),
      new ResponsibilityCard(
          "page.overview.responsibility.universities.title",
          "page.overview.responsibility.universities.text",
          ConsoleSection.UNIVERSITIES.href()));

  private final AdminOverviewService overview;
  private final ReportModerationService reports;
  private final AuditTrailService auditTrail;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleOverviewController(
      AdminOverviewService overview,
      ReportModerationService reports,
      AuditTrailService auditTrail,
      ConsoleLayout layout,
      ConsoleMessages messages) {
    this.overview = overview;
    this.reports = reports;
    this.auditTrail = auditTrail;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping("/admin")
  String overview(@AuthenticationPrincipal AdminIdentity administrator, Model model) {
    layout.apply(model, administrator, ConsoleSection.OVERVIEW);
    boolean partial = false;

    OverviewMetrics metrics = OverviewMetrics.empty();
    try {
      metrics = overview.metrics();
    } catch (RuntimeException unavailable) {
      partial = true;
    }

    List<ReportView> queue = List.of();
    try {
      queue = reports.oldestUnresolved(QUEUE_PREVIEW);
    } catch (RuntimeException unavailable) {
      partial = true;
    }

    List<AuditEntryView> recentActions = List.of();
    try {
      recentActions = auditTrail.recentEntries(AUDIT_PREVIEW);
    } catch (RuntimeException unavailable) {
      partial = true;
    }

    model.addAttribute("metrics", metrics);
    model.addAttribute("queue", queue);
    model.addAttribute("recentActions", recentActions);
    model.addAttribute("responsibilities", RESPONSIBILITIES);
    if (partial) model.addAttribute("flashError", messages.get("error.overview.partial"));
    return "admin/overview";
  }

  @GetMapping("/admin/dashboard")
  String dashboardAlias() {
    return "redirect:" + ConsoleSection.OVERVIEW.href();
  }

  public record ResponsibilityCard(String titleKey, String textKey, String href) {}
}
