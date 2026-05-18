package com.example.trello.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID> {

    @Query("SELECT MAX(c.position) FROM Card c WHERE c.list.id = :listId")
    Integer findMaxPositionByListId(UUID listId);
}
