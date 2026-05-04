import { Stack } from 'expo-router';

/**
 * Root Layout
 */

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Index (home) screen */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Tab navigator */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* Calendar screen - NEW! */}
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Expiration Calendar',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
