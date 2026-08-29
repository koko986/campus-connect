package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.AdminOverviewService;
import com.takka.admin.service.AuditTrailService;
import com.takka.admin.service.ReportModerationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/** Console landing page: headline counts, the stalest reports, and the latest audited actions. */
@Controller
public class ConsoleOverviewController {
  private static final int QUEUE_PREVIEW = 5;
  private static final int AUDIT_PREVIEW = 8;

  private final AdminOverviewService overview;
  private final ReportModerationService reports;
  private final AuditTrailService auditTrail;
  private final ConsoleLayout layout;

  public ConsoleOverviewController(
      AdminOverviewService overview,
      ReportModerationService reports,
      AuditTrailService auditTrail,
      ConsoleLayout layout) {
    this.overview = overview;
    this.reports = reports;
    this.auditTrail = auditTrail;
    this.layout = layout;
  }

  @GetMapping("/admin")
  String overview(@AuthenticationPrincipal AdminIdentity administrator, Model model) {
    layout.apply(model, administrator, ConsoleSection.OVERVIEW);
    model.addAttribute("metrics", overview.metrics());
    model.addAttribute("queue", reports.oldestUnresolved(QUEUE_PREVIEW));
    model.addAttribute("recentActions", auditTrail.recentEntries(AUDIT_PREVIEW));
    return "admin/overview";
  }
}
