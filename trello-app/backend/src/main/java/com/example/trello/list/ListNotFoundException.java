package com.example.trello.list;

import java.util.UUID;

public class ListNotFoundException extends RuntimeException {
    public ListNotFoundException(UUID id) {
        super("List not found: " + id);
    }
}
