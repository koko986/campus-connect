package com.takka.reports;

import tools.jackson.databind.JsonNode;
import com.takka.reports.ReportService.ReportRequest;
import com.takka.security.TakkaPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportService service;

  public ReportController(ReportService service) { this.service = service; }

  @PostMapping
  JsonNode submit(@AuthenticationPrincipal TakkaPrincipal principal, @RequestBody ReportRequest request) {
    return service.submit(principal, request);
  }
}
