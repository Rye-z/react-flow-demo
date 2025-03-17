import { useState, useCallback } from 'react';
import { produce } from 'immer'
import { useMemoizedFn } from 'ahooks'
export default function DemoUseCallbackUseMemoizedFn() {
  const [list, setList] = useState([{
    name: '张三',
    age: 18
  }]);

  const updateLastItemName = useMemoizedFn((name) => {
    // setList(produce(list, (draft) => {
    //   draft[draft.length - 1].name = name;
    // }));

    setList(produce(draft => {
      draft[draft.length - 1].name = name;
    }));
  });
  const updateLastItemAge = useMemoizedFn((age) => {
    // setList(produce(list, (draft) => {
    //   draft[draft.length - 1].age = age;
    // }));

    // const newList = produce(draft => {
    //   draft[draft.length - 1].age = age;
    // })
    // setList(newList);

    setList(produce(draft => {
      draft[draft.length - 1].age = age;
    }));
  });


  const handleClick = useCallback(async () => {
    for (let i = 0; i < 100; i++) {
      if (i === 50) {
        updateLastItemName('李四');
      }
      else {
        updateLastItemAge(i);
      }
    }
  }, [updateLastItemName, updateLastItemAge]);

  return (
    <div>
      <div>
        <button onClick={handleClick}>click</button>
      </div>
      {
        list.map((item, index) => (
          <div key={index}>{index}:{item.name}-{item.age}</div>
        ))
      }
    </div>
  );
}
