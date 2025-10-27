import { ComponentProps } from 'react'
import { Input } from '../ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import clsx from 'clsx';

interface Props<TFieldValues extends FieldValues> extends ComponentProps<'input'> {
    name: FieldPath<TFieldValues>;
    control: Control<TFieldValues>;
    label?: string;
    error?: string;
}

const InputField = <TFieldValues extends FieldValues>({ control, label, error, name, ...props }: Props<TFieldValues>) => {
    return (
        <FormField 
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Email </FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            {...props}
                            placeholder='admin@example.com' 
                            className={clsx(
                                error && 'border-destructive ring-destructive focus-visible:ring-destructive'
                            )}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

export default InputField