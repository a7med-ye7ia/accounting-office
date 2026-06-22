package com.accounting.backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Email Service
 * Sends emails using Spring's JavaMailSender (configured via
 * application.properties).
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Sends the temporary password to a newly created user.
     *
     * @param toEmail      the recipient's email address
     * @param fullName     the user's full name (used in the email body)
     * @param tempPassword the random temporary password to include in the email
     */
    public void sendTemporaryPasswordEmail(String toEmail, String fullName, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your Accounting Office Account – Temporary Password");
        message.setText(
                "Hello " + fullName + ",\n\n" +
                        "An account has been created for you in the Accounting Office system.\n\n" +
                        "Your temporary password is: " + tempPassword + "\n\n" +
                        "Please log in and change your password immediately.\n" +
                        "You will not be able to use the system until you verify your account by changing this password.\n\n"
                        +
                        "Best regards,\n" +
                        "Accounting Office System");
        mailSender.send(message);
    }
}
