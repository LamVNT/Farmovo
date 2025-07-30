package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.ChangeStatusLogResponseDTO;
import com.farmovo.backend.dto.response.SourceEntityInfo;
import com.farmovo.backend.models.ChangeStatusLog;
import com.farmovo.backend.services.SourceEntityResolverService;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class ChangeStatusLogMapper {

    @Autowired
    protected SourceEntityResolverService sourceEntityResolverService;

    @Mapping(target = "sourceName", expression = "java(getSourceName(log))")
    @Mapping(target = "sourceType", expression = "java(getSourceType(log))")
    @Mapping(target = "sourceUrl", expression = "java(getSourceUrl(log))")
    public abstract ChangeStatusLogResponseDTO toDto(ChangeStatusLog log);

    public abstract List<ChangeStatusLogResponseDTO> toDtoList(List<ChangeStatusLog> logs);

    protected String getSourceName(ChangeStatusLog log) {
        SourceEntityInfo info = sourceEntityResolverService.resolveSourceEntity(log.getModelName(), log.getModelID());
        return info.getSourceName();
    }

    protected String getSourceType(ChangeStatusLog log) {
        SourceEntityInfo info = sourceEntityResolverService.resolveSourceEntity(log.getModelName(), log.getModelID());
        return info.getSourceType();
    }

    protected String getSourceUrl(ChangeStatusLog log) {
        SourceEntityInfo info = sourceEntityResolverService.resolveSourceEntity(log.getModelName(), log.getModelID());
        return info.getSourceUrl();
    }
}