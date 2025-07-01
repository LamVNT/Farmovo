package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE c.deletedAt IS NULL")
    List<Customer> findAllActive();

    @Query("SELECT c FROM Customer c WHERE c.id = :id AND c.deletedAt IS NULL")
    Customer findByIdAndActive(Long id);

    @Query("SELECT c FROM Customer c WHERE c.name LIKE %:name% AND c.deletedAt IS NULL")
    List<Customer> findByNameContainingIgnoreCaseAndActive(String name);
}