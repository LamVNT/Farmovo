package com.farmovo.backend.mapper;


import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.models.ChangeStatusLog;
import org.mapstruct.Mapper;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ChangeStatusLogMapper {
    ChangeStatusLogResponseDTO toDto(ChangeStatusLog log);

    List<ChangeStatusLogResponseDTO> toDtoList(List<ChangeStatusLog> logs);
}

