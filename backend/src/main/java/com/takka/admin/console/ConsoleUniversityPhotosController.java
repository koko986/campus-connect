package com.takka.admin.console;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/** Legacy photo moderation URLs are hidden for the presentation build. */
@Controller
@RequestMapping("/admin/university-photos")
public class ConsoleUniversityPhotosController {
  @GetMapping
  String queue() {
    return "redirect:" + ConsoleSection.UNIVERSITIES.href();
  }

  @PostMapping("/**")
  String decide() {
    return "redirect:" + ConsoleSection.UNIVERSITIES.href();
  }
}
