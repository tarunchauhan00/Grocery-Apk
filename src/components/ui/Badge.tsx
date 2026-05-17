import { View, Text } from 'react-native';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color = '#dcfce7', textColor = '#16a34a', size = 'sm' }: Props) {
  return (
    <View className={`rounded-full px-2 ${size === 'sm' ? 'py-0.5' : 'py-1'}`} style={{ backgroundColor: color }}>
      <Text className={`font-semibold ${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}
