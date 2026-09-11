package com.itsumori.beneaththepine.core.identity.presentation;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;

record CredentialsRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank @Size(min = 12, max = 64) String password
) {
    CredentialsRequest {
        if (email != null) {
            email = email.trim();
        }
    }

    @AssertTrue(message = "Password exceeds the BCrypt input limit")
    boolean isPasswordWithinBcryptLimit() {
        return password == null || password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
