package com.itsumori.beneaththepine.core.system.presentation;

import java.util.Map;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    @GetMapping("/auth-check")
    Map<String, Object> authenticationCheck(JwtAuthenticationToken authentication) {
        return Map.of(
                "authenticated", true,
                "subject", authentication.getToken().getSubject()
        );
    }
}
