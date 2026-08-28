package com.takka.reports;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.takka.reports.ReportService.ReportRequest;
import com.takka.security.TakkaPrincipal;
import com.takka.supabase.SupabaseGateway;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class ReportServiceTest {
  private final ObjectMapper mapper = new ObjectMapper();
  private final SupabaseGateway supabase = mock(SupabaseGateway.class);
  private final ReportService service = new ReportService(supabase);

  @Test
  void memberCannotReportTheirOwnAccount() throws Exception {
    UUID userId = UUID.randomUUID();
    var principal = new TakkaPrincipal(userId, "member@takka.test", "token");
    when(supabase.get(anyString())).thenAnswer(invocation -> {
      String query = invocation.getArgument(0);
      if (query.startsWith("profiles")) return mapper.readTree("[{\"id\":\"" + userId + "\"}]");
      return mapper.readTree("[]");
    });

    assertThrows(IllegalArgumentException.class,
        () -> service.submit(principal, new ReportRequest("ACCOUNT", userId, "SPAM", null)));
  }

  @Test
  void detailsShorterThanTenCharactersAreRejected() throws Exception {
    UUID userId = UUID.randomUUID();
    var principal = new TakkaPrincipal(userId, "member@takka.test", "token");
    when(supabase.get(anyString())).thenReturn(mapper.readTree("[{\"id\":\"" + userId + "\"}]"));

    assertThrows(IllegalArgumentException.class,
        () -> service.submit(principal, new ReportRequest("POST", UUID.randomUUID(), "SPAM", "short")));
  }
}
