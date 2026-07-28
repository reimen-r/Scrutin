import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { material } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: material.background }]}>
      <View style={[styles.card, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
        <View style={[styles.iconContainer, { backgroundColor: material.errorContainer }]}>
          <Ionicons name="alert-circle-outline" size={48} color={material.onErrorContainer} />
        </View>
        <Text style={[styles.title, { color: material.onSurface }]}>Algo salió mal</Text>
        <Text style={[styles.message, { color: material.onSurfaceVariant }]}>
          {error?.message || 'Ha occurrido un error inesperado'}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: material.primary }]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={20} color={material.onPrimary} />
          <Text style={[styles.buttonText, { color: material.onPrimary }]}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ErrorBoundary(props: Props) {
  return <ErrorBoundaryClass {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.gutter,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.unit8,
    alignItems: 'center',
    gap: spacing.unit4,
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
    marginTop: spacing.unit2,
  },
  buttonText: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.semibold,
  },
});