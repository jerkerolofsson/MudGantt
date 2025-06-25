using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MudGantt
{
    internal class GanttData
    {
        public required IReadOnlyList<MudGanttTask> Items { get; set; }
        public int Height { get; internal set; }
        public int Width { get; internal set; }
        public bool ReadOnly { get; internal set; }
    }
}
