package com.takka.supabase;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class SupabaseProxyControllerTest {
  @Test
  void forwardsAuthRequestsAndReturnsUpstreamErrorsUnchanged() {
    var builder = RestClient.builder();
    var server = MockRestServiceServer.bindTo(builder).build();
    var controller = new SupabaseProxyController("https://project.supabase.co", builder.build());
    server.expect(once(), requestTo(
            "https://project.supabase.co/auth/v1/token?grant_type=password"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(header("apikey", "public-key"))
        .andRespond(withStatus(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
            .body("{\"message\":\"Invalid login credentials\"}"));
    var request = new MockHttpServletRequest("POST", "/api/supabase/auth/v1/token");
    request.setQueryString("grant_type=password");
    request.addHeader("apikey", "public-key");
    request.addHeader("host", "attacker.example");

    var response = controller.proxy(request,
        "{\"email\":\"student@example.com\"}".getBytes(StandardCharsets.UTF_8));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("{\"message\":\"Invalid login credentials\"}",
        new String(response.getBody(), StandardCharsets.UTF_8));
    server.verify();
  }

  @Test
  void refusesPathsOutsidePublicSupabaseApis() {
    var controller = new SupabaseProxyController(
        "https://project.supabase.co", mock(RestClient.class));
    var request = new MockHttpServletRequest("GET", "/api/supabase/auth/v2/admin/users");

    assertEquals(HttpStatus.NOT_FOUND, controller.proxy(request, null).getStatusCode());
  }
}
