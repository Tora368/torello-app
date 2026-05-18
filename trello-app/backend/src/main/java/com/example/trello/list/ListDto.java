package com.example.trello.list;

import com.example.trello.card.CardDto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ListDto(
        UUID id,
        String title,
        int position,
        OffsetDateTime createdAt,
        List<CardDto> cards
) {
    public static ListDto from(TaskList list) {
        return new ListDto(
                list.getId(),
                list.getTitle(),
                list.getPosition(),
                list.getCreatedAt(),
                list.getCards().stream().map(CardDto::from).toList()
        );
    }
}
