import { Component, type ReactNode } from 'react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback: (args: { error: Error | null; resetErrorBoundary: () => void }) => ReactNode;
  resetKeys?: ReadonlyArray<unknown>;
}

interface QueryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class QueryErrorBoundary extends Component<QueryErrorBoundaryProps, QueryErrorBoundaryState> {
  state: QueryErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Failed to render paginated query', error);
  }

  componentDidUpdate(prevProps: QueryErrorBoundaryProps) {
    if (this.state.hasError && !areArraysEqual(prevProps.resetKeys, this.props.resetKeys)) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback({ error: this.state.error, resetErrorBoundary: this.resetErrorBoundary });
    }

    return this.props.children;
  }
}

function areArraysEqual(a?: ReadonlyArray<unknown>, b?: ReadonlyArray<unknown>) {
  if (a === b) {
    return true;
  }
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => Object.is(value, b[index]));
}
