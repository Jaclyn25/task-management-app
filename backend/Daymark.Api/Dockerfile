FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source
COPY backend/Daymark.Api/Daymark.Api.csproj backend/Daymark.Api/
RUN --mount=type=cache,id=daymark-nuget,target=/root/.nuget/packages dotnet restore backend/Daymark.Api
COPY backend/Daymark.Api/ backend/Daymark.Api/
RUN --mount=type=cache,id=daymark-nuget,target=/root/.nuget/packages dotnet publish backend/Daymark.Api -c Release --no-restore -o /app
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
RUN mkdir -p /keys && chown -R app:app /keys
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "Daymark.Api.dll"]
