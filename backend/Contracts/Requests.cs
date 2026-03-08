record RegisterRequest(string? FullName, string Email, string Password, string? Role);
record LoginRequest(string Email, string Password);
record ResetPasswordRequest(string Email, string NewPassword);
record UpdateProfileRequest(string Email, string? FullName, string? Role);

record CreateClassRequest(string TeacherEmail, string ClassCode, string? Name);
record JoinClassRequest(string Email, string ClassCode);
