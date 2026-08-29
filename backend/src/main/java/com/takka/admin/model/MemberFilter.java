package com.takka.admin.model;

import java.util.Optional;

/** Search and status criteria for the accounts table. */
public record MemberFilter(String search, Optional<AccountStatus> status) {
  public MemberFilter {
    search = search == null ? "" : search.trim();
    status = status == null ? Optional.empty() : status;
  }

  public static MemberFilter none() {
    return new MemberFilter("", Optional.empty());
  }

  public static MemberFilter of(String search, String status) {
    return new MemberFilter(search, AccountStatus.parse(status));
  }

  public boolean hasSearch() {
    return !search.isEmpty();
  }

  /** Value the console uses to keep the status dropdown on the chosen option. */
  public String statusValue() {
    return status.map(Enum::name).orElse("");
  }
}
