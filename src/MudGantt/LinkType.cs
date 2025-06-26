namespace MudGantt;
public enum LinkType
{
    /// <summary>
    /// The linked task ends before the successor can begin.
    /// Arrow from the end of the linked task to the start of the this task.
    /// </summary>
    FinishToStart = 1,

    /// <summary>
    /// The linked task begins before the successor can end.
    /// Arrow from the start of the linked task to the end of the this task.
    /// </summary>
    StartToFinish = 2,

    /// <summary>
    /// The linked task begins before the successor can begin.
    /// Arrow from the start of the linked task to the start of the this task.
    /// </summary>
    StartToStart = 3,

    /// <summary>
    /// The linked task ends before the successor can end.
    /// Arrow from the end of the linked task to the end of the this task.
    /// </summary>
    FinishToFinish = 4
}
