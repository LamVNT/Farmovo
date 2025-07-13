package com.farmovo.backend.validator;

import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.repositories.ZoneRepository;
import org.springframework.stereotype.Component;

@Component
public class ZoneValidation {
    private static final String ZONE_PATTERN = "^Z_\\[\\d+;\\d+\\]$";
    private static ZoneRepository zoneRepository;  // Inject ZoneRepository
    // Constructor để inject ZoneRepository
    public ZoneValidation(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public static void validateZoneName(String zoneName) {
        // đúng formate zoneName
        if (zoneName == null || !zoneName.matches(ZONE_PATTERN)) {
            throw new ValidationException("ZoneName must follow pattern Z_[row;column] (e.g: Z_[1;2])");
        }
        // Kiểm tra độ dài của zoneName (phải < 100 ký tự)
        if (zoneName.length() > 100) {
            throw new ValidationException("ZoneName must < 101 characters");
        }

        //  trùng lặp
        if (isZoneNameExist(zoneName)) {
            throw new ValidationException("Zone name already exists.");
        }
    }

    // Phương thức kiểm tra tên zone có tồn tại trong cơ sở dữ liệu không
    private static boolean isZoneNameExist(String zoneName) {
        return zoneRepository.findByZoneName(zoneName).isPresent();
    }
}
