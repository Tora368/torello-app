package com.example.trello.board;

import com.example.trello.list.ListDto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record BoardDto(
        UUID id,
        String title,
        OffsetDateTime createdAt,
        List<ListDto> lists
) {
    public static BoardDto from(Board board) {
        return new BoardDto(
                board.getId(),
                board.getTitle(),
                board.getCreatedAt(),
                board.getLists().stream().map(ListDto::from).toList()
        );
    }
}
