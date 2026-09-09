package com.takka.supabase;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

/** Relays public Supabase HTTP APIs around regional blocks without exposing server credentials. */
@RestController
public class SupabaseProxyController {
  private static final String PREFIX = "/api/supabase/";
  private static final Set<String> REQUEST_HEADERS = Set.of(
      "accept", "accept-profile", "apikey", "authorization", "content-profile", "content-type",
      "idempotency-key", "prefer", "range", "x-client-info");
  private static final Set<String> RESPONSE_HEADERS = Set.of(
      "cache-control", "content-disposition", "content-language", "content-range", "content-type",
      "etag", "expires", "last-modified", "location", "range", "x-supabase-api-version");

  private final RestClient client;
  private final String supabaseUrl;

  @Autowired
  public SupabaseProxyController(@Value("${takka.supabase.url}") String supabaseUrl) {
    this(supabaseUrl, configuredClient(RestClient.builder()));
  }

  SupabaseProxyController(String supabaseUrl, RestClient client) {
    this.supabaseUrl = supabaseUrl.replaceAll("/$", "");
    this.client = client;
  }

  private static RestClient configuredClient(RestClient.Builder builder) {
    var requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(10_000);
    requestFactory.setReadTimeout(20_000);
    return builder.requestFactory(requestFactory).build();
  }

  @RequestMapping("/api/supabase/**")
  ResponseEntity<byte[]> proxy(HttpServletRequest incoming,
      @RequestBody(required = false) byte[] body) {
    String path = incoming.getRequestURI().substring(PREFIX.length());
    if (!path.matches("^(auth|rest|storage|functions)/v1(?:/.*)?$")) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new byte[0]);
    }

    String query = incoming.getQueryString();
    URI target = URI.create(supabaseUrl + "/" + path + (query == null ? "" : "?" + query));
    HttpHeaders outgoingHeaders = new HttpHeaders();
    incoming.getHeaderNames().asIterator().forEachRemaining(name -> {
      if (REQUEST_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
        incoming.getHeaders(name).asIterator().forEachRemaining(
            value -> outgoingHeaders.add(name, value));
      }
    });
    var request = client.method(HttpMethod.valueOf(incoming.getMethod()))
        .uri(target)
        .headers(headers -> headers.addAll(outgoingHeaders));
    if (body != null && body.length > 0) request.body(body);
    return request.exchange((sent, upstream) -> {
      HttpHeaders responseHeaders = new HttpHeaders();
      upstream.getHeaders().forEach((name, values) -> {
        if (RESPONSE_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
          responseHeaders.put(name, values);
        }
      });
      try {
        return ResponseEntity.status(upstream.getStatusCode())
            .headers(responseHeaders)
            .body(upstream.getBody().readAllBytes());
      } catch (IOException error) {
        throw new IllegalStateException("Unable to read the account service response", error);
      }
    });
  }
}
