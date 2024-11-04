import React, { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, ScrollView, RefreshControl } from 'react-native';

export default function App() {
  const [isTokenFetched, setIsTokenFetched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);

  // JavaScript code to check for token in WebView's localStorage
  const checkTokenScript = `
    (function() {
      function checkForToken() {
        const token = localStorage.getItem('token');
        if (token) {
          window.ReactNativeWebView.postMessage(token);
          clearInterval(tokenCheckInterval);
        }
      }
      const tokenCheckInterval = setInterval(checkForToken, 1000);
    })();
  `;

  const sendNotification = async (title, date) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder',
        body: title,
      },
      trigger: { date }, // Trigger notification at the exact time
    });
  };

  const fetchDataAndStoreReminders = async (token) => {
    try {
      const response = await fetch('https://92345mxk-3501.asse.devtunnels.ms/my-reminder', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const now = new Date().getTime();
        const reminders = data.data
          .map((reminder) => ({
            id: reminder.id,
            title: reminder.title,
            started_date: new Date(reminder.started_date).getTime(),
            is_shown: false,
          }))
          .filter((reminder) => reminder.started_date >= now); // Filter only future reminders

        await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
        console.log('Reminders saved to AsyncStorage');
      } else {
        console.error('Failed to fetch reminders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const checkReminders = async () => {
    const storedReminders = JSON.parse(await AsyncStorage.getItem('reminders')) || [];
    const now = new Date().getTime();

    const updatedReminders = storedReminders.map((reminder) => {
      // Set notifikasi hanya saat waktu reminder kurang dari 1 menit dari sekarang
      if (!reminder.is_shown && Math.abs(reminder.started_date - now) < 60000) {
        sendNotification(reminder.title, new Date(reminder.started_date)); // Jadwalkan tepat di waktu yang diinginkan
        return { ...reminder, is_shown: true };
      }
      return reminder;
    });

    // Update AsyncStorage dengan daftar reminders yang sudah di-update
    await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }

    const intervalId = setInterval(checkReminders, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('token');

    if (token) {
      await fetchDataAndStoreReminders(token);
    }

    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <WebView 
        ref={webViewRef}
        source={{ uri: 'https://alobro.my.id/login' }}
        injectedJavaScript={checkTokenScript}
        onMessage={async (event) => {
          const token = event.nativeEvent.data;
          console.log('Token from WebView localStorage:', token);

          if (token && !isTokenFetched) {
            setIsTokenFetched(true);
            await AsyncStorage.setItem('token', token);
            await fetchDataAndStoreReminders(token);

            // Redirect to main route after login
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.location.href = '/'`);
            }
          }
        }}
        style={{ flex: 1 }}
      />
    </ScrollView>
  );
}



// import React, { useEffect, useRef, useState } from 'react';
// import { WebView } from 'react-native-webview';
// import * as Notifications from 'expo-notifications';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform, ScrollView, RefreshControl } from 'react-native';

// export default function App() {
//   const [isTokenFetched, setIsTokenFetched] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const webViewRef = useRef(null);

//   // JavaScript code to check for token in WebView's localStorage
//   const checkTokenScript = `
//     (function() {
//       function checkForToken() {
//         const token = localStorage.getItem('token');
//         if (token) {
//           window.ReactNativeWebView.postMessage(token);
//           clearInterval(tokenCheckInterval); // Stop checking once token is found
//         }
//       }
//       const tokenCheckInterval = setInterval(checkForToken, 1000); // Check every 1 second
//     })();
//   `;

//   // Function to send a notification
//   const sendNotification = async (title) => {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: 'Reminder',
//         body: title,
//       },
//       trigger: null, // Show notification immediately
//     });
//   };

//   // Function to call the API and store reminders if the token is available
//   const fetchDataAndStoreReminders = async (token) => {
//     try {
//       const response = await fetch('https://92345mxk-3501.asse.devtunnels.ms/my-reminder', {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const reminders = data.data.map((reminder) => ({
//           id: reminder.id,
//           title: reminder.title,
//           started_date: new Date(reminder.started_date).getTime(),
//           is_shown: false,
//         }));
        
//         // Store reminders in AsyncStorage
//         await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
//         console.log('Reminders saved to AsyncStorage');
//       } else {
//         console.error('Failed to fetch reminders:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Error fetching reminders:', error);
//     }
//   };

//   // Check reminders and show notifications for due reminders at the correct time
//   const checkReminders = async () => {
//     const storedReminders = JSON.parse(await AsyncStorage.getItem('reminders')) || [];
//     const now = new Date().getTime();

//     const updatedReminders = storedReminders.map((reminder) => {
//       if (!reminder.is_shown && reminder.started_date <= now) {
//         sendNotification(reminder.title); // Show notification
//         return { ...reminder, is_shown: true }; // Mark reminder as shown
//       }
//       return reminder;
//     });

//     // Update AsyncStorage with the modified reminders list
//     await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
//   };

//   useEffect(() => {
//     // Request notification permissions
//     if (Platform.OS === 'android') {
//       Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//           shouldShowAlert: true,
//           shouldPlaySound: false,
//           shouldSetBadge: false,
//         }),
//       });
//     }

//     // Interval to check reminders every second
//     const intervalId = setInterval(checkReminders, 1000);
//     return () => clearInterval(intervalId);
//   }, []);

//   // Handle pull-to-refresh action
//   const onRefresh = async () => {
//     setRefreshing(true);
//     const token = await AsyncStorage.getItem('token'); // Get token from storage

//     if (token) {
//       await fetchDataAndStoreReminders(token); // Fetch and store new reminders
//     }

//     setRefreshing(false);
//   };

//   return (
//     <ScrollView
//       contentContainerStyle={{ flex: 1 }}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <WebView 
//         ref={webViewRef}
//         source={{ uri: 'http://103.196.155.16:4173/login' }} // Starting at login URL
//         injectedJavaScript={checkTokenScript}
//         onMessage={async (event) => {
//           const token = event.nativeEvent.data;
//           console.log('Token from WebView localStorage:', token);

//           // If token is retrieved, call API to fetch and store reminders
//           if (token && !isTokenFetched) {
//             setIsTokenFetched(true);
//             await AsyncStorage.setItem('token', token); // Store token in AsyncStorage
//             fetchDataAndStoreReminders(token);
//           }
//         }}
//         style={{ flex: 1 }}
//       />
//     </ScrollView>
//   );
// }




// import React, { useEffect, useRef, useState } from 'react';
// import { WebView } from 'react-native-webview';
// import * as Notifications from 'expo-notifications';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// export default function App() {
//   const [isTokenFetched, setIsTokenFetched] = useState(false);
//   const webViewRef = useRef(null);

//   // JavaScript code to check for token in WebView's localStorage
//   const checkTokenScript = `
//     (function() {
//       function checkForToken() {
//         const token = localStorage.getItem('token');
//         if (token) {
//           window.ReactNativeWebView.postMessage(token);
//           clearInterval(tokenCheckInterval); // Stop checking once token is found
//         }
//       }
//       const tokenCheckInterval = setInterval(checkForToken, 1000); // Check every 1 second
//     })();
//   `;

//   // Function to send a notification
//   const sendNotification = async (title) => {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: 'Reminder',
//         body: title,
//       },
//       trigger: null, // Show notification immediately
//     });
//   };

//   // Function to call the API and store reminders if the token is available
//   const fetchDataAndStoreReminders = async (token) => {
//     try {
//       const response = await fetch('https://92345mxk-3501.asse.devtunnels.ms/my-reminder', {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const reminders = data.data.map((reminder) => ({
//           id: reminder.id,
//           title: reminder.title,
//           started_date: new Date(reminder.started_date).getTime(),
//           is_shown: false,
//         }));
        
//         // Store reminders in AsyncStorage
//         await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
//         console.log('Reminders saved to AsyncStorage');
//       } else {
//         console.error('Failed to fetch reminders:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Error fetching reminders:', error);
//     }
//   };

//   // Check reminders and show notifications for due reminders at the correct time
//   const checkReminders = async () => {
//     const storedReminders = JSON.parse(await AsyncStorage.getItem('reminders')) || [];
//     const now = new Date().getTime();

//     const updatedReminders = storedReminders.map((reminder) => {
//       if (!reminder.is_shown && reminder.started_date <= now) {
//         sendNotification(reminder.title); // Show notification
//         return { ...reminder, is_shown: true }; // Mark reminder as shown
//       }
//       return reminder;
//     });

//     // Update AsyncStorage with the modified reminders list
//     await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
//   };

//   useEffect(() => {
//     // Request notification permissions
//     if (Platform.OS === 'android') {
//       Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//           shouldShowAlert: true,
//           shouldPlaySound: false,
//           shouldSetBadge: false,
//         }),
//       });
//     }

//     // Interval to check reminders every second
//     const intervalId = setInterval(checkReminders, 1000);
//     return () => clearInterval(intervalId);
//   }, []);

//   return (
//     <WebView 
//       ref={webViewRef}
//       source={{ uri: 'http://103.196.155.16:4173/login' }} // Starting at login URL
//       injectedJavaScript={checkTokenScript}
//       onMessage={async (event) => {
//         const token = event.nativeEvent.data;
//         console.log('Token from WebView localStorage:', token);

//         // If token is retrieved, call API to fetch and store reminders
//         if (token && !isTokenFetched) {
//           setIsTokenFetched(true);
//           await AsyncStorage.setItem('token', token); // Store token in AsyncStorage
//           fetchDataAndStoreReminders(token);
//         }
//       }}
//       style={{ flex: 1 }}
//     />
//   );
// }




// import React, { useEffect, useRef, useState } from 'react';
// import { WebView } from 'react-native-webview';
// import * as Notifications from 'expo-notifications';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';

// export default function App() {
//   const [isTokenFetched, setIsTokenFetched] = useState(false);
//   const webViewRef = useRef(null);

//   // JavaScript code to check for token in WebView's localStorage
//   const checkTokenScript = `
//     (function() {
//       function checkForToken() {
//         const token = localStorage.getItem('token');
//         if (token) {
//           window.ReactNativeWebView.postMessage(token);
//           clearInterval(tokenCheckInterval); // Stop checking once token is found
//         }
//       }
//       const tokenCheckInterval = setInterval(checkForToken, 1000); // Check every 1 second
//     })();
//   `;

//   // Function to send a notification
//   const sendNotification = async (message) => {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: 'Reminder',
//         body: message,
//       },
//       trigger: null, // Show notification immediately
//     });
//   };

//   // Function to call the API and store reminders if the token is available
//   const fetchDataAndStoreReminders = async (token) => {
//     try {
//       const response = await fetch('https://92345mxk-3501.asse.devtunnels.ms/my-reminder', {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         const reminders = data.data.map((reminder) => ({
//           id: reminder.id,
//           title: reminder.title,
//           started_date: new Date(reminder.started_date).getTime(),
//           is_shown: false,
//         }));
        
//         // Store reminders in AsyncStorage
//         await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
//         console.log(reminders)
//         console.log('Reminders saved to AsyncStorage');
//       } else {
//         console.error('Failed to fetch reminders:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Error fetching reminders:', error);
//     }
//   };

//   // Check reminders and show notifications for due reminders
//   const checkReminders = async () => {
//     const storedReminders = JSON.parse(await AsyncStorage.getItem('reminders')) || [];
//     const now = new Date().getTime();

//     storedReminders.forEach((reminder) => {
//       if (!reminder.is_shown && reminder.started_date <= now) {
//         sendNotification(`Reminder: ${reminder.title}`);
//         reminder.is_shown = true; // Mark reminder as shown
//       }
//     });

//     // Update reminders in AsyncStorage
//     await AsyncStorage.setItem('reminders', JSON.stringify(storedReminders));
//   };

//   useEffect(() => {
//     // Request notification permissions
//     if (Platform.OS === 'android') {
//       Notifications.setNotificationHandler({
//         handleNotification: async () => ({
//           shouldShowAlert: true,
//           shouldPlaySound: false,
//           shouldSetBadge: false,
//         }),
//       });
//     }

//     // Interval to check reminders every second
//     const intervalId = setInterval(checkReminders, 1000);
//     return () => clearInterval(intervalId);
//   }, []);

//   return (
//     <WebView 
//       ref={webViewRef}
//       source={{ uri: 'http://103.196.155.16:4173/login' }} // Starting at login URL
//       injectedJavaScript={checkTokenScript}
//       onMessage={async (event) => {
//         const token = event.nativeEvent.data;
//         console.log('Token from WebView localStorage:', token);

//         // If token is retrieved, call API to fetch and store reminders
//         if (token && !isTokenFetched) {
//           setIsTokenFetched(true);
//           await AsyncStorage.setItem('token', token); // Store token in AsyncStorage
//           fetchDataAndStoreReminders(token);
//         }
//       }}
//       style={{ flex: 1 }}
//     />
//   );
// }



// import React, { useEffect, useRef, useState } from 'react';
// import { WebView } from 'react-native-webview';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';

// export default function App() {
//   const [isTokenFetched, setIsTokenFetched] = useState(false);
//   const [isDataStored, setIsDataStored] = useState(false);
//   const webViewRef = useRef(null);

//   // JavaScript code to check for token in localStorage every second
//   const checkTokenScript = `
//     (function() {
//       function checkForToken() {
//         const token = localStorage.getItem('token');
//         if (token) {
//           window.ReactNativeWebView.postMessage(token);
//           clearInterval(tokenCheckInterval); // Stop checking once token is found
//         }
//       }
//       const tokenCheckInterval = setInterval(checkForToken, 1000); // Check every 1 second
//     })();
//   `;

//   // Function to send notification
//   const sendNotification = async (message) => {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title: 'Notifikasi Penting!',
//         body: message,
//       },
//       trigger: null, // Show notification immediately
//     });
//   };

//   // Function to call API and store data if token is available
//   const fetchDataAndStore = async (token) => {
//     try {
//       const response = await fetch('https://92345mxk-3501.asse.devtunnels.ms/my-reminder', {
//         method: 'GET',
//         headers: {
          
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const data = await response.json();
//       // Store data in localStorage
//       await localStorage.setItem('apiData', JSON.stringify(data));
//       setIsDataStored(true);
//       console.log('Data saved to localStorage');
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   };

//   // Check if data is stored and show notification once
//   useEffect(() => {
//     let dataCheckInterval;
//     if (isDataStored) {
//       dataCheckInterval = setInterval(async () => {
//         const storedData = await localStorage.getItem('apiData');
//         if (storedData) {
//           sendNotification('Data sudah siap diakses');
//           clearInterval(dataCheckInterval); // Stop checking once notification is sent
//         }
//       }, 1000); // Check every second
//     }
//     return () => clearInterval(dataCheckInterval);
//   }, [isDataStored]);

//   return (
//     <WebView 
//       ref={webViewRef}
//       source={{ uri: 'http://103.196.155.16:4173/login' }} // Starting at login URL
//       injectedJavaScript={checkTokenScript}
//       onMessage={(event) => {
//         const token = event.nativeEvent.data;
//         console.log('Token from localStorage:', token);

//         // If token is retrieved, call API and store data
//         if (token && !isTokenFetched) {
//           setIsTokenFetched(true);
//           fetchDataAndStore(token);
//         }
//       }}
//       style={{ flex: 1 }}
//     />
//   );
// }


// // Request notification permissions
// if (Platform.OS === 'android') {
//   Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//       shouldShowAlert: true,
//       shouldPlaySound: false,
//       shouldSetBadge: false,
//     }),
//   });
// }





// import React from 'react';
// import { WebView } from 'react-native-webview';

// export default function App() {
//   return (
//     <WebView 
//       source={{ uri: 'https://92345mxk-4173.asse.devtunnels.ms' }} 
//       style={{ flex: 1 }} 
//     />
//   );
// }
