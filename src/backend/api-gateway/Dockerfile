FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/backend/api-gateway/ApiGateway.csproj", "src/backend/api-gateway/"]
RUN dotnet restore "src/backend/api-gateway/ApiGateway.csproj"

COPY . .
RUN dotnet publish "src/backend/api-gateway/ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ApiGateway.dll"]