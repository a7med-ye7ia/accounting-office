package com.accounting.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Checking database migrations...");
        runScript("db/migration/V1__create_department_manager_departments.sql");
        runScript("db/migration/V2__add_company_branch_dept_and_task_company.sql");
    }

    private void runScript(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                String sql = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                // Execute entire script as a single command in PostgreSQL
                jdbcTemplate.execute(sql);
                log.info("Database migration {} executed successfully.", path);
            }
        } catch (Exception e) {
            log.error("Failed to run database migration {}: {}", path, e.getMessage());
        }
    }
}
