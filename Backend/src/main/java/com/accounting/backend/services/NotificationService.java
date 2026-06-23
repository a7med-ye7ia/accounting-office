package com.accounting.backend.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.accounting.backend.dtos.NotificationResponce;
import com.accounting.backend.entities.Notification;
import com.accounting.backend.entities.User;
import com.accounting.backend.repositories.NotificationRepository;
import com.accounting.backend.repositories.UserRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public void createNotification(
            Long userId,
            String title,
            String message, 
            com.accounting.backend.enums.NotificationType type,
            Long referenceId) {

        User user = userRepository.findById(userId)
                .orElseThrow();

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);

        notificationRepository.save(notification);
    }

    public List<NotificationResponce> getUserNotifications(Long userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId).stream().map(n -> new NotificationResponce(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getType(),
                n.getReferenceId(),
                n.getCreatedAt()))
        .toList();
    }

    public void markAsRead(Long notificationId) {
        Notification notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow();

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}