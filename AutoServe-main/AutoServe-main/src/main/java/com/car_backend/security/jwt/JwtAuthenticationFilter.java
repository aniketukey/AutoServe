package com.car_backend.security.jwt;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.car_backend.security.service.CustomUserDetailsService;
import org.springframework.util.StringUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter  {
	
	private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;   




	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		 try {
	            // 1. Extract JWT token from request header
	            String jwt = extractJwtFromRequest(request);
	            
	            // 2. If token exists and is valid
	            if (jwt != null && jwtUtil.validateToken(jwt)) {
	                
	                // 3. Get user ID from token
	                Long userId = jwtUtil.getUserIdFromToken(jwt);
	                
	                // 4. Load user details
	                UserDetails userDetails = userDetailsService.loadUserById(userId);
	                
	                // 5. Create authentication object
	                UsernamePasswordAuthenticationToken authentication =
	                    new UsernamePasswordAuthenticationToken(
	                        userDetails,
	                        null,
	                        userDetails.getAuthorities()
	                    );
	                
	                authentication.setDetails(
	                    new WebAuthenticationDetailsSource().buildDetails(request)
	                );
	                
	                // 6. Set authentication in security context
	                SecurityContextHolder.getContext().setAuthentication(authentication);
	                
	                log.debug("Set authentication for user: {}", userId);
	            }
	            
	        } catch (Exception e) {
	            log.error("Cannot set user authentication: {}", e.getMessage());
	        }
	        
	        // 7. Continue filter chain
	        filterChain.doFilter(request, response);
		
	}
	
	/**
     * Extract JWT token from Authorization header
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        
        String bearerToken = request.getHeader("Authorization");
        
        // Check if header exists and starts with "Bearer "
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);  // Remove "Bearer " prefix
        }
        
        return null;
    }
}