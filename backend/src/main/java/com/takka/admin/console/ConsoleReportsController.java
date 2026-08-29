package com.takka.admin.console;

import com.takka.admin.form.ReportDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.service.ReportModerationService;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** The report queue and the decisions applied to it. */
@Controller
@RequestMapping("/admin/reports")
public class ConsoleReportsController {
  private final ReportModerationService reports;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleReportsController(
      ReportModerationService reports, ConsoleLayout layout, ConsoleMessages messages) {
    this.reports = reports;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String queue(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    Optional<ReportStatus> filter = ReportStatus.parse(status);

    String statusFilter = filter.map(Enum::name).orElse("");

    layout.apply(model, administrator, ConsoleSection.REPORTS);
    model.addAttribute("reports", reports.queue(filter, PageRequest.of(page)));
    model.addAttribute("statusFilter", statusFilter);
    model.addAttribute("statuses", ReportStatus.values());
    model.addAttribute("decisions", ReportStatus.decisions());
    model.addAttribute("filterQuery", ConsoleQuery.of("status", statusFilter));
    return "admin/reports";
  }

  @PostMapping("/{id}/decision")
  String decide(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ReportDecisionForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return redirect(returnStatus);
    }

    ReportStatus applied = reports.decide(administrator, id, form);
    Flash.success(attributes, messages.get(applied.decidedKey()));
    return redirect(returnStatus);
  }

  /** Rebuilt from the parsed filter so only a known status name reaches the location header. */
  private static String redirect(String status) {
    return ReportStatus.parse(status)
        .map(value -> "redirect:/admin/reports?status=" + value.name())
        .orElse("redirect:/admin/reports");
  }
}
