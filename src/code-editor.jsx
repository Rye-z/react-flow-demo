import React, {useRef} from 'react'
import {render} from 'react-dom'
import Editor from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

/**
 * 自定义标签组件
 * 设置为 inline-block，不换行，超出时显示省略，同时 title 显示完整文本
 */
const CustomTag = ({text}) => {
  return (
    <span
      style={{
        display: 'inline-block',
        minWidth: '30px', // 设置最小宽度，可根据需要调整
        maxWidth: '100px', // 超出时显示省略，可根据需要调整
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
        background: '#eee',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2px 2px',
        userSelect: 'none',
        fontSize: '10px',
      }}
      title={text}
    >
      <div>123</div>
    </span>
  )
}

/**
 * MonacoTagManager 管理标签的插入与删除
 *
 * 1. 插入标签时，在当前光标处插入占位符（由两个零宽字符包裹标签文本），然后通过 decoration 设置该占位符的宽度为 widget 宽度。
 * 2. 同时添加 content widget 显示实际标签。
 * 3. 拦截删除以及左右箭头键，确保当光标处在标签区域时，操作都以标签为一个原子单元移动。
 */
class MonacoTagManager {
  constructor(editor) {
    this.editor = editor
    // 保存标签信息：{ tagId, tagText, decorationId, widget }
    this.tags = []
    this.initActions()
  }

  // 添加自定义动作：拦截 Backspace、Delete、LeftArrow、RightArrow
  initActions() {
    this.editor.addAction({
      id: 'custom-backspace',
      label: 'Custom Backspace',
      keybindings: [monaco.KeyCode.Backspace],
      run: () => this.deleteTagAtCursor('backspace'),
    })
    this.editor.addAction({
      id: 'custom-delete',
      label: 'Custom Delete',
      keybindings: [monaco.KeyCode.Delete],
      run: () => this.deleteTagAtCursor('delete'),
    })
    // 拦截左箭头：如果光标在标签内部，则跳到标签开始位置
    this.editor.addAction({
      id: 'custom-cursor-left',
      label: 'Custom Cursor Left',
      keybindings: [monaco.KeyCode.LeftArrow],
      run: () => {
        const pos = this.editor.getPosition()
        for (const tag of this.tags) {
          const range = this.editor.getModel().getDecorationRange(tag.decorationId)
          if (!range) continue
          if (
            pos.lineNumber === range.startLineNumber &&
            pos.column > range.startColumn &&
            pos.column <= range.endColumn
          ) {
            this.editor.setPosition({
              lineNumber: range.startLineNumber,
              column: range.startColumn,
            })
            return null
          }
        }
        // 非标签区域时调用默认行为
        this.editor.trigger('keyboard', 'cursorLeft', {})
        return null
      },
    })
    // 拦截右箭头：如果光标在标签内部，则跳到标签结束位置
    this.editor.addAction({
      id: 'custom-cursor-right',
      label: 'Custom Cursor Right',
      keybindings: [monaco.KeyCode.RightArrow],
      run: () => {
        const pos = this.editor.getPosition()
        for (const tag of this.tags) {
          const range = this.editor.getModel().getDecorationRange(tag.decorationId)
          if (!range) continue
          if (
            pos.lineNumber === range.startLineNumber &&
            pos.column >= range.startColumn &&
            pos.column < range.endColumn
          ) {
            this.editor.setPosition({
              lineNumber: range.startLineNumber,
              column: range.endColumn,
            })
            return null
          }
        }
        this.editor.trigger('keyboard', 'cursorRight', {})
        return null
      },
    })
  }

  // 插入标签：在当前光标处插入占位符、添加 decoration 和 content widget
  insertTag(tagText) {
    const editor = this.editor
    const position = editor.getPosition()
    const tagId = `tag_${Date.now()}`

    // 占位符：由零宽字符包裹标签文本
    const placeholder = `\u200b${tagText}\u200b`
    editor.executeEdits('', [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        text: placeholder,
        forceMoveMarkers: true,
      },
    ])

    // 初始 decoration 使用临时样式，保证占位符初始不显示实际宽度（后续会动态更新）
    let decorationId = editor.deltaDecorations([], [
      {
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + placeholder.length
        ),
        options: {
          inlineClassName: 'hidden-tag-code-temp',
          stickiness:
          monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      },
    ])[0]

    // 创建 content widget，在占位符位置显示实际标签
    const widgetId = `widget_${tagId}`
    const widget = {
      getId: () => widgetId,
      getDomNode: () => {
        const domNode = document.createElement('div')
        domNode.id = widgetId
        domNode.style.display = 'inline-block'
        render(<CustomTag text={tagText}/>, domNode)
        return domNode
      },
      getPosition: () => ({
        position: position,
        preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
      }),
    }
    editor.addContentWidget(widget)

    // 保存标签信息
    this.tags.push({
      tagId,
      tagText,
      decorationId,
      widget,
    })

    // 重试机制，确保 widget 渲染后能正确测量宽度
    let tries = 0
    const maxTries = 10
    const updateDecoration = () => {
      const widgetDom = document.getElementById(widgetId)
      if (widgetDom && widgetDom.offsetWidth > 0) {
        const width = widgetDom.offsetWidth
        console.log('@@@width', width)
        // 生成动态样式类名称
        const dynamicClassName = `hidden-tag-code-${tagId}`
        // 注意这里不要设置 font-size:0，以免让占位符完全失去宽度，
        // 我们采用 color: transparent 来隐藏文字，同时指定宽度
        const css = `
          .${dynamicClassName} {
            color: transparent;
            display: inline-block;
            width: ${width}px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `
        // 将动态样式插入到页面中
        let styleTag = document.getElementById('dynamic-tag-styles')
        if (!styleTag) {
          styleTag = document.createElement('style')
          styleTag.id = 'dynamic-tag-styles'
          document.head.appendChild(styleTag)
        }
        styleTag.innerHTML += css

        // 更新 decoration，使用动态生成的样式类
        decorationId = editor.deltaDecorations([decorationId], [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + placeholder.length
            ),
            options: {
              inlineClassName: dynamicClassName,
              stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          },
        ])[0]

        // 更新内部保存的 decorationId
        const tagItem = this.tags.find((t) => t.tagId === tagId)
        if (tagItem) {
          tagItem.decorationId = decorationId
        }
      } else if (tries < maxTries) {
        tries++
        setTimeout(updateDecoration, 100)
      } else {
        console.warn('无法测量到 widget 宽度，默认使用 0 宽度')
      }
    }

    updateDecoration()
  }

  deleteTagAtCursor(direction) {
    const editor = this.editor
    const pos = editor.getPosition()
    let tagToDelete = null

    for (let tag of this.tags) {
      const range = editor.getModel().getDecorationRange(tag.decorationId)
      if (!range) continue
      if (direction === 'backspace') {
        // 如果光标在标签内部或恰好在标签右侧，则删除该标签
        if (
          pos.lineNumber === range.startLineNumber &&
          ((pos.column > range.startColumn && pos.column <= range.endColumn) ||
            pos.column === range.endColumn)
        ) {
          tagToDelete = tag
          break
        }
      } else if (direction === 'delete') {
        // 如果光标在标签内部或恰好在标签左侧，则删除该标签
        if (
          pos.lineNumber === range.startLineNumber &&
          ((pos.column >= range.startColumn && pos.column < range.endColumn) ||
            pos.column === range.startColumn)
        ) {
          tagToDelete = tag
          break
        }
      }
    }

    if (tagToDelete) {
      const range = editor.getModel().getDecorationRange(tagToDelete.decorationId)
      if (range) {
        editor.executeEdits('', [
          {
            range: range,
            text: '',
            forceMoveMarkers: true,
          },
        ])
      }
      editor.deltaDecorations([tagToDelete.decorationId], [])
      editor.removeContentWidget(tagToDelete.widget)
      // 将光标移动到该标签起始位置，避免连续删除相邻标签
      editor.setPosition({
        lineNumber: range.startLineNumber,
        column: range.startColumn,
      })
      this.tags = this.tags.filter((t) => t.tagId !== tagToDelete.tagId)
    } else {
      if (direction === 'backspace') {
        editor.trigger('keyboard', 'deleteLeft', {})
      } else if (direction === 'delete') {
        editor.trigger('keyboard', 'deleteRight', {})
      }
    }
  }
}

/**
 * MyEditor 组件：包含 Monaco Editor 编辑器和插入标签的按钮
 */
const MyEditor = () => {
  const editorRef = useRef(null)
  const tagManagerRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    tagManagerRef.current = new MonacoTagManager(editor)
  }

  // 点击按钮插入标签（示例中使用较短文本测试效果）
  const insertTagHandler = () => {
    if (tagManagerRef.current) {
      tagManagerRef.current.insertTag('这是一个标签')
    }
  }

  return (
    <div>
      <button onClick={insertTagHandler}>插入标签</button>
      <Editor
        height="500px"
        defaultLanguage="javascript"
        defaultValue={'// 请在此编辑代码'}
        onMount={handleEditorDidMount}
      />
      {/* 初始临时样式，确保占位符初始不占宽 */}
      <style>{`
        .hidden-tag-code-temp {
          color: transparent;
          display: inline-block;
          /* 不使用 font-size: 0，保证 decoration 能占据设定的宽度 */
        }
      `}</style>
    </div>
  )
}

export default MyEditor
