package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.SourceEntityInfo;

public interface SourceEntityResolverService {
    SourceEntityInfo resolveSourceEntity(String modelName, Long modelId);
}
