package com.accounting.backend.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

  final static String rootDirectory = "../FileSystem";
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

    public Path saveBytes(String relativePath, String fileName, byte[] content) throws IOException {
        Path folderPath = Path.of(rootDirectory, relativePath);

        Files.createDirectories(folderPath);

        Path filePath = folderPath.resolve(fileName);

        Files.write(
            filePath,
            content,
            StandardOpenOption.CREATE,
            StandardOpenOption.TRUNCATE_EXISTING
        );

        return filePath;
    }
}
