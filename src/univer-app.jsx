import {useEffect, useRef} from 'react'
import {createUniver, defaultTheme, LocaleType, merge} from '@univerjs/presets'
import {UniverSheetsCorePreset} from '@univerjs/presets/preset-sheets-core'
import UniverPresetSheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
import {CopyCommand} from '@univerjs/ui'

import '@univerjs/presets/lib/styles/preset-sheets-core.css'
import {BooleanNumber, SheetTypes} from '@univerjs/core'

const initData = {
  id: 'workbook-01',
  locale: LocaleType.ZH_CN,
  name: 'universheet',
  sheetOrder: ['sheet-01'],
  appVersion: '3.0.0-alpha',
  sheets: {
    'sheet-01': {
      type: SheetTypes.GRID,
      id: 'sheet-01',
      name: 'sheet1',
      hidden: BooleanNumber.FALSE,
      rowCount: 10,
      columnCount: 20,
      zoomRatio: 1,
      scrollTop: 200,
      scrollLeft: 100,
      defaultColumnWidth: 93,
      defaultRowHeight: 27,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: {
        width: 32,
        hidden: BooleanNumber.FALSE,
      },
      columnHeader: {
        height: 24,
        hidden: BooleanNumber.FALSE,
      },
      selections: [],
      rightToLeft: BooleanNumber.FALSE,
      pluginMeta: {},
      cellData: {},
    },
  },
}

export function App() {
  const containerRef = useRef(null)
  const univerAPI = useRef(null)
  const tableDataRef = useRef(null)

  const getActiveTableData = async () => {
    const activeWorkbook = univerAPI.current.getActiveWorkbook()
    const sheet = activeWorkbook.getActiveSheet()

    const maxCols = sheet.getMaxColumns()
    const maxRows = sheet.getMaxRows()
    const sourceRange = sheet.getRange(0, 0, maxRows, maxCols)
    sheet.setActiveSelection(sourceRange)

    const clipboardContent = await navigator.clipboard.readText()
    await univerAPI.current.executeCommand(CopyCommand.id)
    const csvData = (await navigator.clipboard.readText()).trim()

    console.log(csvData)
    navigator.clipboard.writeText(clipboardContent)

    tableDataRef.current = activeWorkbook.save()

    init(tableDataRef.current)
  }

  const init = (data) => {
    const {univerAPI: _univerAPI} = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: merge(
          {},
          UniverPresetSheetsCoreZhCN,
        ),
      },
      theme: defaultTheme,
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
          options: {
            formulaBar: false, // 禁用公式菜单
          },
          menu: {
            'sheet.menu.sheet-frozen': {
              hidden: true
            },
            'sheet.header-menu.sheet-frozen': {
              hidden: true
            },
            'sheet.contextMenu.permission': {
              hidden: true
            },
            'sheet.menu.paste-special': {
              hidden: true
            }
          },
          header: false,
          toolbar: false,
          footer: false,
        }),
      ],
    })
    univerAPI.current = _univerAPI
    univerAPI.current.createUniverSheet(data || initData)

    return () => univerAPI.current.dispose()
  }

  useEffect(() => init(), [containerRef])

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <button onClick={getActiveTableData} style={{width: '42px'}}>click</button>
      <div style={{flex: '1'}} ref={containerRef}>123</div>
    </div>
  )
}

export default App
