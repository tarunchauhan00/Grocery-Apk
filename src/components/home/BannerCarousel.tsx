import { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { Banner } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - 32; // 16px padding each side

interface Props {
  banners: Banner[];
}

export function BannerCarousel({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }, 3500);
    return () => clearInterval(timer);
  }, [activeIndex, banners.length]);

  function handlePress(banner: Banner) {
    if (!banner.link_type || !banner.link_value) return;
    if (banner.link_type === 'category') router.push(`/(app)/category/${banner.link_value}`);
    else if (banner.link_type === 'product') router.push(`/(app)/product/${banner.link_value}`);
  }

  if (!banners.length) return null;

  return (
    <View className="mb-4">
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_W + 12}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            activeOpacity={0.95}
            style={{ width: BANNER_W, marginRight: 12 }}
          >
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: item.bg_color, height: BANNER_W * 0.42 }}
            >
              <Image
                source={{ uri: item.image_url }}
                style={{ width: BANNER_W, height: BANNER_W * 0.42 }}
                contentFit="cover"
              />
              {(item.title || item.subtitle) && (
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/20">
                  {item.title && <Text className="text-white font-bold text-lg">{item.title}</Text>}
                  {item.subtitle && <Text className="text-white/80 text-sm">{item.subtitle}</Text>}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />

      {/* Dots */}
      {banners.length > 1 && (
        <View className="flex-row justify-center mt-2 gap-1.5">
          {banners.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${i === activeIndex ? 'w-4 bg-green-600' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
