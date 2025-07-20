package com.farmovo.backend.validator;

import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.repositories.ZoneRepository;
import org.springframework.stereotype.Component;

@Component
public class ZoneValidation {
    private static ZoneRepository zoneRepository;  // Inject ZoneRepository
    // Constructor để inject ZoneRepository
    public ZoneValidation(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public static void validateZoneName(String zoneName) {
        if (zoneName == null || zoneName.isEmpty() ) {
            throw new ValidationException("ZoneName cannot be empty");
        }
        if (zoneName.length() > 100) {
            throw new ValidationException("ZoneName must be < 101 characters");
        }
        if (isZoneNameExist(zoneName)) {
            throw new ValidationException("Zone name already exists.");
        }
    }

    public static void validateZoneDescription (String zoneDescription) {
        if (zoneDescription != null ) {
            if (zoneDescription.length() > 1000) {
                throw new ValidationException("zoneDescription must be < 1001 characters");
            }
        }
    }
    // Phương thức kiểm tra tên zone có tồn tại trong cơ sở dữ liệu không
    private static boolean isZoneNameExist(String zoneName) {
        return zoneRepository.findByZoneName(zoneName).isPresent();
    }
}
