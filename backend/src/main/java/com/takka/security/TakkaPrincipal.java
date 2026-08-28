package com.takka.security;

import java.util.UUID;

public record TakkaPrincipal(UUID id, String email, String accessToken) {}
