import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

// 定义一个简单的初始节点
const initialNodes = [
  {
    id: '1',
    type: 'default', // 你可以选择不同类型的节点
    data: { label: '初始节点' },
    position: { x: 250, y: 5 },
  },
];

// 创建一个简单的连接线
const initialEdges = [];

// 自定义节点类型选择框
const NodeTypeSelector = ({ position, onSelect }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        background: '#fff',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
      }}
    >
      <h4>选择节点类型</h4>
      <button onClick={() => onSelect('custom')}>自定义节点</button>
      <button onClick={() => onSelect('default')}>默认节点</button>
    </div>
  );
};

const App = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [isCreating, setIsCreating] = useState(false); // 用来标记是否处于创建连接状态
  const [tempEdge, setTempEdge] = useState(null); // 存储临时连接线
  const [nodeSelectorPos, setNodeSelectorPos] = useState(null); // 节点选择框位置
  const [newNodeType, setNewNodeType] = useState(null); // 存储选择的节点类型

  // 处理节点创建的回调函数
  const handleMouseDown = (event) => {
    setIsCreating(true);
    const { clientX, clientY } = event;

    // 创建一个临时的连接线
    setTempEdge({
      id: 'temp-edge',
      source: '1',
      target: 'temp-target',
      sourceHandle: 'a', // 给源节点添加一个锚点
      targetHandle: 'b',
      animated: true,
      style: { stroke: '#ddd', strokeWidth: 2 },
      type: 'smoothstep',
    });
  };

  // 处理鼠标拖动过程中
  const handleMouseMove = (event) => {
    if (!isCreating) return;

    const { clientX, clientY } = event;
    setTempEdge((prev) => ({
      ...prev,
      targetPosition: { x: clientX, y: clientY }, // 更新连接线目标点
    }));
  };

  // 处理鼠标松开
  const handleMouseUp = (event) => {
    if (!isCreating) return;

    const { clientX, clientY } = event;

    // 在鼠标松开位置显示节点类型选择框
    setNodeSelectorPos({ x: clientX, y: clientY });

    setIsCreating(false); // 结束创建状态
    setTempEdge(null); // 清除临时连接线
  };

  // 选择节点类型
  const handleNodeTypeSelect = (type) => {
    setNewNodeType(type);
    const newNode = {
      id: `${nodes.length + 1}`,
      type: type === 'custom' ? 'custom' : 'default',
      data: { label: `${type === 'custom' ? '自定义' : '默认'}节点` },
      position: nodeSelectorPos,
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
    setNodeSelectorPos(null); // 隐藏选择框
  };

  // 更新节点和边状态
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => [...nds, ...changes]),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => [...eds, ...changes]),
    []
  );

  return (
    <div
      style={{
        width: '100%',
        height: '500px',
        border: '1px solid #ddd',
        position: 'relative',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        {tempEdge && <ReactFlow.Edge {...tempEdge} />}
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* 显示节点类型选择框 */}
      {nodeSelectorPos && !newNodeType && (
        <NodeTypeSelector
          position={nodeSelectorPos}
          onSelect={handleNodeTypeSelect}
        />
      )}
    </div>
  );
};

export default App;
