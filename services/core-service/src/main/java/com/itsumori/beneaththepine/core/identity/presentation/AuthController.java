package com.itsumori.beneaththepine.core.identity.presentation;

import com.itsumori.beneaththepine.core.identity.application.RegisterAccount;
import com.itsumori.beneaththepine.core.shared.error.ApplicationException;
import com.itsumori.beneaththepine.core.shared.security.AccountPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {
    private final AuthenticationManager authenticationManager;
    private final RegisterAccount registerAccount;
    private final CsrfTokenRepository csrfTokenRepository;
    private final CsrfTokenRequestHandler csrfTokenRequestHandler;

    AuthController(
            AuthenticationManager authenticationManager,
            RegisterAccount registerAccount,
            CsrfTokenRepository csrfTokenRepository,
            CsrfTokenRequestHandler csrfTokenRequestHandler
    ) {
        this.authenticationManager = authenticationManager;
        this.registerAccount = registerAccount;
        this.csrfTokenRepository = csrfTokenRepository;
        this.csrfTokenRequestHandler = csrfTokenRequestHandler;
    }

    @GetMapping("/session")
    AuthSessionResponse session(Authentication authentication, CsrfToken csrfToken) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal) {
            return AuthSessionResponse.authenticated(principal, csrfToken.getToken());
        }
        return AuthSessionResponse.anonymous(csrfToken.getToken());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthSessionResponse register(
            @Valid @RequestBody CredentialsRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String email = registerAccount.execute(requestBody.email(), requestBody.password());
        return authenticate(email, requestBody.password(), request, response);
    }

    @PostMapping("/login")
    AuthSessionResponse login(
            @Valid @RequestBody CredentialsRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return authenticate(requestBody.email(), requestBody.password(), request, response);
    }

    private AuthSessionResponse authenticate(
            String email,
            String password,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, password)
            );
            HttpSession existingSession = request.getSession(false);
            if (existingSession != null) {
                request.changeSessionId();
            }
            HttpSession session = request.getSession(true);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            String csrfToken = rotateCsrfToken(request, response);
            return AuthSessionResponse.authenticated(
                    (AccountPrincipal) authentication.getPrincipal(),
                    csrfToken
            );
        } catch (BadCredentialsException exception) {
            throw invalidCredentials();
        } catch (AuthenticationException exception) {
            throw invalidCredentials();
        }
    }

    private static ApplicationException invalidCredentials() {
        return new ApplicationException(
                "INVALID_CREDENTIALS",
                "The email or password is incorrect.",
                HttpStatus.UNAUTHORIZED
        );
    }

    private String rotateCsrfToken(HttpServletRequest request, HttpServletResponse response) {
        csrfTokenRepository.saveToken(null, request, response);
        CsrfToken token = csrfTokenRepository.generateToken(request);
        csrfTokenRepository.saveToken(token, request, response);
        csrfTokenRequestHandler.handle(request, response, () -> token);
        return ((CsrfToken) request.getAttribute(CsrfToken.class.getName())).getToken();
    }
}
