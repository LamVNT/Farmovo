package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Stocktake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface StocktakeRepository extends JpaRepository<Stocktake, Long>, JpaSpecificationExecutor<Stocktake> {
    @Query("SELECT MAX(s.id) FROM Stocktake s")
    Long findMaxId();
} 