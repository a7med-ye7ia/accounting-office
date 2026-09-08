package com.accounting.backend.controllers;

import com.accounting.backend.dto.AttachmentResponse;
import com.accounting.backend.entities.User;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.AttachmentService;
import com.accounting.backend.services.AttachmentService.DownloadedAttachment;
import com.accounting.backend.services.AttachmentService.FileTooLargeException;
import com.accounting.backend.services.AuthorizationService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final AuthorizationService authorizationService;

    public AttachmentController(AttachmentService attachmentService, AuthorizationService authorizationService) {
        this.attachmentService = attachmentService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<?> list(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long taskId) {
        return handle(() -> ResponseEntity.ok(attachmentService.list(taskId, authenticatedUser(authHeader))));
    }

    @PostMapping(value = "/tasks/{taskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long taskId,
            @RequestParam("files") List<MultipartFile> files) {
        return handle(() -> ResponseEntity.ok(attachmentService.upload(taskId, files, authenticatedUser(authHeader))));
    }

    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<?> download(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long attachmentId) {
        return handle(() -> {
            DownloadedAttachment downloaded = attachmentService.load(attachmentId, authenticatedUser(authHeader));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(downloaded.contentType()));
            boolean inline = downloaded.contentType().startsWith("image/")
                    || "application/pdf".equals(downloaded.contentType());
            headers.setContentDisposition((inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                    .filename(downloaded.originalFileName(), StandardCharsets.UTF_8)
                    .build());
            return ResponseEntity.ok().headers(headers).body(downloaded.resource());
        });
    }

    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long attachmentId) {
        return handle(() -> {
            attachmentService.delete(attachmentId, authenticatedUser(authHeader));
            return ResponseEntity.noContent().build();
        });
    }

    private User authenticatedUser(String authHeader) {
        return authorizationService.requireAuthenticatedUser(authHeader);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSize(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.valueOf(413))
                .body(Map.of("error", "File exceeds the maximum upload size of 10 MB"));
    }

    private ResponseEntity<?> handle(ControllerAction action) {
        try {
            return action.run();
        } catch (FileTooLargeException | MaxUploadSizeExceededException e) {
            return ResponseEntity.status(HttpStatus.valueOf(413)).body(Map.of("error", e.getMessage()));
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getReason()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")
                    ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    @FunctionalInterface
    private interface ControllerAction {
        ResponseEntity<?> run();
    }
}
