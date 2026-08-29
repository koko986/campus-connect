package com.takka.admin.console;

import com.takka.admin.form.UniversityPhotoDecisionForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.service.UniversityPhotoModerationService;
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

/** Administrator queue for campus photographs submitted by verified students. */
@Controller
@RequestMapping("/admin/university-photos")
public class ConsoleUniversityPhotosController {
  private final UniversityPhotoModerationService photos;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleUniversityPhotosController(
      UniversityPhotoModerationService photos, ConsoleLayout layout, ConsoleMessages messages) {
    this.photos = photos;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String queue(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "PENDING") String status,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    String filter =
        UniversityPhotoModerationService.STATUSES.contains(status) ? status : "PENDING";
    layout.apply(model, administrator, ConsoleSection.UNIVERSITIES);
    model.addAttribute("photos", photos.queue(filter, PageRequest.of(page)));
    model.addAttribute("statusFilter", filter);
    model.addAttribute("statuses", UniversityPhotoModerationService.STATUSES);
    model.addAttribute("filterQuery", ConsoleQuery.of("status", filter));
    return "admin/university-photos";
  }

  @PostMapping("/{id}/decision")
  String decide(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute UniversityPhotoDecisionForm form,
      BindingResult binding,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return "redirect:/admin/university-photos";
    }

    photos.decide(administrator, id, form.getDecision(), form.getNote());
    Flash.success(
        attributes,
        messages.get(
            "APPROVED".equals(form.getDecision())
                ? "flash.photo.approved"
                : "flash.photo.rejected"));
    return "redirect:/admin/university-photos";
  }
}
