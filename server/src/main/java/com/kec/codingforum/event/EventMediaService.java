package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.EventMediaDto;
import com.kec.codingforum.event.dto.UpdateEventMediaRequest;
import com.kec.codingforum.user.User;
import com.kec.codingforum.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EventMediaService {

    private static final int MAX_FILES_PER_REQUEST = 10;
    private static final int MAX_ACTIVE_FILES_PER_EVENT = 50;
    private static final long MAX_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Set<String> MEDIA_TYPES = Set.of("PHOTO", "GEOTAG_SCREENSHOT", "PARTICIPANT_GROUP", "WINNER_PHOTO", "EVENT_PROOF", "OTHER");
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final EventRepository events;
    private final EventMediaRepository media;
    private final EventInchargeRepository incharges;
    private final UserRepository users;
    private final Path mediaDir;

    public EventMediaService(
            EventRepository events,
            EventMediaRepository media,
            EventInchargeRepository incharges,
            UserRepository users,
            @Value("${app.uploads.root-dir:uploads}") String rootDir,
            @Value("${app.uploads.event-media-dir:event-media}") String eventMediaDir
    ) {
        this.events = events;
        this.media = media;
        this.incharges = incharges;
        this.users = users;
        this.mediaDir = Paths.get(rootDir).resolve(eventMediaDir).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public List<EventMediaDto> adminList(Long eventId, boolean includeDeleted) {
        findEvent(eventId);
        return (includeDeleted ? media.findByEventIdOrderByUploadedAtDesc(eventId) : media.findByEventIdAndDeletedFalseOrderByUploadedAtDesc(eventId))
                .stream()
                .map(item -> toDto(item, adminFileUrl(eventId, item.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EventMediaDto> facultyList(Long eventId, Long facultyId) {
        requireAssigned(eventId, facultyId);
        return media.findByEventIdAndDeletedFalseOrderByUploadedAtDesc(eventId)
                .stream()
                .map(item -> toDto(item, facultyFileUrl(eventId, item.getId())))
                .toList();
    }

    @Transactional
    public List<EventMediaDto> adminUpload(Long eventId, Long userId, List<MultipartFile> files, String mediaType, String caption) {
        Event event = findEvent(eventId);
        assertNotCancelled(event);
        return upload(event, userId, files, mediaType, caption, true);
    }

    @Transactional
    public List<EventMediaDto> facultyUpload(Long eventId, Long facultyId, Long userId, List<MultipartFile> files, String mediaType, String caption) {
        Event event = requireAssigned(eventId, facultyId);
        if (!isCompleted(event)) {
            throw new IllegalArgumentException("Event media can be uploaded only after the event is completed.");
        }
        return upload(event, userId, files, mediaType, caption, false);
    }

    @Transactional
    public EventMediaDto adminUpdate(Long eventId, Long mediaId, UpdateEventMediaRequest request) {
        assertNotCancelled(findEvent(eventId));
        EventMedia item = findMedia(eventId, mediaId, false);
        applyMetadata(item, request);
        return toDto(item, adminFileUrl(eventId, mediaId));
    }

    @Transactional
    public EventMediaDto facultyUpdate(Long eventId, Long facultyId, Long userId, Long mediaId, UpdateEventMediaRequest request) {
        Event event = requireAssigned(eventId, facultyId);
        assertNotCancelled(event);
        EventMedia item = findMedia(eventId, mediaId, false);
        requireOwner(item, userId);
        applyMetadata(item, request);
        return toDto(item, facultyFileUrl(eventId, mediaId));
    }

    @Transactional
    public void adminDelete(Long eventId, Long mediaId, Long userId) {
        assertNotCancelled(findEvent(eventId));
        softDelete(findMedia(eventId, mediaId, false), userId);
    }

    @Transactional
    public void facultyDelete(Long eventId, Long facultyId, Long userId, Long mediaId) {
        Event event = requireAssigned(eventId, facultyId);
        assertNotCancelled(event);
        EventMedia item = findMedia(eventId, mediaId, false);
        requireOwner(item, userId);
        softDelete(item, userId);
    }

    @Transactional(readOnly = true)
    public MediaResource adminLoad(Long eventId, Long mediaId) {
        findEvent(eventId);
        return load(findMedia(eventId, mediaId, false));
    }

    @Transactional(readOnly = true)
    public MediaResource facultyLoad(Long eventId, Long facultyId, Long mediaId) {
        requireAssigned(eventId, facultyId);
        return load(findMedia(eventId, mediaId, false));
    }

    private List<EventMediaDto> upload(Event event, Long userId, List<MultipartFile> files, String mediaType, String caption, boolean admin) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one image file is required.");
        }
        if (files.size() > MAX_FILES_PER_REQUEST) {
            throw new IllegalArgumentException("Upload up to 10 images at a time.");
        }
        if (media.countByEventIdAndDeletedFalse(event.getId()) + files.size() > MAX_ACTIVE_FILES_PER_EVENT) {
            throw new IllegalArgumentException("An event can have up to 50 active media files.");
        }
        String normalizedType = validMediaType(mediaType);
        User uploader = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found."));
        try {
            Files.createDirectories(mediaDir);
            List<EventMediaDto> uploaded = new ArrayList<>();
            for (MultipartFile file : files) {
                validateFile(file);
                String contentType = normalize(file.getContentType());
                String storedName = "event-" + event.getId() + "-media-" + UUID.randomUUID() + EXTENSIONS.get(contentType);
                Path target = mediaDir.resolve(storedName).normalize();
                if (!target.startsWith(mediaDir)) {
                    throw new IllegalArgumentException("Invalid media file name.");
                }
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

                EventMedia item = new EventMedia();
                item.setEvent(event);
                item.setUploadedBy(uploader);
                item.setMediaType(normalizedType);
                item.setCaption(cleanCaption(caption));
                item.setOriginalFileName(safeOriginalName(file.getOriginalFilename()));
                item.setStoredFileName(storedName);
                item.setContentType(contentType);
                item.setSizeBytes(file.getSize());
                item.setFileUrl(admin ? adminFileUrl(event.getId(), 0L) : facultyFileUrl(event.getId(), 0L));
                EventMedia saved = media.save(item);
                saved.setFileUrl(admin ? adminFileUrl(event.getId(), saved.getId()) : facultyFileUrl(event.getId(), saved.getId()));
                uploaded.add(toDto(saved, saved.getFileUrl()));
            }
            return uploaded;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Unable to store event media.");
        }
    }

    private void applyMetadata(EventMedia item, UpdateEventMediaRequest request) {
        if (request.mediaType() != null && !request.mediaType().isBlank()) {
            item.setMediaType(validMediaType(request.mediaType()));
        }
        item.setCaption(cleanCaption(request.caption()));
    }

    private void softDelete(EventMedia item, Long userId) {
        User deleter = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found."));
        item.setDeleted(true);
        item.setDeletedAt(LocalDateTime.now());
        item.setDeletedBy(deleter);
    }

    private MediaResource load(EventMedia item) {
        Path file = mediaDir.resolve(safeFileName(item.getStoredFileName())).normalize();
        if (!file.startsWith(mediaDir) || !Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event media file not found.");
        }
        try {
            return new MediaResource(new UrlResource(file.toUri()), item.getContentType(), item.getOriginalFileName());
        } catch (MalformedURLException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event media file not found.");
        }
    }

    private Event findEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found."));
    }

    private void assertNotCancelled(Event event) {
        if ("CANCELLED".equals(event.getStatus())) {
            throw new IllegalArgumentException("Cancelled events are read-only.");
        }
    }

    private Event requireAssigned(Long eventId, Long facultyId) {
        return events.findByIdAndInchargesId(eventId, facultyId)
                .orElseThrow(() -> new AccessDeniedException("This event is not assigned to you."));
    }

    private EventMedia findMedia(Long eventId, Long mediaId, boolean includeDeleted) {
        EventMedia item = media.findByIdAndEventId(mediaId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event media not found."));
        if (!includeDeleted && item.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event media not found.");
        }
        return item;
    }

    private void requireOwner(EventMedia item, Long userId) {
        if (!item.getUploadedBy().getId().equals(userId)) {
            throw new AccessDeniedException("You can update only media uploaded by you.");
        }
    }

    private boolean isCompleted(Event event) {
        return "COMPLETED".equals(event.getStatus()) || event.isResultsPublished();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded media files must not be empty.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("Each media image must be 10 MB or smaller.");
        }
        String contentType = normalize(file.getContentType());
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Event media must be JPG, PNG, or WEBP images.");
        }
        String originalName = safeOriginalName(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
        if (!(originalName.endsWith(".jpg") || originalName.endsWith(".jpeg") || originalName.endsWith(".png") || originalName.endsWith(".webp"))) {
            throw new IllegalArgumentException("Event media extension must be JPG, PNG, or WEBP.");
        }
    }

    private String validMediaType(String value) {
        String candidate = value == null || value.isBlank() ? "PHOTO" : value.trim().toUpperCase(Locale.ROOT);
        if (!MEDIA_TYPES.contains(candidate)) {
            throw new IllegalArgumentException("Unsupported event media type.");
        }
        return candidate;
    }

    private String cleanCaption(String caption) {
        if (caption == null || caption.isBlank()) {
            return null;
        }
        String value = caption.trim();
        if (value.length() > 500) {
            throw new IllegalArgumentException("Caption must be 500 characters or fewer.");
        }
        return value;
    }

    private String safeOriginalName(String value) {
        if (value == null || value.isBlank()) {
            return "event-media";
        }
        return Paths.get(value).getFileName().toString().replaceAll("[\\r\\n]", "").trim();
    }

    private String safeFileName(String fileName) {
        if (fileName == null || !fileName.matches("[A-Za-z0-9._-]+")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event media file not found.");
        }
        return fileName;
    }

    private String normalize(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT).trim();
    }

    private String adminFileUrl(Long eventId, Long mediaId) {
        return "/api/admin/events/" + eventId + "/media/" + mediaId + "/file";
    }

    private String facultyFileUrl(Long eventId, Long mediaId) {
        return "/api/faculty/events/" + eventId + "/media/" + mediaId + "/file";
    }

    private EventMediaDto toDto(EventMedia item, String fileUrl) {
        return new EventMediaDto(
                item.getId(),
                item.getEvent().getId(),
                item.getMediaType(),
                item.getCaption(),
                item.getOriginalFileName(),
                item.getContentType(),
                item.getSizeBytes(),
                fileUrl,
                displayName(item.getUploadedBy()),
                item.getUploadedBy().getId(),
                item.getUploadedAt(),
                item.isDeleted()
        );
    }

    private String displayName(User user) {
        if (user.getFaculty() != null) {
            return user.getFaculty().getName();
        }
        if (user.getStudent() != null) {
            return user.getStudent().getName();
        }
        return user.getEmail();
    }

    public record MediaResource(Resource resource, String contentType, String originalFileName) {
    }
}
