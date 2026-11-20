/**
 * @format
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeModules,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Task = { id: string; title: string; done: boolean };

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Details: { task: Task };
};

const TASKS: Task[] = [
  { id: '1', title: 'اتعلم رياكت', done: false },
  { id: '2', title: 'أعمل تطبيق المهام', done: false },
  { id: '3', title: 'أكتب موديول Kotlin', done: false },
];

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator>
          {isLoggedIn ? (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'مهامي' }}
              />
              <Stack.Screen
                name="Details"
                component={DetailsScreen}
                options={{ title: 'التفاصيل' }}
              />
            </>
          ) : (
            <Stack.Screen name="Login" options={{ title: 'تسجيل الدخول' }}>
              {() => <LoginScreen onLogin={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function HomeScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [newTask, setNewTask] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
const [deviceName, setDeviceName] = useState('...');

useEffect(() => {
  const loadDeviceName = async () => {
    try {
      const name = await NativeModules.DeviceModule.getDeviceName();
      setDeviceName(name);
    } catch (e) {
      setDeviceName('غير معروف');
    }
  };
  loadDeviceName();
}, []);
  useEffect(() => {
    const loadTasks = async () => {
      const saved = await AsyncStorage.getItem('tasks');
      if (saved !== null) {
        setTasks(JSON.parse(saved));
      }
      setLoaded(true);
    };
    loadTasks();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, loaded]);

  const addTask = () => {
    if (newTask.trim() === '') {
      return;
    }
    const task = { id: Date.now().toString(), title: newTask, done: false };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const fetchTasks = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos?_limit=5',
      );
      if (!response.ok) {
        throw new Error('Server error');
      }
      const data = await response.json();
      const fetched: Task[] = data.map((item: any) => ({
        id: 'api-' + item.id,
        title: item.title,
        done: item.completed,
      }));
      setTasks(prev => [...prev, ...fetched]);
    } catch (e) {
      setFetchError('ما قدرت أجيب المهام. تأكدي من الإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.deviceText}>الجهاز: {deviceName}</Text>
      <TextInput
        style={styles.input}
        placeholder="اكتب مهمة جديدة"
        value={newTask}
        onChangeText={setNewTask}
      />

      <Pressable style={styles.button} onPress={addTask}>
        <Text style={styles.buttonText}>إضافة</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={fetchTasks}>
        <Text style={styles.secondaryButtonText}>جلب مهام من الإنترنت</Text>
      </Pressable>

      {loading && <ActivityIndicator size="large" />}
      {fetchError !== '' && <Text style={styles.errorText}>{fetchError}</Text>}

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Pressable
                style={[styles.checkbox, item.done && styles.checkboxDone]}
                onPress={() => toggleTask(item.id)}
              >
                {item.done && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>

              <Pressable
                style={styles.titleArea}
                onPress={() => navigation.navigate('Details', { task: item })}
              >
                <Text style={[styles.cardText, item.done && styles.doneText]}>
                  {item.title}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteText}>حذف</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function DetailsScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, 'Details'>) {
  const { task } = route.params;

  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>{task.title}</Text>
      <Text style={styles.detailsStatus}>
        {task.done ? 'الحالة: منجزة ✅' : 'الحالة: لسا ما خلصت'}
      </Text>
    </View>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username.trim() === '' || password.trim() === '') {
      setError('عبّي الاسم وكلمة السر');
      return;
    }
    setError('');
    onLogin();
  };

  return (
    <View style={styles.loginContainer}>
      <TextInput
        style={styles.input}
        placeholder="اسم المستخدم"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="كلمة السر"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>دخول</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    width: 300,
  },
  cardText: {
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: 300,
    fontSize: 18,
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: 300,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteText: {
    color: '#c62828',
    fontSize: 16,
    marginTop: 8,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 6,
    marginEnd: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#2e7d32',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  titleArea: {
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  detailsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsStatus: {
    fontSize: 20,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: 300,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 18,
    fontWeight: 'bold',
  },
    deviceText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
  },
});

export default App;