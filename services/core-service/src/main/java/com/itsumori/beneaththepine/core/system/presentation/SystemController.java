package com.itsumori.beneaththepine.core.system.presentation;

import java.util.Map;
import com.itsumori.beneaththepine.core.shared.security.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    @GetMapping("/auth-check")
    Map<String, Object> authenticationCheck(Authentication authentication) {
        var principal = AuthenticatedUser.principal(authentication);
        return Map.of(
                "authenticated", true,
                "subject", principal.id().toString(),
                "email", principal.email()
        );
    }
}
