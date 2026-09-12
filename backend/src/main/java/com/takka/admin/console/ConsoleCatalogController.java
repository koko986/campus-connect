package com.takka.admin.console;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/** Legacy catalog URLs are hidden for the presentation build and return to the admin overview. */
@Controller
@RequestMapping("/admin/catalog")
public class ConsoleCatalogController {
  @RequestMapping({"", "/**"})
  String redirectToOverview() {
    return "redirect:" + ConsoleSection.OVERVIEW.href();
  }
}
