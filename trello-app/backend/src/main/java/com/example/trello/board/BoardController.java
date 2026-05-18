package com.example.trello.board;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping("/{id}")
    public ResponseEntity<BoardDto> getBoard(@PathVariable UUID id) {
        return ResponseEntity.ok(boardService.getBoard(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BoardDto> updateTitle(
            @PathVariable UUID id,
            @Valid @RequestBody TitleRequest body) {
        return ResponseEntity.ok(boardService.updateTitle(id, body.title()));
    }

    public record TitleRequest(@NotBlank @Size(max = 255) String title) {}
}
