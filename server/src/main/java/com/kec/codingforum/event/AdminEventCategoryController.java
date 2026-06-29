package com.kec.codingforum.event;

import com.kec.codingforum.event.dto.CreateEventCategoryRequest;
import com.kec.codingforum.event.dto.EventCategoryDto;
import com.kec.codingforum.event.dto.UpdateCategoryStatusRequest;
import com.kec.codingforum.event.dto.UpdateEventCategoryRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/event-categories")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminEventCategoryController {

    private final EventCategoryService categoryService;

    public AdminEventCategoryController(EventCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<EventCategoryDto> list(@RequestParam(required = false) Boolean active, @RequestParam(required = false) String search) {
        return categoryService.list(active, search);
    }

    @PostMapping
    public EventCategoryDto create(@Valid @RequestBody CreateEventCategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    public EventCategoryDto update(@PathVariable Long id, @Valid @RequestBody UpdateEventCategoryRequest request) {
        return categoryService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public EventCategoryDto updateStatus(@PathVariable Long id, @RequestBody UpdateCategoryStatusRequest request) {
        return categoryService.updateStatus(id, request);
    }
}
