package com.takka.admin.console;

import com.takka.admin.form.MemberDeleteForm;
import com.takka.admin.form.ModerationReasonForm;
import com.takka.admin.model.AccountStatus;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.MemberFilter;
import com.takka.admin.service.AccountModerationService;
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

/** Member accounts: search, block, unblock, and super-admin deletion. */
@Controller
@RequestMapping("/admin/members")
public class ConsoleMembersController {
  private final AccountModerationService accounts;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public ConsoleMembersController(
      AccountModerationService accounts, ConsoleLayout layout, ConsoleMessages messages) {
    this.accounts = accounts;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping
  String members(
      @AuthenticationPrincipal AdminIdentity administrator,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      @RequestParam(defaultValue = "0") int page,
      Model model) {
    MemberFilter filter = MemberFilter.of(search, status);

    layout.apply(model, administrator, ConsoleSection.ACCOUNTS);
    model.addAttribute("members", accounts.members(filter, PageRequest.of(page)));
    model.addAttribute("filter", filter);
    model.addAttribute("statuses", AccountStatus.values());
    model.addAttribute("filterQuery", filterQuery(filter));
    return "admin/members";
  }

  @PostMapping("/{id}/block")
  String block(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, search, status);

    String member = accounts.block(administrator, id, form);
    Flash.success(attributes, messages.get("flash.member.blocked", member));
    return redirect(search, status);
  }

  @PostMapping("/{id}/unblock")
  String unblock(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute ModerationReasonForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, search, status);

    String member = accounts.unblock(administrator, id, form);
    Flash.success(attributes, messages.get("flash.member.unblocked", member));
    return redirect(search, status);
  }

  @PostMapping("/{id}/delete")
  String delete(
      @AuthenticationPrincipal AdminIdentity administrator,
      @PathVariable UUID id,
      @Valid @ModelAttribute MemberDeleteForm form,
      BindingResult binding,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "") String status,
      RedirectAttributes attributes) {
    if (binding.hasErrors()) return rejected(binding, attributes, search, status);

    String email = accounts.delete(administrator, id, form);
    Flash.success(attributes, messages.get("flash.member.deleted", email));
    return redirect(search, status);
  }

  private String rejected(
      BindingResult binding, RedirectAttributes attributes, String search, String status) {
    Flash.error(attributes, messages.invalidSubmission(binding));
    return redirect(search, status);
  }

  /**
   * Returns to the accounts list with the administrator's filter intact. The query string is rebuilt
   * from parsed and re-encoded values rather than echoed back, so nothing user-supplied lands in the
   * location header verbatim.
   */
  private static String redirect(String search, String status) {
    String query = filterQuery(MemberFilter.of(search, status));
    return query.isEmpty() ? "redirect:/admin/members" : "redirect:/admin/members?" + query;
  }

  private static String filterQuery(MemberFilter filter) {
    return ConsoleQuery.of("search", filter.search(), "status", filter.statusValue());
  }
}
