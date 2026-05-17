import { TouchableOpacity, Text, View, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
  loading?: boolean;
}

export function GoogleButton({ loading, disabled, ...rest }: Props) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center border-2 border-gray-200 rounded-xl py-3.5 bg-white ${disabled || loading ? 'opacity-50' : ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          {/* Google "G" logo using coloured squares */}
          <View className="w-5 h-5 mr-3">
            <Text style={{ fontSize: 18, lineHeight: 20 }}>G</Text>
          </View>
          <Text className="text-gray-700 font-semibold text-base">Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
