package com.example.trello.card;

import com.example.trello.list.ListNotFoundException;
import com.example.trello.list.TaskList;
import com.example.trello.list.TaskListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final TaskListRepository listRepository;

    @Transactional
    public CardDto addCard(UUID listId, String title, String description) {
        TaskList list = findListOrThrow(listId);
        Integer maxPos = cardRepository.findMaxPositionByListId(listId);
        int nextPos = (maxPos == null) ? 0 : maxPos + 1;

        Card card = new Card();
        card.setList(list);
        card.setTitle(title);
        card.setDescription(description != null ? description : "");
        card.setPosition(nextPos);

        return CardDto.from(cardRepository.save(card));
    }

    @Transactional
    public CardDto updateCard(UUID cardId, String title, String description,
                              String priority, LocalDate dueDate) {
        Card card = findCardOrThrow(cardId);
        card.setTitle(title);
        card.setDescription(description != null ? description : "");
        card.setPriority(priority != null ? Card.Priority.valueOf(priority) : null);
        card.setDueDate(dueDate);
        return CardDto.from(card);
    }

    @Transactional
    public CardDto moveCard(UUID cardId, UUID targetListId, int newPosition) {
        Card card = findCardOrThrow(cardId);
        TaskList targetList = findListOrThrow(targetListId);

        UUID sourceListId = card.getList().getId();
        boolean sameList = sourceListId.equals(targetListId);

        if (!sameList) {
            // repack positions in source list
            repackPositions(card.getList().getCards(), card);
            card.setList(targetList);
        }

        // insert at newPosition in target list
        List<Card> targetCards = targetList.getCards();
        targetCards.remove(card);
        int insertAt = Math.min(newPosition, targetCards.size());
        targetCards.add(insertAt, card);
        for (int i = 0; i < targetCards.size(); i++) {
            targetCards.get(i).setPosition(i);
        }

        return CardDto.from(card);
    }

    @Transactional
    public void deleteCard(UUID cardId) {
        Card card = findCardOrThrow(cardId);
        repackPositions(card.getList().getCards(), card);
        cardRepository.delete(card);
    }

    private void repackPositions(List<Card> cards, Card excluded) {
        int pos = 0;
        for (Card c : cards) {
            if (!c.getId().equals(excluded.getId())) {
                c.setPosition(pos++);
            }
        }
    }

    private Card findCardOrThrow(UUID id) {
        return cardRepository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));
    }

    private TaskList findListOrThrow(UUID id) {
        return listRepository.findById(id)
                .orElseThrow(() -> new ListNotFoundException(id));
    }
}
