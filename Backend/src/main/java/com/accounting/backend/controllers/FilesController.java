package com.accounting.backend.controllers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Contract;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ContractStatus;
import com.accounting.backend.enums.ContractType;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.ContractRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FilesController {

  @Autowired
  private ContractRepository contractRepository;

  @Autowired
  private CompanyRepository companyRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private JwtService jwtService;

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

  @PostMapping("/uploadOtherContract")
  public ResponseEntity<?> uploadOtherContract(
      @RequestParam("file") MultipartFile file,
      @RequestParam("companyFolder") String companyFolder,
      @RequestParam("companyId") Long companyId,
      @RequestParam(value = "relativePath", required = false) String relativePath,
      @RequestHeader(value = "Authorization", required = false) String authHeader) {
    try {
      if (file == null || file.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
      }

      Path baseDir = Path.of(FILE_SYSTEM_PATH, companyFolder, "OtherTypesContracts").toAbsolutePath().normalize();
      Files.createDirectories(baseDir);

      Path targetDir = baseDir;
      if (relativePath != null && !relativePath.isBlank()) {
        String safeRelativePath = relativePath.replace('\\', '/').replaceAll("^/|/$", "");
        if (safeRelativePath.contains("..")) {
          return ResponseEntity.badRequest().body(Map.of("message", "Invalid folder path"));
        }
        targetDir = baseDir.resolve(safeRelativePath).normalize();
        if (!targetDir.startsWith(baseDir)) {
          return ResponseEntity.badRequest().body(Map.of("message", "Invalid folder path"));
        }
        Files.createDirectories(targetDir);
      }

      String fileName = file.getOriginalFilename();
      if (fileName == null || fileName.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
      }
      Path destination = targetDir.resolve(fileName).normalize();
      if (!destination.startsWith(targetDir)) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
      }

      Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

      Company company = companyRepository.findById(companyId).orElse(null);
      User createdBy = null;
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
        Long userId = jwtService.extractUserId(authHeader.substring(7).trim());
        if (userId != null) {
          createdBy = userRepository.findById(userId).orElse(null);
        }
      }
      if (createdBy == null) {
        createdBy = userRepository.findAll().stream().findFirst().orElse(null);
      }

      if (company != null && createdBy != null) {
        Contract contract = new Contract();
        contract.setCompany(company);
        contract.setCreatedBy(createdBy);
        contract.setType(ContractType.OTHER);
        contract.setStatus(ContractStatus.DRAFT);
        contract.setFilePath(companyFolder + "/OtherTypesContracts" + (relativePath == null || relativePath.isBlank() ? "" : "/" + relativePath.replace('\\', '/').replaceAll("^/|/$", "")) + "/" + fileName);
        contract.setCreatedAt(LocalDateTime.now());
        contract.setUpdatedAt(LocalDateTime.now());
        contractRepository.save(contract);
      }

      return ResponseEntity.ok(Map.of(
          "message", "File uploaded successfully",
          "path", destination.toString(),
          "fileName", fileName));
    } catch (IOException e) {
      return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed"));
    }
  }

  @PostMapping("/createOtherSubfolder")
  public ResponseEntity<?> createOtherSubfolder(
      @RequestParam("companyFolder") String companyFolder,
      @RequestParam("folderName") String folderName,
      @RequestParam(value = "relativePath", required = false) String relativePath) {
    try {
      if (folderName == null || folderName.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Folder name is required"));
      }

      String safeFolderName = folderName.replaceAll("[\\\\/:*?\"<>|]", "").trim();
      if (safeFolderName.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Folder name is invalid"));
      }

      Path baseDir = Path.of(FILE_SYSTEM_PATH, companyFolder, "OtherTypesContracts").toAbsolutePath().normalize();
      Files.createDirectories(baseDir);

      Path targetDir = baseDir;
      if (relativePath != null && !relativePath.isBlank()) {
        String safeRelativePath = relativePath.replace('\\', '/').replaceAll("^/|/$", "");
        if (safeRelativePath.contains("..")) {
          return ResponseEntity.badRequest().body(Map.of("message", "Invalid folder path"));
        }
        targetDir = baseDir.resolve(safeRelativePath).normalize();
        if (!targetDir.startsWith(baseDir)) {
          return ResponseEntity.badRequest().body(Map.of("message", "Invalid folder path"));
        }
        Files.createDirectories(targetDir);
      }

      Path newFolder = targetDir.resolve(safeFolderName).normalize();
      if (!newFolder.startsWith(targetDir)) {
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid folder name"));
      }
      Files.createDirectories(newFolder);

      return ResponseEntity.ok(Map.of(
          "message", "Folder created successfully",
          "path", newFolder.toString()));
    } catch (IOException e) {
      return ResponseEntity.internalServerError().body(Map.of("message", "Folder creation failed"));
    }
  }

  @GetMapping("/preview")
  public ResponseEntity<byte[]> previewFile(@RequestParam("path") String filePath) {
    try {
      Path basePath = Path.of(FILE_SYSTEM_PATH).toAbsolutePath().normalize();
      Path resolvedPath = filePath == null || filePath.isBlank()
          ? null
          : (Path.of(filePath).isAbsolute()
              ? Path.of(filePath).normalize()
              : basePath.resolve(filePath).normalize());

      if (resolvedPath == null || !Files.exists(resolvedPath) || !Files.isRegularFile(resolvedPath)) {
        return ResponseEntity.notFound().build();
      }

      if (!resolvedPath.startsWith(basePath)) {
        return ResponseEntity.badRequest().build();
      }

      byte[] content = Files.readAllBytes(resolvedPath);
      String fileName = resolvedPath.getFileName().toString().toLowerCase();
      MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

      if (fileName.endsWith(".pdf")) {
        mediaType = MediaType.APPLICATION_PDF;
      } else if (fileName.endsWith(".png")) {
        mediaType = MediaType.IMAGE_PNG;
      } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
        mediaType = MediaType.IMAGE_JPEG;
      } else if (fileName.endsWith(".gif")) {
        mediaType = MediaType.IMAGE_GIF;
      } else if (fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".xml") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
        mediaType = MediaType.TEXT_PLAIN;
      } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
        mediaType = MediaType.TEXT_HTML;
      }

      return ResponseEntity.ok()
          .contentType(mediaType)
          .header("Content-Disposition", "inline; filename=\"" + resolvedPath.getFileName() + "\"")
          .body(content);
    } catch (IOException e) {
      return ResponseEntity.internalServerError().build();
    }
  }
}
