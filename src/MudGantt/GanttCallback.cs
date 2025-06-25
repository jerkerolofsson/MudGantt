using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.JSInterop;

namespace MudGantt;

internal class GanttCallback
{
    private readonly MudGanttChart _chart;

    public GanttCallback(MudGanttChart chart)
    {
        _chart = chart;
    }

    [JSInvokable]
    public async Task OnTaskMovedAsync(string id, string? startIsoDate, string? endIsoDate)
    {
        if(DateTime.TryParse(startIsoDate, out var startDate) && DateTime.TryParse(endIsoDate, out var endDate))
        {
            await _chart.OnTaskMovedAsync(id, new DateTimeOffset(startDate), new DateTimeOffset(endDate));

        }
    }

    [JSInvokable]
    public async Task OnProgressChangedAsync(string id, double progress)
    {
        await _chart.OnProgressChangedAsync(id, progress);
    }
}
