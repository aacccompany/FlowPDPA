import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** When this changes (e.g. the user switches view) a previous crash is cleared. */
  resetKey?: string
}

interface State {
  error: Error | null
}

/**
 * Contains a crash to one part of a page: the rest of the app (navigation, other views)
 * keeps working, and the person gets a plain message with a retry instead of a blank screen.
 */
export class ViewBoundary extends Component<Props, State> {
  public state: State = { error: null }

  public static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('View crashed:', error, info.componentStack)
  }

  public componentDidUpdate(previous: Props) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  public render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        role="alert"
        className="mx-auto my-10 max-w-md rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      >
        <h2 className="text-lg font-semibold text-red-800">แสดงหน้านี้ไม่สำเร็จ</h2>
        <p className="mt-2 text-sm leading-6 text-red-900">
          ข้อมูลที่ได้รับจากระบบอยู่ในรูปแบบที่หน้านี้ไม่รองรับ เมนูอื่นยังใช้งานได้ตามปกติ
        </p>
        <button
          className="mt-5 inline-flex h-10 items-center rounded-full bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800"
          onClick={() => this.setState({ error: null })}
        >
          ลองอีกครั้ง
        </button>
        <details className="mt-5 text-left text-xs text-red-900">
          <summary className="cursor-pointer font-medium">รายละเอียดสำหรับผู้พัฒนา</summary>
          <p className="mt-2 break-words font-mono">{this.state.error.message}</p>
        </details>
      </div>
    )
  }
}
