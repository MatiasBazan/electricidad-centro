<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'name'      => ['required', 'string', 'max:100'],
            'email'     => ['required', 'email', 'max:100', "unique:users,email,{$userId}"],
            'role_id'   => ['required', 'exists:roles,id'],
            'password'  => ['nullable', Password::min(8)],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'    => 'El nombre es obligatorio.',
            'email.required'   => 'El correo es obligatorio.',
            'email.unique'     => 'Este correo ya está en uso.',
            'role_id.required' => 'Seleccioná un rol.',
            'password.min'     => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }
}
