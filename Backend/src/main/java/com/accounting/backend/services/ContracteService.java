package com.accounting.backend.services;
import com.accounting.backend.entities.ContractDocument;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ContracteService {

    private final ObjectMapper objectMapper;

    public ContracteService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ContractDocument getcontracte(String filename) throws IOException {
        Path path = Paths.get("..", "FileSystem", "fakeData", filename + ".json");
        return objectMapper.readValue(path.toFile(), ContractDocument.class);
    }
}