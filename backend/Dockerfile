# Build stage
FROM maven:3.8.4-openjdk-17 AS build

WORKDIR /app

# Copy pom.xml
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM amazoncorretto:17-alpine

WORKDIR /app

# Copy jar file
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Start the application
CMD ["java", "-jar", "app.jar"]
