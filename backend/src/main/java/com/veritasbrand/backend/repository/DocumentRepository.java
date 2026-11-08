package com.veritasbrand.backend.repository;

import com.veritasbrand.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {
}