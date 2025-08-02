package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Zone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ZoneRepository extends JpaRepository<Zone, Long> {
    java.util.List<Zone> findAllByStore_Id(Long storeId);
}