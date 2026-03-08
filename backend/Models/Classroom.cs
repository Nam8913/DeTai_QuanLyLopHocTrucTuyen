using System.Collections.Concurrent;

sealed class Classroom
{
	public Classroom(string code, string teacherEmail, string? name = null)
	{
		Code = code;
		TeacherEmail = teacherEmail;
		Name = name ?? string.Empty;
	}

	public string Code { get; }
	public string TeacherEmail { get; }
	public string Name { get; }
	public ConcurrentDictionary<string, byte> Members { get; } = new(StringComparer.OrdinalIgnoreCase);
}
