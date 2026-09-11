package com.itsumori.beneaththepine.core.identity.application;

import com.itsumori.beneaththepine.core.identity.infrastructure.AccountEntity;
import com.itsumori.beneaththepine.core.identity.infrastructure.AccountJpaRepository;
import com.itsumori.beneaththepine.core.shared.error.ApplicationException;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegisterAccount {
    private final AccountJpaRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public RegisterAccount(AccountJpaRepository accounts, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.clock = Clock.systemUTC();
    }

    @Transactional
    public String execute(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Instant now = clock.instant();
        try {
            accounts.saveAndFlush(new AccountEntity(
                    UUID.randomUUID(),
                    normalizedEmail,
                    passwordEncoder.encode(password),
                    now
            ));
        } catch (DataIntegrityViolationException exception) {
            throw new ApplicationException(
                    "ACCOUNT_ALREADY_EXISTS",
                    "An account with this email already exists.",
                    HttpStatus.CONFLICT
            );
        }
        return normalizedEmail;
    }
}
