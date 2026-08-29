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

  public AdminLoginController(AdminSessionService sessions) {
    this.sessions = sessions;
  }

  @GetMapping("/login")
  String loginPage(HttpServletRequest request, Model model) {
    if (sessions.read(request).isPresent()) return "redirect:" + ConsoleSection.OVERVIEW.href();
    if (!model.containsAttribute("form")) model.addAttribute("form", new AdminLoginForm());
    return "admin/login";
  }

  @PostMapping("/login")
  String signIn(
      @Valid @ModelAttribute("form") AdminLoginForm form,
      BindingResult binding,
      HttpServletRequest request,
      Model model) {
    if (binding.hasErrors()) return rejected(model, Flash.firstMessage(binding));

    try {
      AdminIdentity identity = sessions.signIn(form);
      sessions.begin(request, identity);
      return "redirect:" + ConsoleSection.OVERVIEW.href();
    } catch (AdminSignInException rejected) {
      return rejected(model, rejected.getMessage());
    }
  }

  @PostMapping("/logout")
  String signOut(HttpServletRequest request) {
    sessions.end(request);
    return "redirect:/admin/login?signedOut";
  }

  @GetMapping("/forbidden")
  String forbidden(Model model) {
    model.addAttribute("errorTitle", "Not permitted");
    model.addAttribute("errorDetail", "Your administrator role does not allow that action.");
    return "admin/error";
  }

  private static String rejected(Model model, String message) {
    model.addAttribute("signInError", message);
    return "admin/login";
  }
}
