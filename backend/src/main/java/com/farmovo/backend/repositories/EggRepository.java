package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Egg;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EggRepository extends JpaRepository<Egg, Long> {}