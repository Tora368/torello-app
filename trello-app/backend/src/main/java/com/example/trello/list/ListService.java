package com.example.trello.list;

import com.example.trello.board.Board;
import com.example.trello.board.BoardNotFoundException;
import com.example.trello.board.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListService {

    private final TaskListRepository listRepository;
    private final BoardRepository boardRepository;

    @Transactional
    public ListDto addList(UUID boardId, String title) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));

        Integer maxPos = listRepository.findMaxPositionByBoardId(boardId);
        int nextPos = (maxPos == null) ? 0 : maxPos + 1;

        TaskList list = new TaskList();
        list.setBoard(board);
        list.setTitle(title);
        list.setPosition(nextPos);

        return ListDto.from(listRepository.save(list));
    }

    @Transactional
    public ListDto updateTitle(UUID listId, String title) {
        TaskList list = findOrThrow(listId);
        list.setTitle(title);
        return ListDto.from(list);
    }

    @Transactional
    public void deleteList(UUID listId) {
        listRepository.delete(findOrThrow(listId));
    }

    private TaskList findOrThrow(UUID id) {
        return listRepository.findById(id)
                .orElseThrow(() -> new ListNotFoundException(id));
    }
}
