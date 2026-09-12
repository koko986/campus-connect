package com.takka.admin.console;

import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.form.UniversityForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.UniversityStateChange;
import com.takka.admin.service.UniversityDirectoryService;
import com.takka.admin.support.MessageException;
import com.takka.admin.support.Page;
import com.takka.admin.support.PageRequest;
import jakarta.validation.Valid;
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

/**
 * The university directory. Reading is open to both roles; creating, editing, and changing
 * visibility are super-admin actions enforced in {@link UniversityDirectoryService}.
 */
@Controller
@RequestMapping("/admin/universities")
public class ConsoleUniversitiesController {
  private static final String LIST = "redirect:/admin/universities";

  private final UniversityDirectoryService universities;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleUniversitiesController(
      UniversityDirectoryService universities, ConsoleLayout layout, ConsoleMessages messages) {
    this.universities = universities;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String directory(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    PageRequest request = PageRequest.of(page);
    layout.apply(model, administrator, ConsoleSection.UNIVERSITIES);
    try {
      model.addAttribute("universities", universities.directory(request));
    } catch (RuntimeException unavailable) {
      model.addAttribute("universities", Page.empty(request));
      model.addAttribute("flashError", messages.get("error.universities.unavailable"));
    }
    model.addAttribute("filterQuery", "");
    return "admin/universities";
  }

  @GetMapping("/new")
  String createForm(@AuthenticationPrincipal AdminIdentity administrator, Model model) {
    prepareForm(model, administrator, new UniversityForm(), null);
    return "admin/university-form";
  }

  @GetMapping("/{id}/edit")
  String editForm(
      @AuthenticationPrincipal AdminIdentity administrator, @PathVariable UUID id, Model model) {
    prepareForm(model, administrator, universities.editForm(id), id);
    return "admin/university-form";
  }

  @PostMapping
  String create(
      @AuthenticationPrincipal AdminIdentity administrator,
      @Valid @ModelAttribute("form") UniversityForm form,
      BindingResult binding,
      Model model,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      prepareForm(model, administrator, form, null);
      return "admin/university-form";
    }

    try {
      universities.create(administrator, form);
      Flash.success(attributes, messages.get("flash.university.created", form.getName()));
      return LIST;
    } catch (MessageException expected) {
      model.addAttribute("flashError", messages.explain(expected, "error.action.generic"));
    } catch (AccessDeniedException denied) {
      throw denied;
    } catch (RuntimeException unavailable) {
      model.addAttribute("flashError", messages.get("error.universities.actionUnavailable"));
    }
    prepareForm(model, administrator, form, null);
    return "admin/university-form";
  }

  @PostMapping("/{id}")
  String update(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute("form") UniversityForm form,
      BindingResult binding,
      Model model,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      prepareForm(model, administrator, form, id);
      return "admin/university-form";
    }

    try {
      universities.update(administrator, id, form);
      Flash.success(attributes, messages.get("flash.university.updated", form.getName()));
      return LIST;
    } catch (MessageException expected) {
      model.addAttribute("flashError", messages.explain(expected, "error.action.generic"));
    } catch (AccessDeniedException denied) {
      throw denied;
    } catch (RuntimeException unavailable) {
      model.addAttribute("flashError", messages.get("error.universities.actionUnavailable"));
    }
    prepareForm(model, administrator, form, id);
    return "admin/university-form";
  }

  @PostMapping("/{id}/state/{change}")
  String changeState(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @PathVariable String change,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return LIST;
    }

    try {
      UniversityStateChange requested = UniversityStateChange.require(change);
      String name = universities.changeState(administrator, id, requested, form);
      Flash.success(attributes, messages.get(requested.appliedKey(), name));
    } catch (MessageException expected) {
      Flash.error(attributes, messages.explain(expected, "error.action.generic"));
    } catch (AccessDeniedException denied) {
      throw denied;
    } catch (RuntimeException unavailable) {
      Flash.error(attributes, messages.get("error.universities.actionUnavailable"));
    }
    return LIST;
  }

  private void prepareForm(Model model, AdminIdentity administrator, UniversityForm form, UUID id) {
    layout.apply(model, administrator, ConsoleSection.UNIVERSITIES);
    model.addAttribute("form", form);
    model.addAttribute("universityId", id);
    model.addAttribute("editing", id != null);
    model.addAttribute("types", UniversityForm.TYPES);
  }
}
