package com.takka.reports;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
  private static final List<String> TARGETS = List.of("ACCOUNT", "POST");
  private static final List<String> REASONS = List.of("SPAM", "HARASSMENT", "IMPERSONATION", "MISINFORMATION", "INAPPROPRIATE", "OTHER");
  private final SupabaseGateway supabase;

  public ReportService(SupabaseGateway supabase) { this.supabase = supabase; }

  public JsonNode submit(TakkaPrincipal principal, ReportRequest request) {
    ensureActive(principal.id());
    String targetType = normalize(request.targetType(), TARGETS);
    String reason = normalize(request.reason(), REASONS);
    if (request.details() != null && !request.details().isBlank() && request.details().trim().length() < 10) {
      throw new IllegalArgumentException("Report details must contain at least 10 characters");
    }
    Instant since = Instant.now().minus(1, ChronoUnit.HOURS);
    ArrayNode recent = array(supabase.get("reports?select=id&reporter_id=eq." + principal.id()
        + "&created_at=gte." + SupabaseGateway.encode(since.toString())));
    if (recent.size() >= 10) throw new IllegalArgumentException("Report limit reached. Please try again later.");

    JsonNode snapshot = switch (targetType) {
      case "ACCOUNT" -> accountSnapshot(principal, request.targetId());
      case "POST" -> target("posts?select=id,body,author_id,created_at&id=eq." + request.targetId());
      default -> throw new IllegalArgumentException("Unsupported report target");
    };
    var body = new HashMap<String, Object>();
    body.put("reporter_id", principal.id());
    body.put("target_type", targetType);
    body.put("target_id", request.targetId());
    body.put("reason", reason);
    body.put("details", request.details() == null || request.details().isBlank() ? null : request.details().trim());
    body.put("target_snapshot", snapshot);
    JsonNode result = supabase.post("reports?select=*", body, "return=representation");
    return array(result).get(0);
  }

  private JsonNode accountSnapshot(TakkaPrincipal principal, UUID targetId) {
    if (principal.id().equals(targetId)) throw new IllegalArgumentException("You cannot report your own account");
    return target("profiles?select=id,full_name,account_type&id=eq." + targetId);
  }

  private JsonNode target(String query) {
    ArrayNode values = array(supabase.get(query));
    if (values.isEmpty()) throw new IllegalArgumentException("Report target not found");
    return values.get(0);
  }

  private void ensureActive(UUID userId) {
    ArrayNode profile = array(supabase.get("profiles?select=id&id=eq." + userId));
    ArrayNode status = array(supabase.get("account_moderation?select=status&user_id=eq." + userId));
    if (profile.isEmpty() || (!status.isEmpty() && "BLOCKED".equals(status.get(0).path("status").asText()))) {
      throw new IllegalArgumentException("This account cannot submit reports");
    }
  }

  private static String normalize(String value, List<String> allowed) {
    String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    if (!allowed.contains(normalized)) throw new IllegalArgumentException("Invalid report value");
    return normalized;
  }

  private static ArrayNode array(JsonNode value) {
    if (!value.isArray()) throw new IllegalStateException("Unexpected Supabase response");
    return (ArrayNode) value;
  }

  public record ReportRequest(String targetType, UUID targetId, String reason, String details) {}
}
