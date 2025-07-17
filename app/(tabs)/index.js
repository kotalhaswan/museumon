import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { encode } from 'base64-arraybuffer';

const ELEVEN_API_KEY = 'sk_3adcb8997e75c602dd32ca365961f5a13ab4f1c612b4ba03';
const VOICE_ID = 'XJa38TJgDqYhj5mYbSJA';

export default function App() {
  const [input, setInput] = useState('');
  const [phrases, setPhrases] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(null);

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    const saved = await AsyncStorage.getItem('phrases');
    if (saved) setPhrases(JSON.parse(saved));
  };

  const savePhrase = async () => {
    if (!input.trim()) return;
    const updated = [...phrases, input.trim()];
    await AsyncStorage.setItem('phrases', JSON.stringify(updated));
    setPhrases(updated);
    setInput('');
  };

  const deletePhrase = async (index) => {
    Alert.alert(
      'Verwijderen',
      'Weet u zeker dat u deze zin wilt verwijderen?',
      [
        { text: 'Terug', style: 'cancel' },
        {
          text: 'Verwijder',
          onPress: async () => {
            const updatedPhrases = phrases.filter((_, idx) => idx !== index);
            await AsyncStorage.setItem('phrases', JSON.stringify(updatedPhrases));
            setPhrases(updatedPhrases);
          },
        },
      ]
    );
  };

  const speakPhrase = async (phrase, index) => {
    try {
      setLoadingIndex(index);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: phrase,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.3,         // Lower for more dynamic intonation
              similarity_boost: 0.8// Lower to add some variation and “character”
            }

          }),

        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS failed: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = encode(arrayBuffer);
      const fileUri = FileSystem.documentDirectory + 'speech.mp3';

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Fout bij spraak', error.message);
    } finally {
      setLoadingIndex(null);
    }
  };

 return (
  <View style={styles.container}>
    <TextInput
      placeholder="Typ hier uw zin"
      style={styles.input}
      value={input}
      onChangeText={setInput}
    />
    <Button title="Opslaan" onPress={savePhrase} />

   

    <ScrollView style={styles.phraseList}>
      {phrases.map((phrase, index) => (
        <View key={index} style={styles.phraseItem}>
          <TouchableOpacity
            style={styles.phraseButton}
            onPress={() => speakPhrase(phrase, index)}
          >
            {loadingIndex === index ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.phraseText}>{phrase}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePhrase(index)}
          >
            <Text style={styles.deleteText}>Verwijder</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
     <TouchableOpacity
      style={styles.painButton}
      onPress={() => speakPhrase("Oww, dat doet pijn!", -1)}
    >
      {loadingIndex === -1 ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.phraseText}>Oww, dat doet pijn!</Text>
      )}
    </TouchableOpacity>

     <TouchableOpacity
      style={styles.wrongButton}
      onPress={() => speakPhrase("Nee nee nee, dit antwoord klopt niet! Probeer het nog een keer.", -1)}
    >
      {loadingIndex === -1 ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.phraseText}>Nee nee nee, dit antwoord klopt niet! Probeer het nog een keer.</Text>
      )}
    </TouchableOpacity>

     <TouchableOpacity
      style={styles.correctButton}
      onPress={() => speakPhrase("Ja, dat klopt! Wat ben jij slim zeg!", -1)}
    >
      {loadingIndex === -1 ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.phraseText}>Ja, dat klopt! Wat ben jij slim zeg!</Text>
      )}
    </TouchableOpacity>
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  input: {
    borderColor: '#888',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  phraseList: {
    marginTop: 20,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  phraseButton: {
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phraseText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
  },
  painButton: {
  backgroundColor: '#ff9900',
  padding: 15,
  borderRadius: 8,
  marginTop: 15,
  justifyContent: 'center',
  alignItems: 'center',
},
wrongButton: {
  backgroundColor: '#EE4B2B',
  padding: 15,
  borderRadius: 8,
  marginTop: 15,
  justifyContent: 'center',
  alignItems: 'center',
},
correctButton: {
  backgroundColor: '#50C878',
  padding: 15,
  borderRadius: 8,
  marginTop: 15,
  justifyContent: 'center',
  alignItems: 'center',
},

});
