namespace MudGantt
{
    public partial class MudGanttChart
    {
        private readonly string _id = "mud-gantt-" + Guid.NewGuid().ToString();

        [Parameter] public string? Class { get; set; }
        [Parameter] public string? Style { get; set; }

        /// <summary>
        /// SVG viewbox width
        /// </summary>
        [Parameter] public int ViewboxWidth { get; set; } = 200;

        /// <summary>
        /// SVG viewbox height
        /// </summary>
        [Parameter] public int ViewboxHeight { get; set; } = 200;

        /// <summary>
        /// Accent color
        /// </summary>
        [Parameter] public Color Color { get; set; } = Color.Primary;

        /// <summary>
        /// UI Variant, Filled or Outlined
        /// </summary>
        [Parameter] public Variant Variant { get; set; } = Variant.Filled;

        /// <summary>
        /// List of tasks
        /// </summary>
        [Parameter] public IReadOnlyList<MudGanttTask>? Tasks { get; set; }

        /// <summary>
        /// Read-only mode. If true, the chart will not allow any interaction.
        /// </summary>
        [Parameter] public bool ReadOnly { get; set; } = false;

        public string CssClass => new CssBuilder("mud-gantt")
            .AddClass("mud-color-" + Color.ToDescriptionString().ToLowerInvariant(), true)
            .AddClass("mud-variant-" + this.Variant.ToDescriptionString().ToLowerInvariant(), true)
            .AddClass("read-only", ReadOnly)
            .Build();

        private GanttInterop? _interop;

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if(_interop is null)
            {
                _interop = new GanttInterop(jsRuntime);
                await _interop.CreateAsync(_id);

                if(Tasks is not null)
                {
                    var data = CreateData();
                    await _interop.UpdateAsync(_id, data);
                }
            }
        }

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
            return new GanttData { Items = Tasks ?? [], Width = ViewboxWidth, Height = ViewboxHeight, ReadOnly = ReadOnly };
        }

        public async ValueTask DisposeAsync()
        {
            if (_interop is not null)
            {
                await _interop.DisposeAsync();
            }
        }
    }
}
