package com.takka.admin.console;

import com.takka.admin.form.CatalogItemForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.service.CatalogService;
import com.takka.admin.service.UniversityDirectoryService;
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

/**
 * Curates campuses, departments, and programs under one university. This area previously existed
 * only as an API with no interface.
 */
@Controller
@RequestMapping("/admin/catalog")
public class ConsoleCatalogController {
  private final CatalogService catalog;
  private final UniversityDirectoryService universities;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleCatalogController(
      CatalogService catalog,
      UniversityDirectoryService universities,
      ConsoleLayout layout,
      ConsoleMessages messages) {
    this.catalog = catalog;
    this.universities = universities;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String catalog(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(required = false) UUID universityId,
      @RequestParam(defaultValue = "campuses") String resource,
      @RequestParam(required = false) UUID edit,
      Model model) {
    CatalogResource selected = CatalogResource.require(resource);
    CatalogItemForm form = edit == null
        ? blankForm(universityId)
        : catalog.editForm(selected, edit, universityId);

    layout.apply(model, administrator, ConsoleSection.CATALOG);
    model.addAttribute("resources", CatalogResource.values());
    model.addAttribute("resource", selected);
    model.addAttribute("universities", universities.options());
    model.addAttribute("universityId", universityId);
    model.addAttribute("items", catalog.items(selected, universityId));
    model.addAttribute("departments", catalog.departmentOptions(universityId));
    model.addAttribute("form", form);
    return "admin/catalog";
  }

  @PostMapping("/{resource}")
  String save(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable String resource,
      @Valid @ModelAttribute("form") CatalogItemForm form,
      BindingResult binding,
      RedirectAttributes attributes) {
    CatalogResource selected = CatalogResource.require(resource);
    if (binding.hasErrors()) {
      Flash.error(attributes, messages.invalidSubmission(binding));
      return redirect(selected, form.getUniversityId());
    }

    boolean editing = form.isEditing();
    String name = catalog.save(administrator, selected, form);
    Flash.success(attributes, messages.get(editing ? "flash.catalog.updated" : "flash.catalog.added", name));
    return redirect(selected, form.getUniversityId());
  }

  private static CatalogItemForm blankForm(UUID universityId) {
    var form = new CatalogItemForm();
    form.setUniversityId(universityId);
    return form;
  }

  private static String redirect(CatalogResource resource, UUID universityId) {
    String base = "redirect:/admin/catalog?resource=" + resource.slug();
    return universityId == null ? base : base + "&universityId=" + universityId;
  }
}
