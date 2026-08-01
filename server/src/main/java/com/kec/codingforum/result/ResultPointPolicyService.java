package com.kec.codingforum.result;

import com.kec.codingforum.event.Event;
import org.springframework.stereotype.Service;

@Service
public class ResultPointPolicyService {

    public int calculatePoints(String resultType, Event event) {
        if (event.getCategory() == null) {
            return switch (resultType) {
                case "WINNER" -> 100;
                case "RUNNER_UP" -> 60;
                case "SECOND_RUNNER_UP" -> 40;
                case "PARTICIPANT" -> 10;
                case "DISQUALIFIED", "NOT_PRESENTED" -> 0;
                default -> throw new IllegalArgumentException("Invalid result type.");
            };
        }
        return switch (resultType) {
            case "WINNER" -> event.getCategory().getWinnerPoints();
            case "RUNNER_UP" -> event.getCategory().getRunnerUpPoints();
            case "SECOND_RUNNER_UP" -> event.getCategory().getSecondRunnerUpPoints();
            case "PARTICIPANT" -> event.getCategory().getParticipantPoints();
            case "DISQUALIFIED" -> event.getCategory().getDisqualifiedPoints();
            case "NOT_PRESENTED" -> event.getCategory().getNotPresentedPoints();
            default -> throw new IllegalArgumentException("Invalid result type.");
        };
    }

    public String toPointType(String resultType) {
        if ("PARTICIPANT".equals(resultType)) {
            return "PARTICIPATION";
        }
        return resultType;
    }
}
