import React, {useRef, useEffect, useState} from 'react'
import {
  EditorState,
  StateField,
  RangeSetBuilder,
  EditorSelection
} from "@codemirror/state";
import {
  EditorView,
  Decoration,
  WidgetType,
  keymap
} from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { createRoot } from "react-dom/client";

// 1. 定义用于展示的 React 组件
const MyReactComponent = () => {
  return (
    <span
      style={{
        color: "#007acc",
        background: "#eef",
        padding: "2px 4px",
        borderRadius: "3px",
        fontSize: "0.9em"
      }}
    >
      <span>🤣</span>
      My Component
    </span>
  );
};

const TooltipDiv = () => {
  const [hover, setHover] = useState(false);
  return (
    <div className="tooltip-container" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      Hover over me
      {hover && <div className="tooltip">This is tooltip</div>}
    </div>
  );
};
const AnotherReactComponent = () => {
  return (
    <span
      style={{
        color: "#228B22",
        background: "#e0f7e0",
        padding: "2px 4px",
        borderRadius: "3px",
        fontSize: "0.9em"
      }}
    >
      Another Component
    </span>
  );
};

// 2. 建立标签文本与 React 组件的映射
const componentMap = {
  "<MyComponent />": TooltipDiv,
  "<AnotherComponent />": AnotherReactComponent
};

// 3. 自定义 Widget，用于在编辑器中挂载 React 组件
class ReactWidget extends WidgetType {
  constructor(Component) {
    super();
    this.Component = Component;
    this.root = null; // 保存 React 根节点引用
  }

  toDOM() {
    const dom = document.createElement("span");
    // 使用 React18 的 createRoot 挂载组件
    this.root = createRoot(dom);
    this.root.render(<this.Component />);
    return dom;
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

// 4. 根据文档内容生成 decoration
//    使用 Decoration.replace 替换匹配到的标签文本，并设置 atomic: true
function createDecorations(docText) {
  const builder = new RangeSetBuilder();
  Object.keys(componentMap).forEach((tagText) => {
    // 对标签文本进行转义
    const escapedTagText = tagText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedTagText, "g");
    let match;
    while ((match = regex.exec(docText)) !== null) {
      const from = match.index;
      const to = match.index + tagText.length;
      const Component = componentMap[tagText];
      // Decoration.replace 会将 [from, to] 的文本隐藏，并显示 widget，同时设置 atomic: true
      builder.add(
        from,
        to,
        Decoration.replace({ widget: new ReactWidget(Component), atomic: true })
      );
    }
  });
  return builder.finish();
}

// 5. 使用 StateField 动态计算 decoration，文档更新时自动重计算
const widgetDecorationField = StateField.define({
  create(state) {
    return createDecorations(state.doc.toString());
  },
  update(deco, tr) {
    if (tr.docChanged) {
      return createDecorations(tr.newDoc.toString());
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f)
});

// 6. 定义自定义命令，拦截回退或删除键，当光标处于 atomic decoration 附近时，一次性删除整个 decoration
function deleteAtomicWidget({ state, dispatch }) {
  const sel = state.selection.main;
  // 如果有选区，则不处理（留给默认处理）
  if (!sel.empty) return false;

  let found = null;
  // 通过 widgetDecorationField 获取 decoration 集合
  const deco = state.field(widgetDecorationField, false);
  if (deco) {
    // 检查光标前方是否紧邻 atomic decoration
    // 注意：这里检测区间 [sel.from - 1, sel.from]，也可以检测后方，根据需求调整
    deco.between(sel.from - 1, sel.from, (from, to, dec) => {
      if (dec.spec.atomic) {
        found = { from, to };
      }
    });
  }
  if (found) {
    // 删除整个 decoration 对应的文本区域，并将光标移到删除位置
    dispatch(
      state.update({
        changes: { from: found.from, to: found.to },
        selection: EditorSelection.cursor(found.from)
      })
    );
    return true;
  }
  return false;
}

// 7. 定义自定义 keymap，将 Backspace 和 Delete 键与 deleteAtomicWidget 命令关联
const atomicWidgetKeymap = keymap.of([
  { key: "Backspace", run: deleteAtomicWidget },
  { key: "Delete", run: deleteAtomicWidget }
]);

// 8. 主组件：CodeMirror 编辑器和右侧标签列表
const CodeMirrorPythonEditorWithSidebar = () => {
  const editorDivRef = useRef(null);
  const editorViewRef = useRef(null);

  // 可供插入的标签列表（标签文本必须与 componentMap 中的 key 保持一致）
  const availableTags = [
    { id: "1", label: "My Component", tagText: "<MyComponent />" },
    { id: "2", label: "Another Component", tagText: "<AnotherComponent />" }
  ];

  // 插入标签：将标签文本插入到当前编辑器光标处
  const insertTag = (tagText) => {
    if (editorViewRef.current) {
      const view = editorViewRef.current;
      const pos = view.state.selection.main.head;
      view.dispatch({
        changes: { from: pos, to: pos, insert: tagText },
        selection: EditorSelection.cursor(pos + tagText.length)
      });
      view.focus();
    }
  };

  // 初始化 CodeMirror 编辑器
  useEffect(() => {
    if (!editorDivRef.current) return;

    const state = EditorState.create({
      doc:
`# Python 示例代码
print('Hello, world!')
# 点击右侧标签插入 React 组件标签到这里
`,
      extensions: [
        python(),             // Python 语法高亮
        autocompletion(),     // 代码补全
        widgetDecorationField, // 将标签文本替换为 React 组件 widget（atomic: true）
        atomicWidgetKeymap    // 自定义删除键盘命令，保证 atomic decoration 整体删除
      ]
    });

    editorViewRef.current = new EditorView({
      state,
      parent: editorDivRef.current
    });

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {/* 编辑器区域 */}
      <div style={{ flex: 1 }}>
        <div
          ref={editorDivRef}
          style={{
            border: "1px solid #ccc",
            minHeight: "300px",
            marginRight: "10px",
            padding: "5px"
          }}
        />
      </div>
      {/* 右侧标签列表 */}
      <div
        style={{
          width: "200px",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "4px",
          background: "#f9f9f9"
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>组件列表</h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {availableTags.map((tag) => (
            <li
              key={tag.id}
              onClick={() => insertTag(tag.tagText)}
              style={{
                marginBottom: "10px",
                cursor: "pointer",
                background: "#fff",
                padding: "5px",
                border: "1px solid #ddd",
                borderRadius: "3px"
              }}
            >
              {tag.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CodeMirrorPythonEditorWithSidebar;
