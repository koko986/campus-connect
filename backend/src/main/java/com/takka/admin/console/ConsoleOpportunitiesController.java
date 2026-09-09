package com.takka.admin.console;

import com.takka.admin.form.OpportunityDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.OpportunityModerationService;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
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
    layout.apply(model, administrator, ConsoleSection.OPPORTUNITIES);
    model.addAttribute("opportunities", opportunities.queue(filter, PageRequest.of(page)));
    model.addAttribute("counts", opportunities.statusCounts());
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
    opportunities.decide(administrator, id, form.getDecision(), form.getNote());
    Flash.success(attributes, messages.get("published".equals(form.getDecision())
        ? "flash.opportunity.approved" : "flash.opportunity.rejected"));
    return "redirect:/admin/opportunities";
  }
}
