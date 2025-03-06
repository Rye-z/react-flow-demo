import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

// 定义 ErrorAction 和 CloseAction 常量（数值可以根据实际需求调整）
const ErrorAction = {
  Continue: 1,
  Shutdown: 2,
};

const CloseAction = {
  DoNotRestart: 1,
  Restart: 2,
};

function App() {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化 Monaco Editor
    const editor = monaco.editor.create(containerRef.current, {
      value: '# 在此输入你的 Python 代码...\n',
      language: 'python',
      automaticLayout: true,
    });
    editorRef.current = editor;

    // 构造 WebSocket URL，假设后端 LSP 服务挂在 /lsp 路径
    const webSocket = new WebSocket('ws://localhost:3000/lsp');

    webSocket.onopen = () => {
      // 将 WebSocket 转换为符合 LSP 需要的 Socket 对象
      const socket = toSocket(webSocket);
      const reader = new WebSocketMessageReader(socket);
      const writer = new WebSocketMessageWriter(socket);

      // 创建并启动 Monaco 语言客户端
      const languageClient = new MonacoLanguageClient({
        name: 'Pyright Language Client',
        clientOptions: {
          // 仅对 Python 文件生效
          documentSelector: ['python'],
          errorHandler: {
            error: () => ErrorAction.Continue,
            closed: () => CloseAction.DoNotRestart,
          },
        },
        connectionProvider: {
          get: (errorHandler, closeHandler) => {
            return Promise.resolve({ reader, writer });
          },
        },
      });

      languageClient.start();

      reader.onClose(() => languageClient.stop());
    };

    // 组件卸载时清理资源
    return () => {
      editor.dispose();
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.close();
      }
    };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export default App;
