###
# Dockerfile to build and run both React UI and .NET API in one container
###
# Stage 1: Build React UI
FROM node:18-alpine AS ui-build
WORKDIR /app
# Copy only package manifests and install
COPY package.json package-lock.json ./
# Copy configuration files for PostCSS, Tailwind, and TypeScript
COPY postcss.config.js tailwind.config.js tsconfig.json ./
RUN npm ci
# Copy UI source
COPY public ./public
COPY src ./src
# Build production React assets
RUN npm run build

# Stage 2: Build .NET 9 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-build
WORKDIR /src
# Copy project files and restore
COPY server/*.csproj ./server/
RUN dotnet restore server/FoldsAndFlavors.API.csproj
# Copy API source and publish
COPY server/. ./server/
WORKDIR /src/server
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
# Configure listening port
ENV ASPNETCORE_URLS http://+:4000
EXPOSE 4000
# Copy API
COPY --from=dotnet-build /app/publish .
# Copy React build into wwwroot
COPY --from=ui-build /app/build ./wwwroot

ENTRYPOINT ["dotnet", "FoldsAndFlavors.API.dll"]