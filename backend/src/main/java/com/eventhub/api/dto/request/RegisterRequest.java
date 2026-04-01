package com.eventhub.api.dto.request;

import com.eventhub.api.validation.ValidCpf;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Birth date is required")
    private String birthDate;

    @NotBlank(message = "CPF is required")
    @ValidCpf(message = "Invalid CPF")
    private String cpf;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
