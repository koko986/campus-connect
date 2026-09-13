package com.takka.admin.model;

import java.util.List;

/** Read-only student content preview shown inside the protected admin console. */
public record AdminPreviewView(
    String title,
    String typeKey,
    String status,
    String body,
    String primaryMeta,
    String secondaryMeta,
    List<AdminPreviewField> fields) {

  public boolean hasBody() {
    return body != null && !body.isBlank();
  }

  public boolean hasPrimaryMeta() {
    return primaryMeta != null && !primaryMeta.isBlank();
  }

  public boolean hasSecondaryMeta() {
    return secondaryMeta != null && !secondaryMeta.isBlank();
  }
}
