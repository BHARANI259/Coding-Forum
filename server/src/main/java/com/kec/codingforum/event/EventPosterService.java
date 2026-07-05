package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventPosterDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EventPosterService {

    private static final long MAX_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final EventRepository events;
    private final Path posterDir;

    public EventPosterService(
            EventRepository events,
            @Value("${app.uploads.root-dir:uploads}") String rootDir,
            @Value("${app.uploads.event-posters-dir:event-posters}") String eventPostersDir
    ) {
        this.events = events;
        this.posterDir = Paths.get(rootDir).resolve(eventPostersDir).toAbsolutePath().normalize();
    }

    @Transactional
    public EventPosterDto upload(Long eventId, MultipartFile file) {
        Event event = findEvent(eventId);
        validate(file);
        try {
            Files.createDirectories(posterDir);
            deleteExistingFile(event);
            String contentType = normalizeContentType(file.getContentType());
            String storageName = "event-" + eventId + "-" + UUID.randomUUID() + EXTENSIONS.get(contentType);
            Path target = posterDir.resolve(storageName).normalize();
            if (!target.startsWith(posterDir)) {
                throw new IllegalArgumentException("Invalid poster file name.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            event.setPosterImageUrl("/api/public/event-posters/" + storageName);
            event.setPosterOriginalName(safeOriginalName(file.getOriginalFilename()));
            event.setPosterContentType(contentType);
            event.setPosterSizeBytes(file.getSize());
            event.setPosterUploadedAt(LocalDateTime.now());
            event.setUpdatedAt(LocalDateTime.now());
            return toDto(event);
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to store poster image.");
        }
    }

    @Transactional
    public EventPosterDto remove(Long eventId) {
        Event event = findEvent(eventId);
        deleteExistingFile(event);
        event.setPosterImageUrl(null);
        event.setPosterOriginalName(null);
        event.setPosterContentType(null);
        event.setPosterSizeBytes(null);
        event.setPosterUploadedAt(null);
        event.setUpdatedAt(LocalDateTime.now());
        return toDto(event);
    }

    @Transactional(readOnly = true)
    public PosterResource load(String fileName) {
        String safeName = safeFileName(fileName);
        Path file = posterDir.resolve(safeName).normalize();
        if (!file.startsWith(posterDir) || !Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Poster image not found.");
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
                contentType = contentTypeFromExtension(safeName);
            }
            return new PosterResource(resource, contentType);
        } catch (MalformedURLException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Poster image not found.");
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to read poster image.");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Poster image is required.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Poster image must be 5 MB or smaller.");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Poster image must be JPG, PNG, or WEBP.");
        }
        String originalName = safeOriginalName(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (!(originalName.endsWith(".jpg") || originalName.endsWith(".jpeg") || originalName.endsWith(".png") || originalName.endsWith(".webp"))) {
            throw new IllegalArgumentException("Poster image extension must be JPG, PNG, or WEBP.");
        }
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private void deleteExistingFile(Event event) {
        if (event.getPosterImageUrl() == null || event.getPosterImageUrl().isBlank()) {
            return;
        }
        String fileName = event.getPosterImageUrl().substring(event.getPosterImageUrl().lastIndexOf('/') + 1);
        try {
            Path existing = posterDir.resolve(safeFileName(fileName)).normalize();
            if (existing.startsWith(posterDir)) {
                Files.deleteIfExists(existing);
            }
        } catch (IOException ignored) {
            // Old poster cleanup should not block replacing metadata.
        }
    }

    private String safeOriginalName(String value) {
        if (value == null || value.isBlank()) {
            return "poster";
        }
        return Paths.get(value).getFileName().toString().replaceAll("[\\r\\n]", "").trim();
    }

    private String safeFileName(String fileName) {
        if (fileName == null || !fileName.matches("[A-Za-z0-9._-]+")) {
            throw new IllegalArgumentException("Poster image not found.");
        }
        return fileName;
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT).trim();
    }

    private String contentTypeFromExtension(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private EventPosterDto toDto(Event event) {
        return new EventPosterDto(
                event.getId(),
                event.getPosterImageUrl(),
                event.getPosterOriginalName(),
                event.getPosterContentType(),
                event.getPosterSizeBytes(),
                event.getPosterUploadedAt()
        );
    }

    public record PosterResource(Resource resource, String contentType) {
    }
}
