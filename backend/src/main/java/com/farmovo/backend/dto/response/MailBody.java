package com.farmovo.backend.dto.response;

import lombok.Builder;

@Builder
public record MailBody(String to, String subject, String text ) {
}
