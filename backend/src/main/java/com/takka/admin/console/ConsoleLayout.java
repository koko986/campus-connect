package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;

/** Adds the shared shell attributes that every console page renders. */
@Component
public class ConsoleLayout {
  public void apply(Model model, AdminIdentity administrator, ConsoleSection section) {
    model.addAttribute("administrator", administrator);
    model.addAttribute("navigation", ConsoleSection.navigationFor(administrator));
    model.addAttribute("section", section);
    model.addAttribute("pageTitle", section.title());
    model.addAttribute("superAdmin", administrator != null && administrator.isSuperAdmin());
  }
}
