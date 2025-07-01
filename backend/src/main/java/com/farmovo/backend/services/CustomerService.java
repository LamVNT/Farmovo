package com.farmovo.backend.services;
import java.util.List;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.models.Customer;

public interface CustomerService {
    List<CustomerDto> getAllCustomerDto();
}
