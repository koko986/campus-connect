package com.takka.admin.console;

import com.takka.admin.form.AdminLoginForm;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.session.AdminSessionService;
import com.takka.admin.session.AdminSignInException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Console sign-in. Credentials are checked against Supabase Auth and then against the
 * {@code admin_users} table, so a valid member password alone does not open the console.
 */
@Controller
@RequestMapping("/admin")
public class AdminLoginController {
  private final AdminSessionService sessions;
  private final ConsoleLayout layout;
  private final ConsoleMessages messages;

  public AdminLoginController(
      AdminSessionService sessions, ConsoleLayout layout, ConsoleMessages messages) {
    this.sessions = sessions;
    this.layout = layout;
    this.messages = messages;
  }

  @GetMapping("/login")
  String loginPage(HttpServletRequest request, Model model) {
    if (sessions.read(request).isPresent()) return "redirect:" + ConsoleSection.OVERVIEW.href();
    if (!model.containsAttribute("form")) model.addAttribute("form", new AdminLoginForm());
    layout.applyLanguage(model);
    return "admin/login";
  }

  @PostMapping("/login")
  String signIn(
      @Valid @ModelAttribute("form") AdminLoginForm form,
      BindingResult binding,
      HttpServletRequest request,
      Model model) {
    if (binding.hasErrors()) return rejected(model, messages.invalidSubmission(binding));

    try {
      AdminIdentity identity = sessions.signIn(form);
      sessions.begin(request, identity);
      return "redirect:" + ConsoleSection.OVERVIEW.href();
    } catch (AdminSignInException refused) {
      return rejected(model, messages.explain(refused, "error.signIn.rejected"));
    }
  }

  @PostMapping("/logout")
  String signOut(HttpServletRequest request) {
    sessions.end(request);
    return "redirect:/admin/login?signedOut";
  }

  @GetMapping("/forbidden")
  String forbidden(Model model) {
    model.addAttribute("errorTitle", messages.get("error.forbidden.title"));
    model.addAttribute("errorDetail", messages.get("error.forbidden.detail"));
    layout.applyLanguage(model);
    return "admin/error";
  }

  private String rejected(Model model, String message) {
    model.addAttribute("signInError", message);
    layout.applyLanguage(model);
    return "admin/login";
  }
}
