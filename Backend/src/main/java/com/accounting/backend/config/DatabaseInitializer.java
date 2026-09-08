package com.accounting.backend.config;

import com.accounting.backend.entities.Role;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void run(String... args) {
        log.info("Checking database migrations...");
        runScript("db/migration/V1__create_department_manager_departments.sql");
        runScript("db/migration/V2__add_company_branch_dept_and_task_company.sql");
        runScript("db/migration/V3__create_task_attachments.sql");
        seedDefaultRolesAndOwner();
    }

    private void runScript(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                String sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                jdbcTemplate.execute(sql);
                log.info("Database migration {} executed successfully.", path);
            }
        } catch (Exception e) {
            log.error("Failed to run database migration {}: {}", path, e.getMessage());
        }
    }

    private void seedDefaultRolesAndOwner() {
        try {
            ensureRole("owner");
            ensureRole("headBranch");
            ensureRole("headDepartment");
            ensureRole("employee");

            if (userRepository.count() == 0) {
                User owner = new User();
                owner.setFullName("Owner");
                owner.setEmail("owner@g.com");
                owner.setPassword(passwordEncoder.encode("123456"));
                owner.setStatus(UserStatus.ACTIVE);
                owner.setCreatedAt(LocalDateTime.now());
                owner.setUpdatedAt(LocalDateTime.now());
                User savedOwner = userRepository.save(owner);

                Role ownerRole = roleRepository.findAll().stream()
                        .filter(r -> "owner".equalsIgnoreCase(r.getName()))
                        .findFirst()
                        .orElse(null);

                if (ownerRole != null) {
                    UserRole userRole = new UserRole();
                    userRole.setId(new UserRoleId(savedOwner.getId(), ownerRole.getId()));
                    userRole.setUser(savedOwner);
                    userRole.setRole(ownerRole);
                    userRoleRepository.save(userRole);
                }

                log.info("Seeded default owner account: owner@g.com / 123456");
            }
        } catch (Exception e) {
            log.error("Failed to seed default roles and owner account: {}", e.getMessage());
        }
    }

    private void ensureRole(String name) {
        if (name == null || name.isBlank()) {
            return;
        }

        boolean exists = roleRepository.findAll().stream()
                .anyMatch(r -> name.equalsIgnoreCase(r.getName()));

        if (!exists) {
            Role role = new Role();
            role.setName(name);
            role.setLevel(0);
            roleRepository.save(role);
        }
    }
}
