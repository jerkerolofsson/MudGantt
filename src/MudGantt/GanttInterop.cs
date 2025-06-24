using Microsoft.JSInterop;

namespace MudGantt
{
    internal class GanttInterop : IAsyncDisposable
    {
        private readonly Lazy<Task<IJSObjectReference>> moduleTask;

        public GanttInterop(IJSRuntime jsRuntime)
        {
            moduleTask = new(() => jsRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./_content/MudGantt/gantt.js").AsTask());
        }


        public async ValueTask DisposeAsync()
        {
            if (moduleTask.IsValueCreated)
            {
                var module = await moduleTask.Value;
                await module.DisposeAsync();
            }
        }

        internal async Task CreateAsync(string id)
        {
            var module = await moduleTask.Value;
            await module.InvokeAsync<string>("initGantt", id, $"#{id}");
        }

        internal async Task UpdateAsync(string id, GanttData data)
        {
            var module = await moduleTask.Value;
            await module.InvokeAsync<string>("updateGantt", id, data);
        }
    }
}
