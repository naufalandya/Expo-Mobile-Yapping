import React from 'react';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export default function App() {
  const runFirst = `
    (function() {
      const token = localStorage.getItem('token');
      window.ReactNativeWebView.postMessage(token);
    })();
  `;

  const sendNotification = async (token) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Token Retrieved!',
        body: token ? `Token: ${token}` : 'No token found',
      },
      trigger: null,
    });
  };

  return (
    <WebView 
      source={{ uri: 'https://92345mxk-4173.asse.devtunnels.ms' }}
      injectedJavaScript={runFirst}
      onMessage={(event) => {
        const token = event.nativeEvent.data;
        console.log('Token from localStorage:', token);

        setTimeout(() => {
          sendNotification(token); // Send notification after 1 minute
        }, 60000); // 1 minute delay (60000 milliseconds)
      }}
      style={{ flex: 1 }}
    />
  );
}

// Request notification permissions
if (Platform.OS === 'android') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}





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
