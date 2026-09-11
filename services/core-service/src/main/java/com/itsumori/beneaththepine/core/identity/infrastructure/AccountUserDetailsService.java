package com.itsumori.beneaththepine.core.identity.infrastructure;

import com.itsumori.beneaththepine.core.shared.security.AccountPrincipal;
import java.util.Locale;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountUserDetailsService implements UserDetailsService {
    private final AccountJpaRepository accounts;

    public AccountUserDetailsService(AccountJpaRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AccountEntity account = accounts.findByEmail(normalize(username))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        return new AccountPrincipal(
                account.getId(),
                account.getEmail(),
                account.getPasswordHash(),
                account.isEnabled()
        );
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
