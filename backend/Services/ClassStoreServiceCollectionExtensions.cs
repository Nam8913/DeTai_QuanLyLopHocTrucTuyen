using System.Collections.Concurrent;

static class ClassStoreServiceCollectionExtensions
{
	public static IServiceCollection AddClassStore(this IServiceCollection services)
	{
		services.AddSingleton(new ConcurrentDictionary<string, Classroom>(StringComparer.OrdinalIgnoreCase));
		return services;
	}
}
