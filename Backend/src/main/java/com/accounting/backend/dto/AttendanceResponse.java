package com.accounting.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.accounting.backend.entities.Attendance;
import com.accounting.backend.enums.AttendanceStatus;

public class AttendanceResponse {

    private Long id;
    private Long userId;
    private String employeeName;
    private LocalDate workDate;
    private LocalDateTime startTime;
    private Double startLatitude;
    private Double startLongitude;
    private Double startAccuracy;
    private LocalDateTime endTime;
    private Double endLatitude;
    private Double endLongitude;
    private Double endAccuracy;
    private Integer workedMinutes;
    private AttendanceStatus status;

    public AttendanceResponse(Long id, Long userId, String employeeName, LocalDate workDate,
                              LocalDateTime startTime, Double startLatitude, Double startLongitude,
                              Double startAccuracy, LocalDateTime endTime, Double endLatitude,
                              Double endLongitude, Double endAccuracy, Integer workedMinutes,
                              AttendanceStatus status) {
        this.id = id;
        this.userId = userId;
        this.employeeName = employeeName;
        this.workDate = workDate;
        this.startTime = startTime;
        this.startLatitude = startLatitude;
        this.startLongitude = startLongitude;
        this.startAccuracy = startAccuracy;
        this.endTime = endTime;
        this.endLatitude = endLatitude;
        this.endLongitude = endLongitude;
        this.endAccuracy = endAccuracy;
        this.workedMinutes = workedMinutes;
        this.status = status;
    }

    public static AttendanceResponse from(Attendance attendance) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getUser().getId(),
                attendance.getUser().getFullName(),
                attendance.getWorkDate(),
                attendance.getStartTime(),
                attendance.getStartLatitude(),
                attendance.getStartLongitude(),
                attendance.getStartAccuracy(),
                attendance.getEndTime(),
                attendance.getEndLatitude(),
                attendance.getEndLongitude(),
                attendance.getEndAccuracy(),
                attendance.getWorkedMinutes(),
                attendance.getStatus()
        );
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getEmployeeName() { return employeeName; }
    public LocalDate getWorkDate() { return workDate; }
    public LocalDateTime getStartTime() { return startTime; }
    public Double getStartLatitude() { return startLatitude; }
    public Double getStartLongitude() { return startLongitude; }
    public Double getStartAccuracy() { return startAccuracy; }
    public LocalDateTime getEndTime() { return endTime; }
    public Double getEndLatitude() { return endLatitude; }
    public Double getEndLongitude() { return endLongitude; }
    public Double getEndAccuracy() { return endAccuracy; }
    public Integer getWorkedMinutes() { return workedMinutes; }
    public AttendanceStatus getStatus() { return status; }
}
