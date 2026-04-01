package com.eventhub.api.config;

import com.eventhub.api.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins.split(","))
                .addInterceptors(new CookieHandshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Try Bearer header first (backwards compatibility)
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        authenticateWithToken(token, accessor);
                    } else {
                        // Fall back to cookie-based auth from handshake
                        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                        if (sessionAttrs != null) {
                            String email = (String) sessionAttrs.get("ws_user_email");
                            if (email != null) {
                                Principal principal = new UsernamePasswordAuthenticationToken(
                                        email, null, Collections.emptyList());
                                accessor.setUser(principal);
                            }
                        }
                    }
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    Principal user = accessor.getUser();

                    if (destination != null && (destination.startsWith("/topic/notifications/")
                            || destination.startsWith("/topic/messages/"))) {
                        if (user == null) {
                            log.warn("Unauthenticated WebSocket subscription attempt to: {}", destination);
                            throw new IllegalArgumentException("Authentication required for this channel");
                        }
                        String channelIdentifier = destination.substring(destination.lastIndexOf("/") + 1);
                        String userEmail = user.getName();
                        if (!userEmail.equals(channelIdentifier)) {
                            log.warn("User {} attempted to subscribe to channel: {}", userEmail, destination);
                            throw new IllegalArgumentException("Not authorized to subscribe to this channel");
                        }
                    }
                }

                return message;
            }
        });
    }

    private void authenticateWithToken(String token, StompHeaderAccessor accessor) {
        try {
            if (jwtService.isTokenValid(token)) {
                String email = jwtService.extractEmail(token);
                Principal principal = new UsernamePasswordAuthenticationToken(
                        email, null, Collections.emptyList());
                accessor.setUser(principal);
            }
        } catch (Exception e) {
            log.debug("WebSocket JWT authentication failed: {}", e.getMessage());
        }
    }

    private class CookieHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) {
            if (request instanceof ServletServerHttpRequest servletRequest) {
                HttpServletRequest httpRequest = servletRequest.getServletRequest();
                Cookie[] cookies = httpRequest.getCookies();
                if (cookies != null) {
                    for (Cookie cookie : cookies) {
                        if ("access_token".equals(cookie.getName())) {
                            String token = cookie.getValue();
                            try {
                                if (jwtService.isTokenValid(token)) {
                                    String email = jwtService.extractEmail(token);
                                    attributes.put("ws_user_email", email);
                                }
                            } catch (Exception e) {
                                log.debug("WebSocket cookie auth failed: {}", e.getMessage());
                            }
                            break;
                        }
                    }
                }
            }
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Exception exception) {
        }
    }
}
