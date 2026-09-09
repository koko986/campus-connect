package com.takka.frontend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class FrontendFallbackControllerTest {
  @Test
  void relaysFrontendRoutesAndQueryStrings() {
    var builder = RestClient.builder();
    var server = MockRestServiceServer.bindTo(builder).build();
    var controller = new FrontendFallbackController(
        "https://campus.example.vercel.app", builder.build());
    server.expect(once(), requestTo("https://campus.example.vercel.app/hub?tab=decide"))
        .andExpect(method(HttpMethod.GET))
        .andExpect(header("Accept-Language", "my"))
        .andRespond(withSuccess("<html>TAKKA</html>", MediaType.TEXT_HTML));
    var request = new MockHttpServletRequest("GET", "/hub");
    request.setQueryString("tab=decide");
    request.addHeader("Accept-Language", "my");

    var response = controller.serve(request);

    assertEquals(200, response.getStatusCode().value());
    assertEquals("<html>TAKKA</html>",
        new String(response.getBody(), StandardCharsets.UTF_8));
    server.verify();
  }
}
