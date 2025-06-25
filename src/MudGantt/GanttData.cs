namespace MudGantt
{
    /// <summary>
    /// Internal data passed with JS interop for rendering the Gantt chart.
    /// </summary>
    internal class GanttData
    {
        /// <summary>
        /// Tasks
        /// </summary>
        public required IReadOnlyList<MudGanttTask> Items { get; set; }

        /// <summary>
        /// Events, can be null
        /// </summary>
        public IReadOnlyList<MudGanttEvent>? Events { get; set; }

        /// <summary>
        /// If true, the tasks cannot be moved and progress cannot be changed
        /// </summary>
        public bool ReadOnly { get; set; }
    }
}
