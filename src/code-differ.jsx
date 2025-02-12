import React, { useState } from 'react'
import { diffLines } from 'diff'

/**
 * DiffWithApplyInline 组件
 * 接收 oldCode 与 newCode 两个属性，内部维护 currentCode（初始值为 oldCode）。
 * 利用 diff 库计算 currentCode 与 newCode 的差异后，采用左右对比的方式渲染，
 * 对于新增或删除的差异块，在其所在区域旁边直接显示“应用”按钮，
 * 点击后将该差异应用到 currentCode 中。
 */
const DiffWithApplyInline = ({ oldCode, newCode }) => {
  // 当前代码状态，初始为 oldCode
  const [currentCode, setCurrentCode] = useState(oldCode)

  // 计算 currentCode 与 newCode 的差异块
  const diffChunks = diffLines(currentCode, newCode)

  /**
   * 计算每个 diff 块在 currentCode 与 newCode 中的起始行索引
   * 用于后续在应用差异时确定操作位置
   */
  const computeIndices = () => {
    let currentIndex = 0
    let newIndex = 0
    return diffChunks.map(chunk => {
      const startCurrent = currentIndex
      const startNew = newIndex
      const lines = chunk.value.split('\n')
      // 注意：split 后末尾可能多出一个空字符串
      const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
      if (!chunk.added) {
        currentIndex += lineCount
      }
      if (!chunk.removed) {
        newIndex += lineCount
      }
      return { startCurrent, startNew, lineCount }
    })
  }
  const indices = computeIndices()

  /**
   * 处理应用某个差异块
   * @param {number} chunkIndex - 差异块索引
   */
  const handleApplyChunk = (chunkIndex) => {
    const chunk = diffChunks[chunkIndex]
    const { startCurrent, lineCount } = indices[chunkIndex]
    // 将当前代码按行拆分为数组
    let codeLines = currentCode.split('\n')
    if (chunk.added) {
      // 对于新增块，在 currentCode 中插入新增内容
      let newLines = chunk.value.split('\n')
      if (newLines[newLines.length - 1] === '') {
        newLines.pop()
      }
      codeLines.splice(startCurrent, 0, ...newLines)
    } else if (chunk.removed) {
      // 对于删除块，从 currentCode 中移除对应行
      codeLines.splice(startCurrent, lineCount)
    }
    const newMergedCode = codeLines.join('\n')
    setCurrentCode(newMergedCode)
  }

  /**
   * 自定义渲染对比视图
   * 利用左右两栏展示旧代码与新代码，对于差异块在对应一侧显示“应用”按钮
   */
  return (
    <div>
      <h3>代码对比</h3>
      <div style={{ fontFamily: 'monospace', border: '1px solid #ddd', padding: '10px' }}>
        {diffChunks.map((chunk, index) => {
          // 将块内容按行拆分，去除末尾可能出现的空字符串
          let lines = chunk.value.split('\n')
          if (lines[lines.length - 1] === '') {
            lines.pop()
          }
          // 如果是新增块，则 newCode 有内容，而 oldCode 空缺；背景色标识绿色（新增）
          if (chunk.added) {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}
              >
                {/* 左侧为空 */}
                <div style={{ flex: 1, padding: '5px' }}></div>
                {/* 右侧显示新增内容 */}
                <div style={{ flex: 1, padding: '5px', backgroundColor: '#eaffea' }}>
                  <pre style={{ margin: 0 }}>{lines.join('\n')}</pre>
                </div>
                {/* 旁边显示“应用”按钮 */}
                <div style={{ padding: '5px' }}>
                  <button onClick={() => handleApplyChunk(index)}>应用</button>
                </div>
              </div>
            )
          }
          // 如果是删除块，则 oldCode 有内容，而 newCode 空缺；背景色标识红色（删除）
          else if (chunk.removed) {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}
              >
                {/* 左侧显示删除的内容 */}
                <div style={{ flex: 1, padding: '5px', backgroundColor: '#ffecec' }}>
                  <pre style={{ margin: 0 }}>{lines.join('\n')}</pre>
                </div>
                {/* 右侧为空 */}
                <div style={{ flex: 1, padding: '5px' }}></div>
                {/* 旁边显示“应用”按钮 */}
                <div style={{ padding: '5px' }}>
                  <button onClick={() => handleApplyChunk(index)}>应用</button>
                </div>
              </div>
            )
          }
          // 对于未变化的块，在左右两侧均显示相同内容，无“应用”按钮
          else {
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  marginBottom: '5px'
                }}
              >
                <div style={{ flex: 1, padding: '5px' }}>
                  <pre style={{ margin: 0 }}>{lines.join('\n')}</pre>
                </div>
                <div style={{ flex: 1, padding: '5px' }}>
                  <pre style={{ margin: 0 }}>{lines.join('\n')}</pre>
                </div>
                <div style={{ width: '70px' }}></div>
              </div>
            )
          }
        })}
      </div>
      <h3>当前代码</h3>
      <pre style={{ backgroundColor: '#f7f7f7', padding: '10px', border: '1px solid #ddd' }}>
        {currentCode}
      </pre>
    </div>
  )
}

/**
 * 示例组件，传入旧代码和新代码进行对比
 */
const PureComponent = () => {
  const oldCode = `
const a = 10
const b = 10
const c = () => console.log('foo')

if(a > 10) {
  console.log('bar')
}

console.log('done')
`
  const newCode = `
const a = 10
const boo = 10

if(a === 10) {
  console.log('bar')
}
`
  return <DiffWithApplyInline oldCode={oldCode} newCode={newCode} />
}

export default PureComponent
