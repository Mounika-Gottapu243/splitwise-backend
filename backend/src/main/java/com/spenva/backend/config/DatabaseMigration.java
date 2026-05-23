package com.spenva.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

@Component
public class DatabaseMigration implements CommandLineRunner {

    @Autowired
    private DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            List<String> dropStatements = new ArrayList<>();
            
            // Query constraint name from information_schema
            String findConstraintsSql = "SELECT constraint_name " +
                    "FROM information_schema.constraint_column_usage " +
                    "WHERE table_name = 'friends' AND column_name = 'email'";
            
            try (ResultSet rs = stmt.executeQuery(findConstraintsSql)) {
                while (rs.next()) {
                    String constraintName = rs.getString("constraint_name");
                    if (constraintName != null && !constraintName.endsWith("_pkey")) {
                        dropStatements.add("ALTER TABLE friends DROP CONSTRAINT IF EXISTS " + constraintName);
                    }
                }
            }
            
            // Also search pg_indexes if we are on PostgreSQL
            String dbProductName = conn.getMetaData().getDatabaseProductName();
            if ("PostgreSQL".equalsIgnoreCase(dbProductName)) {
                String findIndexesSql = "SELECT indexname FROM pg_indexes WHERE tablename = 'friends' AND indexdef LIKE '%email%' AND indexdef LIKE '%UNIQUE%'";
                try (ResultSet rs = stmt.executeQuery(findIndexesSql)) {
                    while (rs.next()) {
                        String indexName = rs.getString("indexname");
                        if (indexName != null) {
                            dropStatements.add("DROP INDEX IF EXISTS " + indexName);
                        }
                    }
                }
            }

            for (String sql : dropStatements) {
                try {
                    System.out.println("Executing migration: " + sql);
                    stmt.execute(sql);
                } catch (Exception e) {
                    System.err.println("Could not execute migration step: " + sql + ". Error: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Database migration check failed: " + e.getMessage());
        }
    }
}
