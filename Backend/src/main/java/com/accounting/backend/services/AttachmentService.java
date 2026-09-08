package com.accounting.backend.services;

import com.accounting.backend.dto.AttachmentResponse;
import com.accounting.backend.entities.Attachment;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.repositories.AttachmentRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.services.FileStorageService.StoredFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AttachmentService {

    private static final long DEFAULT_MAX_SIZE = 10L * 1024 * 1024;
    private static final int DEFAULT_MAX_ATTACHMENTS = 10;
        private static final Map<String, Set<String>> ALLOWED_MIME_TYPES = Map.ofEntries(
            Map.entry(".jpg", Set.of("image/jpeg")),
            Map.entry(".jpeg", Set.of("image/jpeg")),
            Map.entry(".png", Set.of("image/png")),
            Map.entry(".webp", Set.of("image/webp")),
            Map.entry(".pdf", Set.of("application/pdf")),
            Map.entry(".doc", Set.of("application/msword")),
            Map.entry(".docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
            Map.entry(".txt", Set.of("text/plain")),
            Map.entry(".xls", Set.of("application/vnd.ms-excel")),
            Map.entry(".xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
            Map.entry(".csv", Set.of("text/csv", "application/csv", "application/vnd.ms-excel"))
        );

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final FileStorageService fileStorageService;
    private final AuthorizationService authorizationService;
    private final long maxFileSize;
    private final int maxAttachmentsPerTask;

    public AttachmentService(
            AttachmentRepository attachmentRepository,
            TaskRepository taskRepository,
            FileStorageService fileStorageService,
            AuthorizationService authorizationService,
            @Value("${app.file.max-size-bytes:10485760}") long maxFileSize,
            @Value("${app.file.max-attachments-per-task:10}") int maxAttachmentsPerTask) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.fileStorageService = fileStorageService;
        this.authorizationService = authorizationService;
        this.maxFileSize = maxFileSize > 0 ? maxFileSize : DEFAULT_MAX_SIZE;
        this.maxAttachmentsPerTask = maxAttachmentsPerTask > 0 ? maxAttachmentsPerTask : DEFAULT_MAX_ATTACHMENTS;
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> list(Long taskId, User caller) {
        Task task = requireTask(taskId);
        assertCanView(caller, task);
        return attachmentRepository.findByTask_IdOrderByCreatedAtDesc(taskId).stream()
                .map(AttachmentResponse::from)
                .toList();
    }

    @Transactional
    public List<AttachmentResponse> upload(Long taskId, List<MultipartFile> files, User caller) {
        Task task = requireTask(taskId);
        assertCanEdit(caller, task);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one file is required");
        }

        long existingCount = attachmentRepository.countByTask_Id(taskId);
        if (existingCount + files.size() > maxAttachmentsPerTask) {
            throw new IllegalStateException("Maximum of " + maxAttachmentsPerTask + " attachments per task is allowed");
        }

        List<StoredFile> storedFiles = new ArrayList<>();
        try {
            List<Attachment> saved = new ArrayList<>();
            for (MultipartFile file : files) {
                validateFile(file);
                StoredFile stored = fileStorageService.store(taskId, file);
                storedFiles.add(stored);

                Attachment attachment = new Attachment();
                attachment.setTask(task);
                attachment.setOriginalFileName(cleanOriginalName(stored.originalFileName()));
                attachment.setStoredFileName(stored.storedFileName());
                attachment.setFilePath(stored.relativePath());
                attachment.setContentType(file.getContentType().toLowerCase(Locale.ROOT));
                attachment.setFileSize(file.getSize());
                attachment.setUploadedBy(caller);
                attachment.setCreatedAt(java.time.LocalDateTime.now());
                saved.add(attachment);
            }
            return attachmentRepository.saveAll(saved).stream()
                    .map(AttachmentResponse::from)
                    .toList();
        } catch (RuntimeException error) {
            storedFiles.forEach(file -> fileStorageService.delete(file.relativePath()));
            throw error;
        }
    }

    @Transactional(readOnly = true)
    public DownloadedAttachment load(Long attachmentId, User caller) {
        Attachment attachment = requireAttachment(attachmentId);
        assertCanView(caller, attachment.getTask());
        Resource resource = fileStorageService.load(attachment.getFilePath());
        return new DownloadedAttachment(resource, attachment.getOriginalFileName(), attachment.getContentType());
    }

    @Transactional
    public void delete(Long attachmentId, User caller) {
        Attachment attachment = requireAttachment(attachmentId);
        assertCanEdit(caller, attachment.getTask());
        fileStorageService.delete(attachment.getFilePath());
        attachmentRepository.delete(attachment);
    }

    @Transactional
    public void cleanupTaskAttachments(Long taskId) {
        attachmentRepository.findByTask_IdOrderByCreatedAtDesc(taskId)
                .forEach(attachment -> fileStorageService.delete(attachment.getFilePath()));
        attachmentRepository.deleteByTask_Id(taskId);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Empty files are not allowed");
        }
        if (file.getSize() > maxFileSize) {
            throw new FileTooLargeException("File exceeds the maximum size of 10 MB");
        }
        String extension = fileStorageService.extensionOf(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        Set<String> allowedMimeTypes = ALLOWED_MIME_TYPES.get(extension);
        if (allowedMimeTypes == null || !allowedMimeTypes.contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type. Allowed files are images, PDF, Office documents, TXT, CSV, XLS, and XLSX");
        }
    }

    private String cleanOriginalName(String originalName) {
        String clean = java.nio.file.Paths.get(originalName).getFileName().toString();
        return clean.length() > 255 ? clean.substring(clean.length() - 255) : clean;
    }

    private Task requireTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
    }

    private Attachment requireAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
    }

    private void assertCanView(User caller, Task task) {
        if (caller == null || !authorizationService.canViewTask(caller.getId(), task)) {
            throw new SecurityException("You do not have permission to access this task");
        }
    }

    private void assertCanEdit(User caller, Task task) {
        if (caller == null || !authorizationService.canViewTask(caller.getId(), task)) {
            throw new SecurityException("You do not have permission to upload attachments for this task");
        }
    }

    public record DownloadedAttachment(Resource resource, String originalFileName, String contentType) { }

    public static class FileTooLargeException extends RuntimeException {
        public FileTooLargeException(String message) { super(message); }
    }
}
