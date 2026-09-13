package com.takka.supabase;

import org.springframework.http.HttpMethod;

/** Carries the real Supabase REST failure for server-side diagnostics. */
public class SupabaseRequestException extends RuntimeException {
  private final HttpMethod method;
  private final String resource;
  private final int statusCode;
  private final String responseBody;

  public SupabaseRequestException(
      HttpMethod method, String resource, int statusCode, String responseBody, Throwable cause) {
    super("Supabase request failed with status " + statusCode, cause);
    this.method = method;
    this.resource = resource;
    this.statusCode = statusCode;
    this.responseBody = responseBody == null ? "" : responseBody;
  }

  public HttpMethod method() {
    return method;
  }

  public String resource() {
    return resource;
  }

  public int statusCode() {
    return statusCode;
  }

  public String responseBody() {
    return responseBody;
  }
}
