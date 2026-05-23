FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/backend/auth-service/AuthService.csproj", "src/backend/auth-service/"]
RUN dotnet restore "src/backend/auth-service/AuthService.csproj"

COPY . .
RUN dotnet publish "src/backend/auth-service/AuthService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AuthService.dll"]