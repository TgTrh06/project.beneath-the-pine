package com.itsumori.beneaththepine.core.shared.security;

import com.itsumori.beneaththepine.core.shared.error.ApplicationException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

public final class AuthenticatedUser {
    private AuthenticatedUser() {
    }

    public static AccountPrincipal principal(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal) {
            return principal;
        }
        throw new ApplicationException(
                "INVALID_IDENTITY",
                "The authenticated identity is not valid.",
                HttpStatus.UNAUTHORIZED
        );
    }

    public static UUID id(Authentication authentication) {
        return principal(authentication).id();
    }
}
