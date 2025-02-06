import {FUniver, LocaleType, merge, Univer, UniverInstanceType} from '@univerjs/core'
import {defaultTheme} from '@univerjs/design'

import {UniverFormulaEnginePlugin} from '@univerjs/engine-formula'
import {UniverRenderEnginePlugin} from '@univerjs/engine-render'
import {UniverUIPlugin} from '@univerjs/ui'
import {UniverDocsPlugin} from '@univerjs/docs'
import {UniverDocsUIPlugin} from '@univerjs/docs-ui'
import {UniverSheetsPlugin} from '@univerjs/sheets'
import {UniverSheetsUIPlugin} from '@univerjs/sheets-ui'
import {UniverSheetsFormulaPlugin} from '@univerjs/sheets-formula'
import {UniverSheetsFormulaUIPlugin} from '@univerjs/sheets-formula-ui'
import {UniverSheetsNumfmtPlugin} from '@univerjs/sheets-numfmt'
import {UniverSheetsNumfmtUIPlugin} from '@univerjs/sheets-numfmt-ui'

import DesignZhCN from '@univerjs/design/locale/zh-CN'
import UIZhCN from '@univerjs/ui/locale/zh-CN'
import DocsUIZhCN from '@univerjs/docs-ui/locale/zh-CN'
import SheetsZhCN from '@univerjs/sheets/locale/zh-CN'
import SheetsUIZhCN from '@univerjs/sheets-ui/locale/zh-CN'
import SheetsFormulaUIZhCN from '@univerjs/sheets-formula-ui/locale/zh-CN'
import SheetsNumfmtUIZhCN from '@univerjs/sheets-numfmt-ui/locale/zh-CN'
import {BooleanNumber, SheetTypes} from '@univerjs/core'

import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/sheets-formula-ui/lib/index.css'
import '@univerjs/sheets-numfmt-ui/lib/index.css'
import {useEffect, useRef, forwardRef, useImperativeHandle} from 'react'


const data = {
  id: 'workbook-01',
  locale: LocaleType.ZH_CN,
  name: 'universheet',
  sheetOrder: ['sheet-01'],
  appVersion: '3.0.0-alpha',
  sheets: {
    'sheet-01': {
      type: SheetTypes.GRID,
      id: 'sheet-01',
      cellData: {},
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
      selections: ['A2'],
      rightToLeft: BooleanNumber.FALSE,
      pluginMeta: {},
    },
  },
}

const App = () => {
  const containerRef = useRef(null)
  const univerRef = useRef(null)
  const univerApiRef = useRef(null)

  const init = (data) => {
    if (!containerRef.current) {
      throw Error('container not initialized')
    }
    const univer = new Univer({
      theme: defaultTheme,
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: merge(
          {},
          DesignZhCN,
          UIZhCN,
          DocsUIZhCN,
          SheetsZhCN,
          SheetsUIZhCN,
          SheetsFormulaUIZhCN,
          SheetsNumfmtUIZhCN
        ),
      },
    })

    univer.registerPlugin(UniverRenderEnginePlugin)
    univer.registerPlugin(UniverFormulaEnginePlugin)

    univer.registerPlugin(UniverUIPlugin, {
      container: containerRef.current,
      toolbar: false,
      footer: false,
    })

    univer.registerPlugin(UniverDocsPlugin)
    univer.registerPlugin(UniverDocsUIPlugin)

    univer.registerPlugin(UniverSheetsPlugin)
    univer.registerPlugin(UniverSheetsUIPlugin, {
      formulaBar: false, // 禁用公式菜单
      menu: {
        'sheet.menu.sheet-frozen': {
          hidden: true
        },
        'sheet.header-menu.sheet-frozen': {
          hidden: true
        },
        'sheet.contextMenu.permission': {
          hidden: true
        }
      }
    })
    univer.registerPlugin(UniverSheetsFormulaPlugin)
    univer.registerPlugin(UniverSheetsFormulaUIPlugin)
    univer.registerPlugin(UniverSheetsNumfmtPlugin)
    univer.registerPlugin(UniverSheetsNumfmtUIPlugin)
    univer.createUnit(UniverInstanceType.UNIVER_SHEET, data)

    univerRef.current = univer

    return () => {
      univerRef.current?.dispose()
    }
  }

  const getData = () => {
    // const sheet = univerApiRef.current.getActiveWorkbook().getActiveSheet()
    // if (sheet) {
    //   throw new Error('Workbook is not initialized')
    // }
    // const result = sheet.save()
    // console.log(result)
    // return result
  }

  useEffect(() => {
    init(data)
  }, [])

  return (
    <>
      <button onClick={getData}>click</button>
      <div style={{height: '100%'}} ref={containerRef} className="univer-container"/>
    </>
  )
}

export default App
