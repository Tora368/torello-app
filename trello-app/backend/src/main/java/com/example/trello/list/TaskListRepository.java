package com.example.trello.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TaskListRepository extends JpaRepository<TaskList, UUID> {

    @Query("SELECT MAX(l.position) FROM TaskList l WHERE l.board.id = :boardId")
    Integer findMaxPositionByBoardId(UUID boardId);

    List<TaskList> findByBoardIdOrderByPosition(UUID boardId);
}
