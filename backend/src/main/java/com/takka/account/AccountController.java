package com.takka.account;

import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
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

  public AccountController(SupabaseGateway supabase) { this.supabase = supabase; }

  @GetMapping("/status")
  Map<String, Object> status(@AuthenticationPrincipal TakkaPrincipal principal) {
    JsonNode values = supabase.get("account_moderation?select=status,reason,blocked_at&user_id=eq." + principal.id() + "&limit=1");
    if (!values.isArray() || values.isEmpty()) return Map.of("status", "ACTIVE");
    JsonNode moderation = values.get(0);
    return Map.of(
        "status", moderation.path("status").asText("ACTIVE"),
        "reason", moderation.path("reason").asText(""),
        "blockedAt", moderation.path("blocked_at").asText(""));
  }
}
