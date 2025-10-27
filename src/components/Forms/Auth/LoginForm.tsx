// Api

// Components
import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';

// Others
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Form } from '@/components/ui/form';

const loginSchema = z.object({
    email: z.string().nonempty('Email is required').email(),
    password: z.string().nonempty('Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const { control, formState: { errors } } = form;

    const onSubmit = (data: LoginFormData) => {
        setLoading(false);
        console.log(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='mt-4 flex flex-col gap-4'>
                <InputField 
                    name='email'
                    control={control}
                    error={errors.email?.message}
                />
                <InputField 
                    name='password'
                    type='password'
                    control={control}
                    error={errors.password?.message}
                />
                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading} 
                >
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
            </form>
        </Form>
    )
}

export default LoginForm