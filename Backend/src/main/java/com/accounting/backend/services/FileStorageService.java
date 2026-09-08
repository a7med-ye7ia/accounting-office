package com.accounting.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.file.upload-dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("tasks").normalize();
    }

    public StoredFile store(Long taskId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store an empty file");
        }

        String originalName = file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename();
        String extension = extensionOf(originalName);
        String storedName = UUID.randomUUID() + extension;
        Path taskDirectory = safeResolve(uploadRoot, String.valueOf(taskId));
        Path target = safeResolve(taskDirectory, storedName);

        try {
            Files.createDirectories(taskDirectory);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredFile(originalName, storedName, uploadRoot.relativize(target).toString(), target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
    }

    public Resource load(String relativePath) {
        Path file = safeResolve(uploadRoot, relativePath);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("Attachment file not found");
            }
            return resource;
        } catch (IOException e) {
            throw new IllegalArgumentException("Attachment file not found", e);
        }
    }

    public void delete(String relativePath) {
        Path file = safeResolve(uploadRoot, relativePath);
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete attachment file", e);
        }
    }

    public String extensionOf(String fileName) {
        String cleanName = Paths.get(fileName).getFileName().toString();
        int dot = cleanName.lastIndexOf('.');
        return dot > 0 ? cleanName.substring(dot).toLowerCase() : "";
    }

    private Path safeResolve(Path base, String path) {
        Path resolved = base.resolve(path).normalize();
        if (!resolved.startsWith(base)) {
            throw new IllegalArgumentException("Invalid attachment path");
        }
        return resolved;
    }

    public record StoredFile(String originalFileName, String storedFileName, String relativePath, Path absolutePath) { }
}
