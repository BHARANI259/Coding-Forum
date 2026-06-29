package com.kec.codingforum.result;

import com.kec.codingforum.event.Event;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class ResultPointPolicyService {

    private static final Map<String, Integer> BASE_POINTS = Map.of(
            "WINNER", 100,
            "RUNNER_UP", 60,
            "SECOND_RUNNER_UP", 40,
            "PARTICIPANT", 10,
            "DISQUALIFIED", 0
    );

    public int calculatePoints(String resultType, Event event) {
        Integer base = BASE_POINTS.get(resultType);
        if (base == null) {
            throw new IllegalArgumentException("Invalid result type.");
        }
        BigDecimal weightage = event.getCategory() == null ? BigDecimal.ONE : event.getCategory().getWeightage();
        return Math.round(weightage.multiply(BigDecimal.valueOf(base)).floatValue());
    }

    public String toPointType(String resultType) {
        if ("PARTICIPANT".equals(resultType)) {
            return "PARTICIPATION";
        }
        return resultType;
    }
}
