package com.example.trello.card;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/api/lists/{listId}/cards")
    public ResponseEntity<CardDto> addCard(
            @PathVariable UUID listId,
            @Valid @RequestBody AddCardRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cardService.addCard(listId, body.title(), body.description()));
    }

    @PatchMapping("/api/cards/{cardId}")
    public ResponseEntity<CardDto> updateCard(
            @PathVariable UUID cardId,
            @Valid @RequestBody UpdateCardRequest body) {
        return ResponseEntity.ok(
                cardService.updateCard(cardId, body.title(), body.description(),
                        body.priority(), body.dueDate()));
    }

    @PatchMapping("/api/cards/{cardId}/position")
    public ResponseEntity<CardDto> moveCard(
            @PathVariable UUID cardId,
            @Valid @RequestBody MoveCardRequest body) {
        return ResponseEntity.ok(
                cardService.moveCard(cardId, body.listId(), body.position()));
    }

    @DeleteMapping("/api/cards/{cardId}")
    public ResponseEntity<Void> deleteCard(@PathVariable UUID cardId) {
        cardService.deleteCard(cardId);
        return ResponseEntity.noContent().build();
    }

    public record AddCardRequest(
            @NotBlank @Size(max = 255) String title,
            String description) {}

    public record UpdateCardRequest(
            @NotBlank @Size(max = 255) String title,
            String description,
            String priority,
            LocalDate dueDate) {}

    public record MoveCardRequest(
            @NotNull UUID listId,
            int position) {}
}
