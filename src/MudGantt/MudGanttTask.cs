namespace MudGantt
{
    /// <summary>
    /// Represents a single task in a Gantt chart, including scheduling, progress, color, and dependencies.
    /// </summary>
    public class MudGanttTask
    {
        /// <summary>
        /// Gets or sets the unique identifier for the task.
        /// </summary>
        public required string Id { get; set; }

        /// <summary>
        /// Gets or sets the display name of the task.
        /// </summary>
        public required string Name { get; set; }

        /// <summary>
        /// Gets or sets the start date of the task.
        /// </summary>
        public DateTimeOffset? StartDate { get; set; }

        /// <summary>
        /// Gets or sets the end date of the task.
        /// </summary>
        public DateTimeOffset? EndDate { get; set; }

        /// <summary>
        /// Gets or sets the progress of the task, as a value between 0.0 and 1.0.
        /// If null the task progress cannot be changed.
        /// </summary>
        public double? Progress { get; set; }

        /// <summary>
        /// Gets or sets the color of the task bar (hex or CSS color string).
        /// If null, the color specified for the MudGanttChart will be used (e.g. MudColor.Primary).
        /// </summary>
        public string? Color { get; set; }

        /// <summary>
        /// Gets or sets the list of task IDs that this task depends on.
        /// </summary>
        public string[] DependentOn { get; set; } = [];

        /// <summary>
        /// Gets the color used for the progress bar, derived from <see cref="Color"/> and lightened.
        /// </summary>
        public string? ProgressColor
        {
            get
            {
                if(Color is not null)
                {
                    if(MudColor.TryParse(Color, out var color))
                    {
                        var lightenedColor = color.ColorLighten(0.2);
                        return lightenedColor.ToString(MudColorOutputFormats.Hex);
                    }
                }
                return null;
            }
        }
    }
}
