import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-accenture-gray-off-white text-black p-8 flex items-start justify-center">
          <div className="max-w-lg w-full bg-white border border-accenture-pink p-6">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-accenture-pink shrink-0" aria-hidden="true" />
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
                <p className="text-sm text-accenture-gray-dark mt-1">The sizing calculator hit an unexpected error. Your inputs were not saved.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 text-sm font-medium bg-accenture-purple text-white hover:bg-accenture-purple-dark transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
