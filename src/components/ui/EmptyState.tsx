import { View, Text } from 'react-native';
import { Button } from './Button';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-5xl mb-4">🛒</Text>
      <Text className="text-xl font-bold text-gray-800 text-center mb-2">{title}</Text>
      {subtitle && <Text className="text-gray-500 text-center mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} />
      )}
    </View>
  );
}
