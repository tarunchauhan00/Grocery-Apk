import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title, variant = 'primary', size = 'md', loading, fullWidth, disabled, style, ...rest
}: Props) {
  const base = 'flex-row items-center justify-center rounded-xl';

  const variants: Record<string, string> = {
    primary: 'bg-green-600',
    outline: 'border-2 border-green-600 bg-transparent',
    ghost:   'bg-transparent',
    danger:  'bg-red-500',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-2',
    md: 'px-5 py-3',
    lg: 'px-6 py-4',
  };

  const textColor: Record<string, string> = {
    primary: 'text-white',
    outline: 'text-green-600',
    ghost:   'text-green-600',
    danger:  'text-white',
  };

  const textSize: Record<string, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : '#16a34a'} className="mr-2" />}
      <Text className={`font-semibold ${textColor[variant]} ${textSize[size]}`}>{title}</Text>
    </TouchableOpacity>
  );
}
