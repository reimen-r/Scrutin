import React, { Suspense } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TSJScannerScreen from '../screens/TSJScannerScreen';
import TSJHistoryScreen from '../screens/TSJHistoryScreen';
import FilesScreen from '../screens/FilesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScanPickerScreen from '../screens/ScanPickerScreen';
import DrivePickerScreen from '../screens/DrivePickerScreen';
import ErrorBoundary from '../components/ErrorBoundary';
import { ContractType, AnalysisResult, TSJExtractionResult } from '../types/contract';

// Lazy-loaded screens for performance
const LazyResultScreen = React.lazy(() => import('../screens/ResultScreen'));
const LazyTSJResultScreen = React.lazy(() => import('../screens/TSJResultScreen'));

function ResultScreenWrapper(props: any) {
  return (
    <ErrorBoundary>
      <LazyResultScreen {...props} />
    </ErrorBoundary>
  );
}

function TSJResultScreenWrapper(props: any) {
  return (
    <ErrorBoundary>
      <LazyTSJResultScreen {...props} />
    </ErrorBoundary>
  );
}

export type RootStackParamList = {
  MainTabs: { screen?: keyof TabStackParamList } | undefined;
  Scanner: { contractType: ContractType; contractLabel: string };
  ContractResult: { result: AnalysisResult };
  ContractHistory: undefined;
  TSJScanner: undefined;
  TSJResult: { result: TSJExtractionResult };
  TSJHistory: undefined;
  DrivePicker: undefined;
};

export type TabStackParamList = {
  DashboardTab: undefined;
  ScanTab: undefined;
  FilesTab: undefined;
  SettingsTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabStackParamList>();

function DashboardTab() {
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
}

function ScanTab() {
  return (
    <ErrorBoundary>
      <ScanPickerScreen />
    </ErrorBoundary>
  );
}

function FilesTab() {
  return (
    <ErrorBoundary>
      <FilesScreen />
    </ErrorBoundary>
  );
}

function SettingsTab() {
  return (
    <ErrorBoundary>
      <SettingsScreen />
    </ErrorBoundary>
  );
}

function MainTabs() {
  const { material } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: material.secondary,
        tabBarInactiveTintColor: material.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: material.surfaceContainerLowest,
          borderTopColor: material.outlineVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.03,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardTab}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanTab}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'scan' : 'scan-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FilesTab"
        component={FilesTab}
        options={{
          tabBarLabel: 'Files',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingFallback() {
  const { material } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: material.background }]}>
      <ActivityIndicator size="large" color={material.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { material } = useTheme();

  return (
    <NavigationContainer>
      <Suspense fallback={<LoadingFallback />}>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: material.background },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="ContractResult" component={ResultScreenWrapper} />
          <Stack.Screen name="ContractHistory" component={HistoryScreen} />
          <Stack.Screen name="TSJScanner" component={TSJScannerScreen} />
          <Stack.Screen name="TSJResult" component={TSJResultScreenWrapper} />
          <Stack.Screen name="TSJHistory" component={TSJHistoryScreen} />
          <Stack.Screen name="DrivePicker" component={DrivePickerScreen} />
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
