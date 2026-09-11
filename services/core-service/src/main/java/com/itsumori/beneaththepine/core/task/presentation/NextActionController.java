package com.itsumori.beneaththepine.core.task.presentation;

import com.itsumori.beneaththepine.core.shared.security.AuthenticatedUser;
import com.itsumori.beneaththepine.core.task.application.CreateNextAction;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/next-actions")
class NextActionController {
    private final CreateNextAction createNextAction;

    NextActionController(CreateNextAction createNextAction) {
        this.createNextAction = createNextAction;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CreateNextActionResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateNextActionRequest request
    ) {
        CreateNextAction.Result result = createNextAction.execute(new CreateNextAction.Command(
                AuthenticatedUser.id(authentication),
                request.title(),
                request.minutes(),
                request.sourceBrainDumpId()
        ));
        return CreateNextActionResponse.from(result);
    }
}
