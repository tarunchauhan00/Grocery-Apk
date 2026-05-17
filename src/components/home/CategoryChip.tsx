import { TouchableOpacity, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Category } from '@/types';

interface Props {
  category: Category;
  onPress: () => void;
}

export function CategoryChip({ category, onPress }: Props) {
  const bg = (category.color ?? '#16a34a') + '18';

  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', marginRight: 14 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
          overflow: 'hidden',
          backgroundColor: bg,
        }}
      >
        {category.image_url ? (
          <Image
            source={{ uri: category.image_url }}
            style={{ width: 64, height: 64 }}
            contentFit="cover"
          />
        ) : (
          <Text style={{ fontSize: 26, color: category.color }}>
            {getCategoryEmoji(category.name)}
          </Text>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11,
          color: '#374151',
          fontWeight: '500',
          maxWidth: 66,
          textAlign: 'center',
        }}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
}

function getCategoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('fruit')) return '🍎';
  if (n.includes('vegetable') || n.includes('veggie')) return '🥦';
  if (n.includes('dairy') || n.includes('milk') || n.includes('egg')) return '🥛';
  if (n.includes('meat') || n.includes('chicken') || n.includes('fish')) return '🍗';
  if (n.includes('bakery') || n.includes('bread')) return '🍞';
  if (n.includes('snack') || n.includes('chip')) return '🍿';
  if (n.includes('beverage') || n.includes('drink') || n.includes('juice')) return '🥤';
  if (n.includes('grain') || n.includes('rice') || n.includes('pulse')) return '🌾';
  if (n.includes('spice') || n.includes('masala')) return '🌶️';
  if (n.includes('frozen')) return '🧊';
  if (n.includes('personal') || n.includes('care')) return '🧴';
  if (n.includes('household') || n.includes('clean')) return '🧹';
  return '🛒';
}
