var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://127.0.0.1:5500",// cho phép truy cập từ cổng 5500 - Live Server(just test)
                "http://localhost:5500",
                "http://localhost:3000",// cho phép truy cập từ cổng 3000 - Live Preview(just test)
                "http://127.0.0.1:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton(new System.Collections.Concurrent.ConcurrentDictionary<string, User>(
    System.StringComparer.OrdinalIgnoreCase));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.MapGet("/api/hello", () =>
{
    return "Hello from C# backend!";
});

app.MapPost("/api/auth/register", (
    RegisterRequest request,
    System.Collections.Concurrent.ConcurrentDictionary<string, User> users) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Thiếu email hoặc mật khẩu." });
    }

    var email = request.Email.Trim();
    var user = new User(request.FullName?.Trim(), email, request.Password);

    if (!users.TryAdd(email, user))
    {
        return Results.Conflict(new { message = "Email đã được đăng ký." });
    }

    return Results.Ok(new { message = "Đăng ký thành công." });
});

app.MapPost("/api/auth/login", (
    LoginRequest request,
    System.Collections.Concurrent.ConcurrentDictionary<string, User> users) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest(new { message = "Thiếu email hoặc mật khẩu." });
    }

    var email = request.Email.Trim();
    if (!users.TryGetValue(email, out var user) || user.Password != request.Password)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new { message = "Đăng nhập thành công." });
});

app.Run();

record RegisterRequest(string? FullName, string Email, string Password);
record LoginRequest(string Email, string Password);
record User(string? FullName, string Email, string Password);
