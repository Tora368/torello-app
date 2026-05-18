package com.example.trello.list;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ListController {

    private final ListService listService;

    @PostMapping("/api/boards/{boardId}/lists")
    public ResponseEntity<ListDto> addList(
            @PathVariable UUID boardId,
            @Valid @RequestBody TitleRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(listService.addList(boardId, body.title()));
    }

    @PatchMapping("/api/lists/{listId}")
    public ResponseEntity<ListDto> updateTitle(
            @PathVariable UUID listId,
            @Valid @RequestBody TitleRequest body) {
        return ResponseEntity.ok(listService.updateTitle(listId, body.title()));
    }

    @DeleteMapping("/api/lists/{listId}")
    public ResponseEntity<Void> deleteList(@PathVariable UUID listId) {
        listService.deleteList(listId);
        return ResponseEntity.noContent().build();
    }

    public record TitleRequest(@NotBlank @Size(max = 255) String title) {}
}
