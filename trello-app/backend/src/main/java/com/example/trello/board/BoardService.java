package com.example.trello.board;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;

    @Transactional(readOnly = true)
    public BoardDto getBoard(UUID id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException(id));
        return BoardDto.from(board);
    }

    @Transactional
    public BoardDto updateTitle(UUID id, String title) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException(id));
        board.setTitle(title);
        return BoardDto.from(board);
    }
}
