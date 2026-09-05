package com.accounting.backend.services;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.accounting.backend.entities.Attendance;
import com.accounting.backend.entities.User;
import com.accounting.backend.dto.AttendanceResponse;
import com.accounting.backend.enums.AttendanceStatus;
import com.accounting.backend.repositories.AttendanceRepository;
import com.accounting.backend.repositories.UserRepository;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public AttendanceResponse startAttendance(Long userId, Double lat, Double lon, Double accuracy) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDate today = LocalDate.now();

        Optional<Attendance> existing = attendanceRepository.findByUser_IdAndWorkDate(userId, today);
        if (existing.isPresent()) {
            Attendance a = existing.get();
            if (a.getStatus() == AttendanceStatus.WORKING) {
                throw new IllegalStateException("تم تسجيل بدء العمل بالفعل.");
            }
            if (a.getStatus() == AttendanceStatus.COMPLETED) {
                throw new IllegalStateException("تم إنهاء العمل لهذا اليوم.");
            }
        }

        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setWorkDate(today);
        LocalDateTime now = LocalDateTime.now();
        attendance.setStartTime(now);
        attendance.setStartLatitude(lat);
        attendance.setStartLongitude(lon);
        attendance.setStartAccuracy(accuracy);
        attendance.setStatus(AttendanceStatus.WORKING);
        attendance.setCreatedAt(now);
        attendance.setUpdatedAt(now);

        return AttendanceResponse.from(attendanceRepository.save(attendance));
    }

    @Transactional
    public AttendanceResponse endAttendance(Long userId, Double lat, Double lon, Double accuracy) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByUser_IdAndWorkDate(userId, today)
                .orElseThrow(() -> new IllegalStateException("لا يوجد سجل حضور لهذا اليوم."));

        if (attendance.getStatus() == AttendanceStatus.COMPLETED) {
            throw new IllegalStateException("تم إنهاء العمل لهذا اليوم.");
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setEndTime(now);
        attendance.setEndLatitude(lat);
        attendance.setEndLongitude(lon);
        attendance.setEndAccuracy(accuracy);

        if (attendance.getStartTime() != null) {
            long minutes = Duration.between(attendance.getStartTime(), now).toMinutes();
            attendance.setWorkedMinutes(Math.toIntExact(minutes));
        }

        attendance.setStatus(AttendanceStatus.COMPLETED);
        attendance.setUpdatedAt(now);

        return AttendanceResponse.from(attendanceRepository.save(attendance));
    }

    @Transactional(readOnly = true)
    public Optional<AttendanceResponse> getTodayForUser(Long userId) {
        return attendanceRepository.findByUser_IdAndWorkDate(userId, LocalDate.now())
                .map(AttendanceResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAllToday() {
        return attendanceRepository.findAllByWorkDate(LocalDate.now()).stream()
                .map(AttendanceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getHistoryForUser(Long userId) {
        return attendanceRepository.findByUser_IdOrderByWorkDateDesc(userId).stream()
                .map(AttendanceResponse::from)
                .toList();
    }
}
