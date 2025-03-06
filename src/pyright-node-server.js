// pyright-node-server.js
import { WebSocketServer } from 'ws'
import { spawn } from 'child_process'
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter
} from 'vscode-ws-jsonrpc'
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc'

// 创建 WebSocket 服务器，监听 3000 端口，路径为 /lsp
const wss = new WebSocketServer({ port: 3000, path: '/lsp' })
console.log('LSP WebSocket server is listening on ws://localhost:3000/lsp')

wss.on('connection', (ws) => {
  console.log('Client connected')

  // 将 WebSocket 封装为符合 JSON-RPC 需求的 Socket 对象
  const socket = toSocket(ws)

  // 启动 pyright 语言服务器进程（使用 --stdio 模式）
  const serverProcess = spawn('pyright-langserver', ['--stdio'])

  // 创建 pyright 语言服务器的消息读写器（基于子进程的标准流）
  const serverReader = new StreamMessageReader(serverProcess.stdout)
  const serverWriter = new StreamMessageWriter(serverProcess.stdin)

  // 创建 WebSocket 的消息读写器
  const socketReader = new WebSocketMessageReader(socket)
  const socketWriter = new WebSocketMessageWriter(socket)

  // 将来自 WebSocket 的消息转发到 pyright 进程
  socketReader.listen((message) => {
    serverWriter.write(message)
  })

  // 将 pyright 进程的消息转发到 WebSocket
  serverReader.listen((message) => {
    socketWriter.write(message)
  })

  // 当 WebSocket 关闭时，结束 pyright 进程
  ws.on('close', () => {
    console.log('Client disconnected, killing pyright-langserver process')
    serverProcess.kill()
  })

  serverProcess.on('error', (err) => {
    console.error('pyright-langserver process error:', err)
  })

  serverProcess.on('exit', (code, signal) => {
    console.log(`pyright-langserver exited with code ${code} and signal ${signal}`)
    ws.close()
  })
})
