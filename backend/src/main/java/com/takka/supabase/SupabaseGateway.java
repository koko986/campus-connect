package com.takka.supabase;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.takka.security.TakkaPrincipal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class SupabaseGateway {
  private final RestClient client;
  private final ObjectMapper mapper;
  private final String url;
  private final String publishableKey;
  private final String secretKey;

  public SupabaseGateway(
      ObjectMapper mapper,
      @Value("${takka.supabase.url}") String url,
      @Value("${takka.supabase.publishable-key}") String publishableKey,
      @Value("${takka.supabase.secret-key}") String secretKey) {
    this.client = RestClient.builder().requestFactory(new SimpleClientHttpRequestFactory()).build();
    this.mapper = mapper;
    this.url = url.replaceAll("/$", "");
    this.publishableKey = publishableKey;
    this.secretKey = secretKey;
  }

  public TakkaPrincipal authenticate(String token) {
    requireKey(publishableKey, "SUPABASE_PUBLISHABLE_KEY");
    JsonNode user = client.get()
        .uri(url + "/auth/v1/user")
        .header("apikey", publishableKey)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        .retrieve()
        .body(JsonNode.class);
    if (user == null || !user.hasNonNull("id")) throw new IllegalArgumentException("Invalid session");
    return new TakkaPrincipal(UUID.fromString(user.get("id").asText()), user.path("email").asText(""), token);
  }

  /**
   * Exchanges email and password for a Supabase session. The console needs this because a
   * server-rendered page has no browser SDK to obtain an access token for it.
   */
  public TakkaPrincipal signInWithPassword(String email, String password) {
    requireKey(publishableKey, "SUPABASE_PUBLISHABLE_KEY");
    JsonNode session = client.post()
        .uri(url + "/auth/v1/token?grant_type=password")
        .header("apikey", publishableKey)
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .body(Map.of("email", email, "password", password))
        .retrieve()
        .body(JsonNode.class);
    if (session == null || !session.hasNonNull("access_token")) {
      throw new IllegalArgumentException("Invalid email or password");
    }
    JsonNode user = session.path("user");
    if (!user.hasNonNull("id")) throw new IllegalArgumentException("Invalid email or password");
    return new TakkaPrincipal(
        UUID.fromString(user.get("id").asText()),
        user.path("email").asText(""),
        session.get("access_token").asText());
  }

  public JsonNode get(String resourceAndQuery) {
    return request(HttpMethod.GET, resourceAndQuery, null, null);
  }

  public JsonNode post(String resourceAndQuery, Object body, String prefer) {
    return request(HttpMethod.POST, resourceAndQuery, body, prefer);
  }

  public JsonNode patch(String resourceAndQuery, Object body, String prefer) {
    return request(HttpMethod.PATCH, resourceAndQuery, body, prefer);
  }

  public void delete(String resourceAndQuery) {
    request(HttpMethod.DELETE, resourceAndQuery, null, null);
  }

  public void updateAuthUser(UUID userId, Map<String, Object> attributes) {
    authAdmin(HttpMethod.PUT, "/admin/users/" + userId, attributes);
  }

  public void deleteAuthUser(UUID userId) {
    authAdmin(HttpMethod.DELETE, "/admin/users/" + userId, null);
  }

  public JsonNode object(Object value) {
    return mapper.valueToTree(value);
  }

  public static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  private JsonNode request(HttpMethod method, String resourceAndQuery, Object body, String prefer) {
    requireKey(secretKey, "SUPABASE_SECRET_KEY");
    var request = client.method(method)
        .uri(URI.create(url + "/rest/v1/" + resourceAndQuery))
        .header("apikey", secretKey)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
        .accept(MediaType.APPLICATION_JSON);
    if (prefer != null) request.header("Prefer", prefer);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).body(body);
    JsonNode response = request.retrieve().body(JsonNode.class);
    return response == null ? mapper.createArrayNode() : response;
  }

  private void authAdmin(HttpMethod method, String path, Object body) {
    requireKey(secretKey, "SUPABASE_SECRET_KEY");
    var request = client.method(method)
        .uri(url + "/auth/v1" + path)
        .header("apikey", secretKey)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
        .accept(MediaType.APPLICATION_JSON);
    if (body != null) request.contentType(MediaType.APPLICATION_JSON).body(body);
    request.retrieve().toBodilessEntity();
  }

  private static void requireKey(String value, String name) {
    if (value == null || value.isBlank()) throw new IllegalStateException(name + " is not configured on the Java backend");
  }
}
