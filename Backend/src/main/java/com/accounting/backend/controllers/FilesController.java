package com.accounting.backend.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FilesController {

  final static String FILE_SYSTEM_PATH = "/mnt/par1/college/THE_PROJECT/temp/accounting-office/FileSystem";
  
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
}
