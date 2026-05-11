import { useForm, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, AlertCircle } from 'lucide-react';

function FieldError({ message }) {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
            <AlertCircle size={12} />
            {message}
        </p>
    );
}

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email:    '',
        password: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Iniciar sesión" />

            {/* Fondo con patrón sutil */}
            <div
                className="min-h-screen flex flex-col items-center justify-center px-4"
                style={{
                    backgroundColor: '#F4F4F4',
                    backgroundImage: `radial-gradient(circle at 1px 1px, #D3D3D3 1px, transparent 0)`,
                    backgroundSize: '24px 24px',
                }}
            >
                <div className="w-full max-w-[400px]">

                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <img
                            src="/images/logo.jpeg"
                            alt="Electricidad Centro"
                            width={200}
                            className="object-contain drop-shadow-sm"
                        />
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.08)] border border-white/80 overflow-hidden">

                        {/* Borde naranja superior */}
                        <div className="h-1 w-full bg-[#F58220]" />

                        <div className="px-8 py-8">
                            <div className="mb-7">
                                <h1 className="text-xl font-semibold tracking-tight text-[#2B2B2B]">
                                    Bienvenido
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Ingresá tus credenciales para continuar
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 block">
                                        Correo electrónico
                                    </Label>
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            autoFocus
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            placeholder="usuario@ejemplo.com"
                                            className="pl-9"
                                        />
                                    </div>
                                    <FieldError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div>
                                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 block">
                                        Contraseña
                                    </Label>
                                    <div className="relative">
                                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="pl-9"
                                        />
                                    </div>
                                    <FieldError message={errors.password} />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-sm font-semibold mt-2 tracking-wide"
                                    disabled={processing}
                                >
                                    {processing ? 'Verificando...' : 'Ingresar al sistema'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    <p className="text-center text-[11px] text-gray-400 mt-6 tracking-wide uppercase">
                        Electricidad Centro · Sistema de Gestión
                    </p>
                </div>
            </div>
        </>
    );
}
