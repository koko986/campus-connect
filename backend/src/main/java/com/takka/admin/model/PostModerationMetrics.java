package com.takka.admin.model;

/** Headline counts for the admin post moderation dashboard. */
public record PostModerationMetrics(long total, long reported, long published, long removed) {}
