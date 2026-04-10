using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Sofranet.Models;

// "Option" ismi reserved durabilir, MenuOption ile gidiyoruz
public class MenuOption
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public OptionGroup? Group { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "numeric(10,2)")]
    public decimal ExtraPrice { get; set; } = 0;
}
