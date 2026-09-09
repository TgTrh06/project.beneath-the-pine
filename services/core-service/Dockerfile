FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY core-service/pom.xml core-service/pom.xml
COPY core-service/src core-service/src
RUN --mount=type=cache,target=/root/.m2 chmod +x mvnw && ./mvnw -B -pl core-service -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 beneathpine
COPY --from=build /workspace/core-service/target/core-service-0.1.0-SNAPSHOT.jar app.jar
USER beneathpine
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
