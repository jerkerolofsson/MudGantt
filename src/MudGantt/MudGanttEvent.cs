namespace MudGantt;

/// <summary>
/// Represents an event which has a datetime, but no range. For example a milestone.
/// </summary>
public class MudGanttEvent
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
    /// Date
    /// </summary>
    public required DateTimeOffset Date { get; set; }
}
