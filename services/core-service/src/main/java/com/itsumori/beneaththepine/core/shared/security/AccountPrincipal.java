package com.itsumori.beneaththepine.core.shared.security;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public final class AccountPrincipal implements UserDetails, CredentialsContainer, Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    private final UUID id;
    private final String email;
    private final boolean enabled;
    private String passwordHash;

    public AccountPrincipal(UUID id, String email, String passwordHash, boolean enabled) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.enabled = enabled;
    }

    public UUID id() {
        return id;
    }

    public String email() {
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }
}
