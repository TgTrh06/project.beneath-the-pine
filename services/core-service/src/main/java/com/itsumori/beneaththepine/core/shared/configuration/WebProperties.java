package com.itsumori.beneaththepine.core.shared.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "beneath-pine.web")
public record WebProperties(String allowedOrigin) {
}
