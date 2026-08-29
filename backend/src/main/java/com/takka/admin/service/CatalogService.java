package com.takka.admin.service;

import com.takka.admin.form.CatalogItemForm;
import com.takka.admin.mapper.CatalogMapper;
import com.takka.admin.model.AdminIdentity;
import com.takka.admin.model.CatalogItemView;
import com.takka.admin.model.CatalogResource;
import com.takka.admin.repository.CatalogRepository;
import com.takka.admin.support.Json;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Curation of campuses, departments, and programs beneath a university. */
@Service
public class CatalogService {
  private final CatalogRepository catalogRepository;

  public CatalogService(CatalogRepository catalogRepository) {
    this.catalogRepository = catalogRepository;
  }

  public List<CatalogItemView> items(CatalogResource resource, UUID universityId) {
    if (universityId == null) return List.of();
    return catalogRepository.findAll(resource, universityId).stream()
        .map(row -> CatalogMapper.toView(row, resource))
        .toList();
  }

  /** Departments available as the parent of a program. */
  public List<CatalogItemView> departmentOptions(UUID universityId) {
    if (universityId == null) return List.of();
    return catalogRepository.findDepartmentOptions(universityId).stream()
        .map(row -> CatalogMapper.toView(row, CatalogResource.DEPARTMENTS))
        .toList();
  }

  public CatalogItemForm editForm(CatalogResource resource, UUID id, UUID universityId) {
    var row = catalogRepository
        .findById(resource, id)
        .orElseThrow(() -> new IllegalArgumentException(resource.singular() + " not found"));
    var view = CatalogMapper.toView(row, resource);

    var form = new CatalogItemForm();
    form.setId(view.id());
    form.setUniversityId(universityId);
    form.setName(view.name());
    form.setCity(view.city());
    form.setAddress(view.address());
    form.setDegreeLevel(view.degreeLevel());
    form.setDescription(view.description());
    form.setDepartmentId(view.departmentId());
    form.setSourceUrl(view.sourceUrl());
    form.setLatitude(Json.optionalDecimal(row, "latitude").orElse(null));
    form.setLongitude(Json.optionalDecimal(row, "longitude").orElse(null));
    return form;
  }

  public String save(AdminIdentity administrator, CatalogResource resource, CatalogItemForm form) {
    AdminAccess.requireSuperAdmin(administrator);
    if (form.isMissingRequiredCity(resource)) {
      throw new IllegalArgumentException("A city is required for a campus");
    }

    var attributes = form.toAttributes(resource);
    if (form.isEditing()) {
      catalogRepository.update(resource, form.getId(), attributes);
    } else {
      catalogRepository.insert(resource, attributes);
    }
    return form.getName();
  }
}
