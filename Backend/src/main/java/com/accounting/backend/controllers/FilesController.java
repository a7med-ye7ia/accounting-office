package com.accounting.backend.controllers;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.server.ResponseStatusException;
import com.accounting.backend.services.AuthorizationService;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FilesController {

    final static String FILE_SYSTEM_PATH = "../FileSystem";

    @Autowired
    private AuthorizationService authorizationService;

    // @PostMapping("/upload")
    // public ResponseEntity<String> uploadFile(
    // @RequestParam("file") MultipartFile file) {

    // try {
    // String uploadDir =
    // "/mnt/par1/college/THE_PROJECT/temp/accounting-office/FileSystem";
    // Path uploadPath = Path.of(uploadDir);

    // if (!Files.exists(uploadPath)) {
    // Files.createDirectories(uploadPath);
    // }

    // Path filePath = uploadPath.resolve(file.getOriginalFilename());

    // Files.copy(
    // file.getInputStream(),
    // filePath,
    // StandardCopyOption.REPLACE_EXISTING
    // );

    // return ResponseEntity.ok("File uploaded");
    // } catch (IOException e) {
    // return ResponseEntity.internalServerError().body("Upload failed");
    // }
    // }

    @PostMapping("/uploadToCompanyFolder")
    public ResponseEntity<String> uploadFileToCompanyFolder(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyFolder") String companyFolder) {

        authorizationService.requireAuthenticatedUser(authHeader);

        try {
            // Sanitize inputs against path traversal
            String safeCompanyFolder = companyFolder.replace("\\", "/").replaceAll("/+", "/");
            if (safeCompanyFolder.contains("..") || safeCompanyFolder.startsWith("/")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid company folder path");
            }

            Path basePath = Paths.get(FILE_SYSTEM_PATH).toAbsolutePath().normalize();
            Path uploadPath = basePath.resolve(safeCompanyFolder).resolve("OtherTypesContracts").normalize();

            if (!uploadPath.startsWith(basePath)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Path traversal attempt detected");
            }

            if (!Files.exists(uploadPath)) {
                return ResponseEntity.badRequest().body("Company folder does not exist");
            }
            if (!Files.exists(uploadPath)) {
                // Files.createDirectories(uploadPath);
                return ResponseEntity.badRequest().body("Company folder does not exist");
            }

            String originalName = file.getOriginalFilename();
            String safeFileName = (originalName != null) ? Paths.get(originalName).getFileName().toString()
                    : "uploaded_file";
            Path filePath = uploadPath.resolve(safeFileName).normalize();

            if (!filePath.startsWith(uploadPath)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Path traversal attempt detected in filename");
            }

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING);
            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING);

            return ResponseEntity.ok("File uploaded to company folder");
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Upload failed");
        }
    }

    @GetMapping("/file")
    public ResponseEntity<Resource> getFile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("path") String filePath) {

        authorizationService.requireAuthenticatedUser(authHeader);

        try {
            Path basePath = Paths.get(FILE_SYSTEM_PATH).toAbsolutePath().normalize();

            // Normalize slashes and prevent traversal
            String cleanRelative = filePath.replace("\\", "/").replaceAll("/+", "/");
            if (cleanRelative.startsWith("/")) {
                cleanRelative = cleanRelative.substring(1);
            }

            Path pdfPath = basePath.resolve(cleanRelative).normalize();

            // Strict path traversal check
            if (!pdfPath.startsWith(basePath)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Path traversal attempt detected");
            }

            if (!Files.exists(pdfPath) || !Files.isReadable(pdfPath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(pdfPath.toUri());

            String contentType = Files.probeContentType(pdfPath);

            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);

        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
