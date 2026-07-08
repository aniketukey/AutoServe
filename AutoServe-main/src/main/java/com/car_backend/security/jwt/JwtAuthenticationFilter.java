package com.car_backend.security.jwt;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.car_backend.security.service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println(">>> Processing Request: " + request.getMethod() + " " + path);
        String header = request.getHeader("Authorization");
        System.out.println(">>> Authorization Header: " + header);

        try {
            String jwt = extractJwtFromRequest(request);
            System.out.println(">>> Extracted JWT: " + (jwt != null ? "Present" : "Null"));

            if (jwt != null
                    && jwtUtil.validateToken(jwt)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                // ✅ extract userId from JWT
                Long userId = jwtUtil.getUserIdFromToken(jwt);

                UserDetails userDetails = userDetailsService.loadUserById(userId);

                // 🔥 THIS LINE IS CRITICAL
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities() // ✅ ROLES ADDED HERE
                );

                // ✅ STORE userId HERE (THIS IS THE FIX)
                // authentication.setDetails(userId);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user ID: {}", userId);
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println(">>> JWT Auth Error: " + e.getMessage());
            log.error("JWT authentication failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken)
                && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
