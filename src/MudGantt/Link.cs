namespace MudGantt;
public class Link
{
    public string Id { get; set; }
    public LinkType LinkType { get; set; } = LinkType.FinishToStart;

    public Link(string id)
    {
        Id = id;
    }

    public Link(string id, LinkType linkType)
    {
        Id = id;
        LinkType = linkType;
    }
}
