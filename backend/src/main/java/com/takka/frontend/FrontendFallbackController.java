package com.takka.frontend;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

/** Serves the member app through Railway when local networks cannot reach *.vercel.app. */
@RestController
public class FrontendFallbackController {
  private static final Set<String> REQUEST_HEADERS = Set.of(
      "accept", "accept-language", "if-modified-since", "if-none-match", "range");
  private static final Set<String> RESPONSE_HEADERS = Set.of(
      "accept-ranges", "cache-control", "content-language", "content-length", "content-range",
      "content-type", "etag", "expires", "last-modified", "location", "vary");

  private final RestClient client;
  private final String upstream;

  @Autowired
  public FrontendFallbackController(
      @Value("${takka.frontend-upstream}") String upstream) {
    this(upstream, configuredClient(RestClient.builder()));
  }

  FrontendFallbackController(String upstream, RestClient client) {
    this.upstream = upstream.replaceAll("/$", "");
    this.client = client;
  }

  private static RestClient configuredClient(RestClient.Builder builder) {
    var requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(10_000);
    requestFactory.setReadTimeout(30_000);
    return builder.requestFactory(requestFactory).build();
  }

  @RequestMapping(
      value = {
          "/", "/login", "/get-started", "/register/**", "/dashboard", "/hub",
          "/universities/**", "/questions", "/questions/**", "/messages", "/notifications", "/saved",
          "/profile", "/profiles/**", "/posts/**", "/settings", "/assets/**", "/favicon.ico",
          "/favicon.svg", "/takka-logo.png", "/robots.txt"
      },
      method = {RequestMethod.GET, RequestMethod.HEAD})
  ResponseEntity<byte[]> serve(HttpServletRequest incoming) {
    String query = incoming.getQueryString();
    URI target = URI.create(upstream + incoming.getRequestURI()
        + (query == null ? "" : "?" + query));
    HttpHeaders outgoingHeaders = new HttpHeaders();
    incoming.getHeaderNames().asIterator().forEachRemaining(name -> {
      if (REQUEST_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
        incoming.getHeaders(name).asIterator().forEachRemaining(
            value -> outgoingHeaders.add(name, value));
      }
    });

    return client.method(HttpMethod.valueOf(incoming.getMethod()))
        .uri(target)
        .headers(headers -> headers.addAll(outgoingHeaders))
        .exchange((sent, response) -> {
          HttpHeaders responseHeaders = new HttpHeaders();
          response.getHeaders().forEach((name, values) -> {
            if (RESPONSE_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
              responseHeaders.put(name, values);
            }
          });
          try {
            byte[] body = incoming.getMethod().equals("HEAD")
                ? new byte[0]
                : response.getBody().readAllBytes();
            return ResponseEntity.status(response.getStatusCode())
                .headers(responseHeaders)
                .body(body);
          } catch (IOException error) {
            throw new IllegalStateException("Unable to read the frontend response", error);
          }
        });
  }
}
