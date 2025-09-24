import { Audio } from "expo-av";

export async function getMultipleAudioDurations(uris) {
  try {
    const durationPromises = uris.map(async (uri) => {
      const sound = new Audio.Sound();
      try {
        await sound.loadAsync({ uri });
        const status = await sound.getStatusAsync();
        await sound.unloadAsync(); // Unload immediately to free memory
        return {
          uri,
          duration: status.isLoaded ? status.durationMillis / 1000 : null,
        };
      } catch (error) {
        console.error(`Error processing ${uri}:`, error);
        return { uri, duration: null };
      }
    });

    const results = await Promise.all(durationPromises);
    return results;
  } catch (error) {
    console.error('Error getting durations:', error);
    return [];
  }
}