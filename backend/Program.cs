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
    var roleRaw = request.Role?.Trim();
    var role = roleRaw?.ToLowerInvariant() switch
    {
        "teacher" => "teacher",
        "student" => "student",
        _ => "student",
    };

    var user = new User(request.FullName?.Trim(), email, request.Password, role);

    if (!users.TryAdd(email, user))
    {
        return Results.Conflict(new { message = "Email đã được đăng ký." });
    }

    return Results.Ok(new
    {
        message = "Đăng ký thành công.",
        email = user.Email,
        fullName = user.FullName ?? string.Empty,
        role = user.Role,
    });
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

    return Results.Ok(new
    {
        message = "Đăng nhập thành công.",
        email = user.Email,
        fullName = user.FullName ?? string.Empty,
        role = user.Role,
    });
});

app.MapPost("/api/auth/resetPassword", (
    ResetPasswordRequest request,
    System.Collections.Concurrent.ConcurrentDictionary<string, User> users) =>
{
    if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.NewPassword))
    {
        return Results.BadRequest(new { message = "Thiếu email hoặc mật khẩu mới." });
    }

    var email = request.Email.Trim();
    if (!users.TryGetValue(email, out var user))
    {
        return Results.NotFound(new { message = "Email chưa được đăng ký." });
    }

    if (request.NewPassword.Trim().Length < 6)
    {
        return Results.BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    var updated = user with { Password = request.NewPassword };
    users[email] = updated;

    return Results.Ok(new { message = "Đổi mật khẩu thành công." });
});

app.MapPost("/api/users/updateProfile", (
    UpdateProfileRequest request,
    System.Collections.Concurrent.ConcurrentDictionary<string, User> users) =>
{
    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new { message = "Thiếu email." });
    }

    var email = request.Email.Trim();
    if (!users.TryGetValue(email, out var user))
    {
        return Results.NotFound(new { message = "Không tìm thấy người dùng." });
    }

    var fullName = request.FullName?.Trim();
    var roleRaw = request.Role?.Trim();
    var role = roleRaw?.ToLowerInvariant() switch
    {
        "teacher" => "teacher",
        "student" => "student",
        null or "" => user.Role,
        _ => user.Role,
    };

    var updated = user with
    {
        FullName = string.IsNullOrWhiteSpace(fullName) ? user.FullName : fullName,
        Role = role,
    };

    users[email] = updated;

    return Results.Ok(new
    {
        message = "Cập nhật thành công.",
        email = updated.Email,
        fullName = updated.FullName ?? string.Empty,
        role = updated.Role,
    });
});

app.Run();

record RegisterRequest(string? FullName, string Email, string Password, string? Role);
record LoginRequest(string Email, string Password);
record ResetPasswordRequest(string Email, string NewPassword);
record UpdateProfileRequest(string Email, string? FullName, string? Role);
record User(string? FullName, string Email, string Password, string Role);
