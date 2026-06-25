package com.accounting.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;

@Service
public class FileService {

    private final String rootDirectory = "/mnt/par1/college/THE_PROJECT/temp/accounting-office/FileSystem";

    public Path createFolder(String folderName) throws IOException {
        Path folderPath = Path.of(rootDirectory, folderName);

        if (!Files.exists(folderPath)) {
            Files.createDirectories(folderPath);
        }

        return folderPath;
    }

    public Path saveFile(String relativePath, MultipartFile file) throws IOException {
        Path folderPath = Path.of(rootDirectory, relativePath);

        Files.createDirectories(folderPath);

        Path filePath = folderPath.resolve(file.getOriginalFilename());

        Files.copy(
            file.getInputStream(),
            filePath,
            StandardCopyOption.REPLACE_EXISTING
        );

        return filePath;
    }

    public Path saveJsonFile(String relativePath, String fileName, String jsonContent) throws IOException {

        Path folderPath = Path.of(rootDirectory, relativePath);

        Files.createDirectories(folderPath);

        Path filePath = folderPath.resolve(fileName);

        Files.writeString(
            filePath,
            jsonContent,
            StandardOpenOption.CREATE,
            StandardOpenOption.TRUNCATE_EXISTING
        );

        return filePath;
    }
}