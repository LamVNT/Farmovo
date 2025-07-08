package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Stocktake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long> {
} 