import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/30">
            <AlertTriangle size={36} className="text-red-500" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text)]">出了点问题</h2>
          <p className="mb-6 text-sm text-[var(--color-text-muted)]">
            {this.state.error?.message || '页面加载出错，请重试'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
