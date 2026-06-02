import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0f1f38' }}>
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-400 mb-6">
              ขออภัยในความไม่สะดวก บางอย่างผิดพลาดไป กรุณาลองใหม่อีกครั้ง
            </p>

            {this.state.error && (
              <details className="text-left bg-gray-800/50 rounded-lg p-4 mb-4">
                <summary className="text-sm font-medium text-gray-300 cursor-pointer">
                  ข้อมูลข้อผิดพลาด (สำหรับผู้พัฒนา)
                </summary>
                <div className="mt-2 text-xs text-red-400 font-mono">
                  <p>{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              รีเฟรชหน้านี้
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}