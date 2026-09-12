package com.takka.account;

import com.takka.admin.repository.AdminUserRepository;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/account")
public class AccountController {
  private final SupabaseGateway supabase;
  private final AdminUserRepository administrators;

  public AccountController(SupabaseGateway supabase, AdminUserRepository administrators) {
    this.supabase = supabase;
    this.administrators = administrators;
  }

  @GetMapping("/status")
  Map<String, Object> status(@AuthenticationPrincipal TakkaPrincipal principal) {
    var response = new LinkedHashMap<String, Object>();
    JsonNode values = supabase.get(
        "account_moderation?select=status,reason,blocked_at&user_id=eq." + principal.id() + "&limit=1");
    JsonNode moderation = values.isArray() && !values.isEmpty() ? values.get(0) : null;
    response.put("status", moderation == null ? "ACTIVE" : moderation.path("status").asString("ACTIVE"));
    response.put("reason", moderation == null ? "" : moderation.path("reason").asString(""));
    response.put("blockedAt", moderation == null ? "" : moderation.path("blocked_at").asString(""));

    var role = administrators.findActiveRole(principal);
    response.put("administrator", role.isPresent());
    role.ifPresent(value -> response.put("adminRole", value.name()));
    return response;
  }
}
