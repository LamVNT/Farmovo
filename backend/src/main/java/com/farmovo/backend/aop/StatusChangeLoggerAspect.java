package com.farmovo.backend.aop;

import com.farmovo.backend.services.ChangeStatusLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.lang.reflect.Method;
import java.util.Optional;

@Aspect
@Component
@RequiredArgsConstructor
public class StatusChangeLoggerAspect {

    private static final Logger log = LogManager.getLogger(StatusChangeLoggerAspect.class);
    private final ApplicationContext applicationContext;
    private final ChangeStatusLogService logService;

    static class StatusHolder {
        static ThreadLocal<String> previousStatus = new ThreadLocal<>();
        static ThreadLocal<String> modelName = new ThreadLocal<>();
        static ThreadLocal<Long> modelId = new ThreadLocal<>();
    }

    @Before("@annotation(com.farmovo.backend.aop.LogStatusChange) && args(id,..)")
    public void capturePreviousStatus(JoinPoint joinPoint, Long id) {
        try {
            Object target = joinPoint.getTarget();
            String className = target.getClass().getSimpleName();
            String entityName = className.replace("ServiceImpl", "");
            
            // Tìm repository an toàn hơn
            Object repository = findRepository(entityName);
            if (repository == null) {
                log.warn("Repository not found for entity: {}", entityName);
                return;
            }

            // Lấy entity và status
            Optional<?> entityOpt = findEntityById(repository, id);
            if (entityOpt.isPresent()) {
                Object entity = entityOpt.get();
                String status = getEntityStatus(entity);
                
                StatusHolder.previousStatus.set(status);
                StatusHolder.modelName.set(entityName);
                StatusHolder.modelId.set(id);
                
                log.debug("Captured previous status: {} for entity: {} with id: {}", status, entityName, id);
            }
        } catch (Exception e) {
            log.error("Error capturing previous status for id: {}", id, e);
            cleanupThreadLocal();
        }
    }

    @AfterReturning("@annotation(com.farmovo.backend.aop.LogStatusChange) && args(id,..)")
    public void logStatusChange(JoinPoint joinPoint, Long id) {
        try {
            String entityName = StatusHolder.modelName.get();
            Long modelId = StatusHolder.modelId.get();
            String previousStatus = StatusHolder.previousStatus.get();

            if (entityName == null || modelId == null || previousStatus == null) {
                log.warn("Missing status holder data for id: {}", id);
                return;
            }

            Object repository = findRepository(entityName);
            if (repository == null) {
                log.warn("Repository not found for entity: {}", entityName);
                return;
            }

            Optional<?> entityOpt = findEntityById(repository, id);
            if (entityOpt.isPresent()) {
                Object entity = entityOpt.get();
                String nextStatus = getEntityStatus(entity);
                
                if (!previousStatus.equals(nextStatus)) {
                    String description = String.format("[%s] Đã chuyển trạng thái từ %s sang %s", entityName, previousStatus, nextStatus);
                    logService.logStatusChange(entityName, modelId, previousStatus, nextStatus, description);
                    log.info("Status change logged: {} -> {} for {} with id: {}", previousStatus, nextStatus, entityName, modelId);
                } else {
                    log.debug("No status change detected for {} with id: {}", entityName, modelId);
                }
            }
        } catch (Exception e) {
            log.error("Error logging status change for id: {}", id, e);
        } finally {
            cleanupThreadLocal();
        }
    }

    @AfterThrowing("@annotation(com.farmovo.backend.aop.LogStatusChange)")
    public void cleanupOnException() {
        cleanupThreadLocal();
    }

    private Object findRepository(String entityName) {
        try {
            // Thử tìm repository theo convention
            String repositoryBeanName = Character.toLowerCase(entityName.charAt(0)) + entityName.substring(1) + "Repository";
            return applicationContext.getBean(repositoryBeanName);
        } catch (Exception e) {
            log.warn("Repository not found for entity: {}", entityName);
            return null;
        }
    }

    private Optional<?> findEntityById(Object repository, Long id) {
        try {
            Method findById = repository.getClass().getMethod("findById", Object.class);
            return (Optional<?>) findById.invoke(repository, id);
        } catch (Exception e) {
            log.error("Error finding entity by id: {}", id, e);
            return Optional.empty();
        }
    }

    private String getEntityStatus(Object entity) {
        try {
            Method getStatus = entity.getClass().getMethod("getStatus");
            Object status = getStatus.invoke(entity);
            return status != null ? status.toString() : "null";
        } catch (Exception e) {
            log.error("Error getting status from entity: {}", entity.getClass().getSimpleName(), e);
            return "unknown";
        }
    }

    private void cleanupThreadLocal() {
        try {
            StatusHolder.previousStatus.remove();
            StatusHolder.modelName.remove();
            StatusHolder.modelId.remove();
        } catch (Exception e) {
            log.error("Error cleaning up ThreadLocal", e);
        }
    }
} 