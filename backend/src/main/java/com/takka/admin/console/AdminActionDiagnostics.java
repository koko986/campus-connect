package com.takka.admin.console;

import com.takka.admin.model.AdminIdentity;
import com.takka.supabase.SupabaseRequestException;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;

/** Shared logging for admin POST failures. The UI only receives the generated reference. */
final class AdminActionDiagnostics {
  private AdminActionDiagnostics() {}

  static String log(Logger logger, String route, AdminIdentity administrator, UUID targetId, RuntimeException failure) {
    String reference = "ADM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    String adminEmail = administrator == null ? "unknown" : administrator.email();
    UUID adminId = administrator == null ? null : administrator.userId();
    if (failure instanceof SupabaseRequestException supabase) {
      logger.error(
          "Admin action failed ref={} route={} adminEmail={} adminId={} targetId={} method={} resource={} supabaseStatus={} supabaseBody={}",
          reference,
          route,
          adminEmail,
          adminId,
          targetId,
          supabase.method(),
          supabase.resource(),
          supabase.statusCode(),
          supabase.responseBody(),
          failure);
    } else {
      logger.error(
          "Admin action failed ref={} route={} adminEmail={} adminId={} targetId={}",
          reference,
          route,
          adminEmail,
          adminId,
          targetId,
          failure);
    }
    return reference;
  }
}
