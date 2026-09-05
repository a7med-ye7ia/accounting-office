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

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FilesController {

  final static String FILE_SYSTEM_PATH = "../FileSystem";
  
  // @PostMapping("/upload")
  // public ResponseEntity<String> uploadFile(
  //   @RequestParam("file") MultipartFile file) {

  //   try {
  //     String uploadDir = "/mnt/par1/college/THE_PROJECT/temp/accounting-office/FileSystem";
  //     Path uploadPath = Path.of(uploadDir);

  //     if (!Files.exists(uploadPath)) {
  //         Files.createDirectories(uploadPath);
  //     }

  //     Path filePath = uploadPath.resolve(file.getOriginalFilename());

  //     Files.copy(
  //             file.getInputStream(),
  //             filePath,
  //             StandardCopyOption.REPLACE_EXISTING
  //     );

  //     return ResponseEntity.ok("File uploaded");
  //   } catch (IOException e) {
  //       return ResponseEntity.internalServerError().body("Upload failed");
  //   }
  // }

  @PostMapping("/uploadToCompanyFolder")
  public ResponseEntity<String> uploadFileToCompanyFolder(
    @RequestParam("file") MultipartFile file,
    @RequestParam("companyFolder") String companyFolder) {

    try {
      String uploadDir = companyFolder;
      Path uploadPath = Path.of(FILE_SYSTEM_PATH, uploadDir, "OtherTypesContracts");

      if (!Files.exists(uploadPath)) {
          // Files.createDirectories(uploadPath);
          return ResponseEntity.badRequest().body("Company folder does not exist");
      }

      Path filePath = uploadPath.resolve(file.getOriginalFilename());

      Files.copy(
              file.getInputStream(),
              filePath,
              StandardCopyOption.REPLACE_EXISTING
      );

      return ResponseEntity.ok("File uploaded to company folder");
    } catch (IOException e) {
        return ResponseEntity.internalServerError().body("Upload failed");
    }
  }

  @GetMapping("/pdf")
  public ResponseEntity<Resource> getPdf(
          @RequestParam("path") String filePath) {

      try {
          Path pdfPath = Paths.get(FILE_SYSTEM_PATH).resolve(filePath).normalize();
        System.out.println("Resolved path: " + pdfPath);
          if (!Files.exists(pdfPath) || !Files.isReadable(pdfPath)) {
              return ResponseEntity.notFound().build();
          }

          Resource resource = new UrlResource(pdfPath.toUri());

          return ResponseEntity.ok()
                  .contentType(MediaType.APPLICATION_PDF)
                  .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                  .body(resource);

      } catch (MalformedURLException e) {
          return ResponseEntity.badRequest().build();
      }
  }
}
