var builder = DistributedApplication.CreateBuilder(args);


builder.AddProject<Projects.MudGanttDemoApp_Web>("webfrontend")
    .WithExternalHttpEndpoints();

builder.Build().Run();
