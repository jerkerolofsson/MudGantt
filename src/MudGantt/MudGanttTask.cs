using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MudGantt
{
    public class MudGanttTask
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public DateTimeOffset? StartDate { get; set; }
        public DateTimeOffset? EndDate { get; set; }
        public double? Progress { get; set; }

        public string[] DependentOn { get; set; } = [];
    }
}
