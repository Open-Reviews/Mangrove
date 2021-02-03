import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // logErrorToMyService(error, errorInfo);
    console.warn('ErrorBoundary did catch');
  }

  render() {
    if (this.state.hasError) {
      return <p>Something went wrong. Check logs for more info.</p>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
