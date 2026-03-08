using System.Collections.Concurrent;

static class UserStoreServiceCollectionExtensions
{
	public static IServiceCollection AddUserStore(this IServiceCollection services)
	{
		services.AddSingleton(new ConcurrentDictionary<string, User>(StringComparer.OrdinalIgnoreCase));
		return services;
	}
}
