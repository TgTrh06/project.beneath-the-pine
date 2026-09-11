package com.itsumori.beneaththepine.core.shared.security;

import com.itsumori.beneaththepine.core.shared.configuration.WebProperties;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableConfigurationProperties(WebProperties.class)
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityErrorWriter errorWriter,
            CsrfTokenRepository csrfTokenRepository,
            CsrfTokenRequestHandler csrfTokenRequestHandler
    ) throws Exception {
        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(csrfTokenRequestHandler))
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/auth/session").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> errorWriter.write(
                                request,
                                response,
                                HttpStatus.UNAUTHORIZED.value(),
                                "UNAUTHENTICATED",
                                "Authentication is required."
                        ))
                        .accessDeniedHandler((request, response, exception) -> errorWriter.write(
                                request,
                                response,
                                HttpStatus.FORBIDDEN.value(),
                                "FORBIDDEN",
                                "Access is not allowed."
                        )))
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .deleteCookies("BTP_SESSION", "XSRF-TOKEN")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpStatus.NO_CONTENT.value())));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    CsrfTokenRepository csrfTokenRepository(
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure,
            @Value("${server.servlet.session.cookie.same-site:lax}") String sameSite
    ) {
        CookieCsrfTokenRepository repository = new CookieCsrfTokenRepository();
        repository.setCookiePath("/");
        repository.setCookieCustomizer(cookie -> cookie.secure(secure).sameSite(sameSite));
        return repository;
    }

    @Bean
    CsrfTokenRequestHandler csrfTokenRequestHandler() {
        return new XorCsrfTokenRequestAttributeHandler();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(WebProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(properties.allowedOrigin()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "X-Request-ID", "X-XSRF-TOKEN"));
        configuration.setExposedHeaders(List.of("X-Request-ID"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
