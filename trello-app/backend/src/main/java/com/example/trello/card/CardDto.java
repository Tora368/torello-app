package com.example.trello.card;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CardDto(
        UUID id,
        UUID listId,
        String title,
        String description,
        int position,
        String priority,
        LocalDate dueDate,
        OffsetDateTime createdAt
) {
    public static CardDto from(Card card) {
        return new CardDto(
                card.getId(),
                card.getList().getId(),
                card.getTitle(),
                card.getDescription(),
                card.getPosition(),
                card.getPriority() != null ? card.getPriority().name() : null,
                card.getDueDate(),
                card.getCreatedAt()
        );
    }
}
