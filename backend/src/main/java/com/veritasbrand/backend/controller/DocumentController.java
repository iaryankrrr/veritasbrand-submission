package com.veritasbrand.backend.controller;

import com.veritasbrand.backend.entity.Document;
import com.veritasbrand.backend.entity.User;
import com.veritasbrand.backend.repository.DocumentRepository;
import com.veritasbrand.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/upload/{userId}")
    public ResponseEntity<Document> uploadDocument(@PathVariable Long userId, @RequestBody Document document) {
        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        document.setUploader(uploader);
        Document savedDocument = documentRepository.save(document);
        return ResponseEntity.ok(savedDocument);
    }

    @GetMapping
    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Document> updateDocumentStatus(@PathVariable Long id, @RequestBody String newStatus) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        document.setStatus(newStatus);
        Document updatedDocument = documentRepository.save(document);
        return ResponseEntity.ok(updatedDocument);
    }
}