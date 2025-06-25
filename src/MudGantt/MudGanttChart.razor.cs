using System;

using Microsoft.JSInterop;

namespace MudGantt
{
    public partial class MudGanttChart
    {
        private readonly string _id = "mud-gantt-" + Guid.NewGuid().ToString();

        /// <summary>
        /// Extra user-defined CSS class
        /// </summary>
        [Parameter] public string? Class { get; set; }

        /// <summary>
        /// Extra user defined CSS styles
        /// </summary>
        [Parameter] public string? Style { get; set; }

        /// <summary>
        /// Accent color
        /// </summary>
        [Parameter] public Color Color { get; set; } = Color.Primary;

        /// <summary>
        /// UI Variant, Filled or Outlined
        /// </summary>
        [Parameter] public Variant Variant { get; set; } = Variant.Filled;

        /// <summary>
        /// List of events
        /// </summary>
        [Parameter] public IReadOnlyList<MudGanttEvent>? Events { get; set; }

        /// <summary>
        /// List of tasks
        /// </summary>
        [Parameter] public IReadOnlyList<MudGanttTask>? Tasks { get; set; }

        /// <summary>
        /// Tasks changed
        /// </summary>
        [Parameter] public EventCallback<IReadOnlyList<MudGanttTask>> TasksChanged { get; set; }

        /// <summary>
        /// Read-only mode. If true, the chart will not allow any interaction.
        /// </summary>
        [Parameter] public bool ReadOnly { get; set; } = false;

        /// <summary>
        /// The progress for a task was changed
        /// </summary>
        [Parameter] public EventCallback<MudGanttTask> TaskProgressChanged { get; set; }

        /// <summary>
        /// The progress for a task date(s) was changed
        /// </summary>
        [Parameter] public EventCallback<MudGanttTask> TaskDatesChanged { get; set; }

        public string CssClass => new CssBuilder("mud-gantt")
            .AddClass("mud-color-" + Color.ToDescriptionString().ToLowerInvariant(), true)
            .AddClass("mud-variant-" + this.Variant.ToDescriptionString().ToLowerInvariant(), true)
            .AddClass("read-only", ReadOnly)
            .AddClass(Class, Class is not null)
            .Build();

        private GanttInterop? _interop;
        private DotNetObjectReference<GanttCallback>? _callback;

        /// <summary>
        /// Initializes the js interop
        /// </summary>
        /// <param name="firstRender"></param>
        /// <returns></returns>
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if(_interop is null)
            {
                _interop = new GanttInterop(jsRuntime);
                var callback = new GanttCallback(this);
                _callback = DotNetObjectReference.Create(callback);
                await _interop.CreateAsync(_id, _callback);

                if(Tasks is not null)
                {
                    var data = CreateData();
                    await _interop.UpdateAsync(_id, data);
                }
            }
        }


        /// <summary>
        /// Updates data in JS
        /// </summary>
        /// <returns></returns>
        protected override async Task OnParametersSetAsync()
        {
            if (_interop is not null && Tasks is not null)
            {
                var data = CreateData();
                await _interop.UpdateAsync(_id, data);
            }
        }

        private GanttData CreateData()
        {
            return new GanttData { Items = Tasks ?? [], Events = Events ?? [], ReadOnly = ReadOnly };
        }

        public async ValueTask DisposeAsync()
        {
            if (_interop is not null)
            {
                await _interop.DisposeAsync();
            }
        }

        /// <summary>
        /// Callback from JS when the dates of a task have changed
        /// </summary>
        /// <param name="id"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        internal async Task OnTaskMovedAsync(string id, DateTimeOffset startDate, DateTimeOffset endDate)
        {
            if (Tasks is null)
            {
                return;
            }
            var task = Tasks.Where(x => x.Id == id).FirstOrDefault();
            if (task is not null)
            {
                task.StartDate = startDate.ToUniversalTime();
                task.EndDate = endDate.ToUniversalTime();
                await TaskDatesChanged.InvokeAsync(task);
                await TasksChanged.InvokeAsync(Tasks);
            }
        }

        /// <summary>
        /// Callback from JS when the progress has changed
        /// </summary>
        /// <param name="id"></param>
        /// <param name="progress"></param>
        /// <returns></returns>
        internal async Task OnProgressChangedAsync(string id, double progress)
        {
            if (Tasks is null)
            {
                return;
            }
            var task = Tasks.Where(x => x.Id == id).FirstOrDefault();
            if (task is not null)
            {
                task.Progress = progress;
                await TaskProgressChanged.InvokeAsync(task);
                await TasksChanged.InvokeAsync(Tasks);
            }
        }
    }
}
