using System.Collections.Concurrent;
using System.Text.Json;

static class ApiEndpoints
{
    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        app.MapHelloEndpoints();
        app.MapAuthEndpoints();
        app.MapUserEndpoints();
		app.MapClassEndpoints();
        return app;
    }

    static WebApplication MapHelloEndpoints(this WebApplication app)
    {
        app.MapGet("/api/hello", () => "Hello from C# backend!");
        return app;
    }

    static WebApplication MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/register", (RegisterRequest request, ConcurrentDictionary<string, User> users) =>
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

        app.MapPost("/api/auth/login", (LoginRequest request, ConcurrentDictionary<string, User> users) =>
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

        app.MapPost("/api/auth/resetPassword", (ResetPasswordRequest request, ConcurrentDictionary<string, User> users) =>
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

            if (request.NewPassword.Trim().Length < 4)
            {
                return Results.BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });
            }

            var updated = user with { Password = request.NewPassword };
            users[email] = updated;

            return Results.Ok(new { message = "Đổi mật khẩu thành công." });
        });

        return app;
    }

    static WebApplication MapUserEndpoints(this WebApplication app)
    {
        app.MapPost("/api/users/updateProfile", (UpdateProfileRequest request, ConcurrentDictionary<string, User> users) =>
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

        return app;
    }

    static WebApplication MapClassEndpoints(this WebApplication app)
    {
        // Tạo lớp (dành cho teacher) - để có dữ liệu test cho chức năng join.
        app.MapPost("/api/classes/create", () =>
        {
            // if (string.IsNullOrWhiteSpace(request.TeacherEmail) || string.IsNullOrWhiteSpace(request.ClassCode))
            // {
            //     return Results.BadRequest(new { message = "Thiếu email giáo viên hoặc mã lớp." });
            // }

            // var teacherEmail = request.TeacherEmail.Trim();
            // if (!users.TryGetValue(teacherEmail, out var teacher))
            // {
            //     return Results.NotFound(new { message = "Không tìm thấy người dùng." });
            // }
            // if (!string.Equals(teacher.Role, "teacher", StringComparison.OrdinalIgnoreCase))
            // {
            //     return Results.BadRequest(new { message = "Chỉ giáo viên mới có thể tạo lớp." });
            // }

            // var classCode = request.ClassCode.Trim();
            // if (classes.ContainsKey(classCode))
            // {
            //     return Results.Conflict(new { message = "Mã lớp đã tồn tại." });
            // }

            // var classroom = new Classroom(classCode, teacherEmail, request.Name?.Trim());
            // if (!classes.TryAdd(classCode, classroom))
            // {
            //     return Results.Conflict(new { message = "Mã lớp đã tồn tại." });
            // }

            // return Results.Ok(new
            // {
            //     message = "Tạo lớp thành công.",
            //     classCode = classroom.Code,
            //     name = classroom.Name,
            // });

            var classCode = Rand.GetRandomString(6);
            
            return Results.Ok(new
            {
                message = "Tạo lớp thành công.",
                classCode = classCode
            });
        });

        // Join lớp (dành cho student)
        app.MapPost("/api/classes/join", (JoinClassRequest request, ConcurrentDictionary<string, User> users, ConcurrentDictionary<string, Classroom> classes) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.ClassCode))
            {
                return Results.BadRequest(new { message = "Thiếu email hoặc mã lớp." });
            }

            var email = request.Email.Trim();
            if (!users.TryGetValue(email, out var user))
            {
                return Results.NotFound(new { message = "Không tìm thấy người dùng." });
            }
            if (!string.Equals(user.Role, "student", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { message = "Chỉ học sinh mới có thể tham gia lớp." });
            }

            var classCode = request.ClassCode.Trim();
            if (!classes.TryGetValue(classCode, out var classroom))
            {
                return Results.NotFound(new { message = "Không tìm thấy lớp với mã đã nhập." });
            }

            if (!classroom.Members.TryAdd(email, 0))
            {
                return Results.Conflict(new { message = "Bạn đã tham gia lớp này rồi." });
            }

            return Results.Ok(new
            {
                message = "Tham gia lớp thành công.",
                classCode = classroom.Code,
                name = classroom.Name,
            });
        });

        return app;
    }
}
