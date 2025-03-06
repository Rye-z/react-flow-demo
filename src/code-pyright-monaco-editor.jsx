import {useRef} from 'react'
import Editor from '@monaco-editor/react'
import {MonacoPyrightProvider} from 'monaco-pyright-lsp'

/**
 * @param {{ consoleRender: (height: number) => React.ReactNode }} props
 */
function CodeEditor() {
  const pyrightProvider = useRef(null)
  const containerRef = useRef(null)

  const handleEditorDidMount = async (editor, monaco) => {
    pyrightProvider.current = new MonacoPyrightProvider(undefined, {})

    if (!pyrightProvider.current) return

    await pyrightProvider.current.init(monaco)
    await pyrightProvider.current.setupDiagnostics(editor)
  }

  return (
    <div ref={containerRef} style={{height: '100%'}}>
      <Editor
        height="100%"
        defaultLanguage="python"
        defaultValue="// some comment"
        onMount={handleEditorDidMount}
      />
    </div>
  )
}

export default CodeEditor
