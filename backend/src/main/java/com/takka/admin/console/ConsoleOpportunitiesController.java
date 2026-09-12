package com.takka.admin.console;

import com.takka.admin.form.OpportunityDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.OpportunityModerationService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
import java.util.Map;
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

/** Administrator queue for scholarships, internships, events and other opportunities. */
@Controller
@RequestMapping("/admin/opportunities")
public class ConsoleOpportunitiesController {
  private final OpportunityModerationService opportunities;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleOpportunitiesController(OpportunityModerationService opportunities, ConsoleLayout layout, ConsoleMessages messages) {
    this.opportunities = opportunities;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String queue(@AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "pending") String status,
      @RequestParam(defaultValue = "0") int page, Model model) {
    String filter = OpportunityModerationService.STATUSES.contains(status) ? status : "pending";
    PageRequest request = PageRequest.of(page);
    layout.apply(model, administrator, ConsoleSection.OPPORTUNITIES);
    try {
      model.addAttribute("opportunities", opportunities.queue(filter, request));
    } catch (RuntimeException unavailable) {
      model.addAttribute("opportunities", Page.empty(request));
      model.addAttribute("flashError", messages.get("error.opportunities.unavailable"));
    }
    try {
      model.addAttribute("counts", opportunities.statusCounts());
    } catch (RuntimeException unavailable) {
      model.addAttribute("counts", Map.of());
      model.addAttribute("flashError", messages.get("error.opportunities.unavailable"));
    }
    model.addAttribute("statusFilter", filter);
    model.addAttribute("statuses", OpportunityModerationService.STATUSES);
    model.addAttribute("filterQuery", ConsoleQuery.of("status", filter));
    return "admin/opportunities";
  }

  @PostMapping("/{id}/decision")
  String decide(@AuthenticationPrincipal AdminIdentity administrator, @PathVariable UUID id,
      @Valid @ModelAttribute OpportunityDecisionForm form, BindingResult binding,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return "redirect:/admin/opportunities";
    }
    try {
      opportunities.decide(administrator, id, form.getDecision(), form.getNote());
      Flash.success(attributes, messages.get("published".equals(form.getDecision())
          ? "flash.opportunity.approved" : "flash.opportunity.rejected"));
    } catch (MessageException expected) {
      Flash.error(attributes, messages.get(expected.getMessage()));
    } catch (RuntimeException unavailable) {
      Flash.error(attributes, messages.get("error.opportunities.actionUnavailable"));
    }
    return "redirect:/admin/opportunities";
  }
}
