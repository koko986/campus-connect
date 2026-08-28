package com.takka.admin;

import tools.jackson.databind.JsonNode;
import com.takka.admin.AdminService.ActionRequest;
import com.takka.admin.AdminService.ReportUpdate;
import com.takka.admin.AdminService.UniversityRequest;
import com.takka.security.TakkaPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final AdminService service;

  public AdminController(AdminService service) { this.service = service; }

  @GetMapping("/me")
  Map<String, Object> me(@AuthenticationPrincipal TakkaPrincipal principal) { return service.me(principal); }

  @GetMapping("/overview")
  Map<String, Object> overview(@AuthenticationPrincipal TakkaPrincipal principal) { return service.overview(principal); }

  @GetMapping("/reports")
  JsonNode reports(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size) {
    return service.reports(principal, status, page, size);
  }

  @PatchMapping("/reports/{id}")
  JsonNode updateReport(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ReportUpdate request) { return service.updateReport(principal, id, request); }

  @GetMapping("/members")
  JsonNode members(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size) {
    return service.members(principal, search, status, page, size);
  }

  @PostMapping("/members/{id}/block")
  void block(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ActionRequest request) { service.block(principal, id, request); }

  @PostMapping("/members/{id}/unblock")
  void unblock(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ActionRequest request) { service.unblock(principal, id, request); }

  @DeleteMapping("/members/{id}")
  void delete(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ActionRequest request) { service.deleteMember(principal, id, request); }

  @GetMapping("/posts")
  JsonNode posts(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size) {
    return service.posts(principal, status, page, size);
  }

  @PostMapping("/posts/{id}/remove")
  void removePost(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ActionRequest request) { service.moderatePost(principal, id, request, false); }

  @PostMapping("/posts/{id}/restore")
  void restorePost(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody ActionRequest request) { service.moderatePost(principal, id, request, true); }

  @GetMapping("/audit-log")
  JsonNode audit(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) { return service.auditLog(principal, page, size); }

  @GetMapping("/universities")
  JsonNode universities(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "50") int size) { return service.universities(principal, page, size); }

  @PostMapping("/universities")
  JsonNode createUniversity(@AuthenticationPrincipal TakkaPrincipal principal,
      @RequestBody UniversityRequest request) { return service.saveUniversity(principal, null, request); }

  @PutMapping("/universities/{id}")
  JsonNode updateUniversity(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @RequestBody UniversityRequest request) { return service.saveUniversity(principal, id, request); }

  @PostMapping("/universities/{id}/{operation:publish|unpublish|archive}")
  void universityState(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable UUID id,
      @PathVariable String operation, @RequestBody ActionRequest request) {
    service.setUniversityState(principal, id, operation, request);
  }

  @GetMapping("/catalog/{resource:campuses|departments|programs}")
  JsonNode catalog(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable String resource,
      @RequestParam(required = false) UUID universityId) {
    return service.catalog(principal, resource, universityId);
  }

  @PostMapping("/catalog/{resource:campuses|departments|programs}")
  JsonNode createCatalog(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable String resource,
      @RequestBody Map<String, Object> body) { return service.saveCatalog(principal, resource, null, body); }

  @PutMapping("/catalog/{resource:campuses|departments|programs}/{id}")
  JsonNode updateCatalog(@AuthenticationPrincipal TakkaPrincipal principal, @PathVariable String resource,
      @PathVariable UUID id, @RequestBody Map<String, Object> body) {
    return service.saveCatalog(principal, resource, id, body);
  }
}
