package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {
}