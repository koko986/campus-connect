package com.takka.admin.console;

import com.takka.admin.form.ReportDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.ReportStatus;
import com.takka.admin.service.ReportModerationService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** The report queue and the decisions applied to it. */
@Controller
@RequestMapping("/admin/reports")
public class ConsoleReportsController {
  private static final Logger log = LoggerFactory.getLogger(ConsoleReportsController.class);

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
      @RequestParam(defaultValue = "") String highlight,
      Model model) {
    Optional<ReportStatus> filter = ReportStatus.parse(status);
    PageRequest request = PageRequest.of(page);
    String statusFilter = filter.map(Enum::name).orElse("");

    layout.apply(model, administrator, ConsoleSection.REPORTS);
    try {
      model.addAttribute("reports", reports.queue(filter, request));
    } catch (RuntimeException unavailable) {
      model.addAttribute("reports", Page.empty(request));
      model.addAttribute("flashError", messages.get("error.reports.unavailable"));
    }
    model.addAttribute("statusFilter", statusFilter);
    model.addAttribute("statuses", ReportStatus.values());
    model.addAttribute("decisions", ReportStatus.decisions());
    model.addAttribute("filterQuery", ConsoleQuery.of("status", statusFilter));
    model.addAttribute("currentPage", request.page());
    model.addAttribute("highlight", highlight);
    return "admin/reports";
  }

  @PostMapping("/{id}/decision")
  String decide(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ReportDecisionForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String returnStatus,
      @RequestParam(defaultValue = "0") int returnPage,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return redirect(returnStatus, returnPage);
    }

    try {
      ReportStatus applied = reports.decide(administrator, id, form);
      Flash.success(attributes, messages.get(applied.decidedKey()));
    } catch (MessageException expected) {
      Flash.error(attributes, messages.explain(expected, "error.action.generic"));
    } catch (AccessDeniedException denied) {
      throw denied;
    } catch (RuntimeException unavailable) {
      String reference = AdminActionDiagnostics.log(log, "POST /admin/reports/{id}/decision", administrator, id, unavailable);
      Flash.error(attributes, messages.get("error.reports.actionUnavailable", reference));
    }
    return redirect(returnStatus, returnPage);
  }

  /** Rebuilt from the parsed filter so only a known status name reaches the location header. */
  private static String redirect(String status, int page) {
    String pageParameter = page > 0 ? (ReportStatus.parse(status).isPresent() ? "&page=" : "?page=") + page : "";
    return ReportStatus.parse(status)
        .map(value -> "redirect:/admin/reports?status=" + value.name() + pageParameter)
        .orElse("redirect:/admin/reports" + pageParameter);
  }
}
