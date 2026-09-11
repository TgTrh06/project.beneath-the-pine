package com.itsumori.beneaththepine.core.identity.presentation;

import com.itsumori.beneaththepine.core.shared.security.AccountPrincipal;

record AuthSessionResponse(boolean authenticated, AuthenticatedAccount user, String csrfToken) {
    static AuthSessionResponse anonymous(String csrfToken) {
        return new AuthSessionResponse(false, null, csrfToken);
    }

    static AuthSessionResponse authenticated(AccountPrincipal principal, String csrfToken) {
        return new AuthSessionResponse(
                true,
                new AuthenticatedAccount(principal.id().toString(), principal.email()),
                csrfToken
        );
    }

    record AuthenticatedAccount(String id, String email) {
    }
}
