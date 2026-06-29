package com.kec.codingforum.points;

import com.kec.codingforum.registration.Registration;
import com.kec.codingforum.registration.RegistrationRepository;
import com.kec.codingforum.result.Result;
import com.kec.codingforum.result.ResultPointPolicyService;
import com.kec.codingforum.user.Student;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentPointService {

    private final StudentPointRepository studentPoints;
    private final RegistrationRepository registrations;
    private final ResultPointPolicyService pointPolicy;

    public StudentPointService(
            StudentPointRepository studentPoints,
            RegistrationRepository registrations,
            ResultPointPolicyService pointPolicy
    ) {
        this.studentPoints = studentPoints;
        this.registrations = registrations;
        this.pointPolicy = pointPolicy;
    }

    @Transactional
    public void awardPointsForResult(Result result) {
        replacePointsForResult(result);
    }

    @Transactional
    public void replacePointsForResult(Result result) {
        deletePointsForResult(result);
        int points = pointPolicy.calculatePoints(result.getResultType(), result.getEvent());
        if (result.getStudent() != null) {
            insertPoint(result, result.getStudent(), points);
            return;
        }
        List<Registration> teamRegistrations = registrations.findByEventIdAndTeamIdAndStatus(
                result.getEvent().getId(),
                result.getTeam().getId(),
                "REGISTERED"
        );
        for (Registration registration : teamRegistrations) {
            insertPoint(result, registration.getStudent(), points);
        }
    }

    @Transactional
    public void deletePointsForResult(Result result) {
        studentPoints.deleteByReason(reason(result));
    }

    private void insertPoint(Result result, Student student, int points) {
        studentPoints.deleteByStudentIdAndEventIdAndReason(student.getId(), result.getEvent().getId(), reason(result));
        StudentPoint point = new StudentPoint();
        point.setStudent(student);
        point.setEvent(result.getEvent());
        point.setCategory(result.getEvent().getCategory());
        point.setDepartment(student.getDepartment());
        point.setPoints(points);
        point.setPointType(pointPolicy.toPointType(result.getResultType()));
        point.setReason(reason(result));
        studentPoints.save(point);
    }

    public String reason(Result result) {
        return "RESULT:" + result.getId();
    }
}
