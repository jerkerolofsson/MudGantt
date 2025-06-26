$version="0.3.2"
cd src/MudGantt
dotnet pack -p:PackageVersion=$version
nuget push bin/Release/MudGantt.${version}.nupkg -Source https://api.nuget.org/v3/index.json
cd ../..