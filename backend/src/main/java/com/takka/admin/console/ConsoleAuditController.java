package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.AuditTrailService;
import com.takka.admin.support.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/** Read-only view of the immutable moderation audit trail. */
@Controller
@RequestMapping("/admin/audit")
public class ConsoleAuditController {
  private static final int PAGE_SIZE = 50;

  private final AuditTrailService auditTrail;
  private final ConsoleLayout layout;

  public ConsoleAuditController(AuditTrailService auditTrail, ConsoleLayout layout) {
    this.auditTrail = auditTrail;
    this.layout = layout;
  }

  @GetMapping
  String auditLog(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    layout.apply(model, administrator, ConsoleSection.AUDIT);
    model.addAttribute("entries", auditTrail.entries(PageRequest.of(page, PAGE_SIZE)));
    model.addAttribute("filterQuery", "");
    return "admin/audit";
  }
}
