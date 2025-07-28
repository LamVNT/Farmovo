package com.farmovo.backend.aop;

import com.farmovo.backend.services.ChangeStatusLogService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Optional;

@Aspect
@Component
public class StatusChangeLoggerAspect {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ChangeStatusLogService logService;

    static class StatusHolder {
        static ThreadLocal<String> previousStatus = new ThreadLocal<>();
        static ThreadLocal<String> modelName = new ThreadLocal<>();
        static ThreadLocal<Long> modelId = new ThreadLocal<>();
    }

    @Before("@annotation(com.farmovo.backend.aop.LogStatusChange) && args(id,..)")
    public void capturePreviousStatus(JoinPoint joinPoint, Long id) throws Exception {
        Object target = joinPoint.getTarget();
        String className = target.getClass().getSimpleName();
        String entityName = className.replace("ServiceImpl", "");
        String repositoryBeanName = Character.toLowerCase(entityName.charAt(0)) + entityName.substring(1) + "Repository";
        Object repository = applicationContext.getBean(repositoryBeanName);

        Method findById = repository.getClass().getMethod("findById", Object.class);
        Optional<?> entityOpt = (Optional<?>) findById.invoke(repository, id);
        if (entityOpt.isPresent()) {
            Object entity = entityOpt.get();
            Method getStatus = entity.getClass().getMethod("getStatus");
            String status = String.valueOf(getStatus.invoke(entity));
            StatusHolder.previousStatus.set(status);
            StatusHolder.modelName.set(entityName);
            StatusHolder.modelId.set(id);
        }
    }

    @AfterReturning("@annotation(com.farmovo.backend.aop.LogStatusChange) && args(id,..)")
    public void logStatusChange(JoinPoint joinPoint, Long id) throws Exception {
        String entityName = StatusHolder.modelName.get();
        Long modelId = StatusHolder.modelId.get();
        String previousStatus = StatusHolder.previousStatus.get();

        if (entityName == null || modelId == null || previousStatus == null) return;

        String repositoryBeanName = Character.toLowerCase(entityName.charAt(0)) + entityName.substring(1) + "Repository";
        Object repository = applicationContext.getBean(repositoryBeanName);

        Method findById = repository.getClass().getMethod("findById", Object.class);
        Optional<?> entityOpt = (Optional<?>) findById.invoke(repository, id);
        if (entityOpt.isPresent()) {
            Object entity = entityOpt.get();
            Method getStatus = entity.getClass().getMethod("getStatus");
            String nextStatus = String.valueOf(getStatus.invoke(entity));
            if (!previousStatus.equals(nextStatus)) {
                String description = String.format("[%s] Đã chuyển trạng thái từ %s sang %s", entityName, previousStatus, nextStatus);
                logService.logStatusChange(entityName, modelId, previousStatus, nextStatus, description);
            }
        }

        StatusHolder.previousStatus.remove();
        StatusHolder.modelName.remove();
        StatusHolder.modelId.remove();
    }
} 