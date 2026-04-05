import React, { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ---- helpers ----
// map hour -> a,b,c,... (17:00 = a)
const hourToSuffix = (hour: number) => {
  // ป้องกันกรณี hour < 17
  const index = hour - 17
  return String.fromCharCode('a'.charCodeAt(0) + index)
}

// map selected second to 15-sec bucket
const secondToBucket = (sec: number) => {
  if (sec < 15) return { start: 0, end: 14.99 }
  if (sec < 30) return { start: 15, end: 29.99 }
  if (sec < 45) return { start: 30, end: 44.99 }
  return { start: 45, end: 59.99 }
}

// transform csv rows -> chart data
const transformRows = (rows: any[]) => {
  return rows.map(r => ({
    name: r.SV,
    value: r.S1,
  }))
}

export default function Station() {
  const [prefix, setPrefix] = useState('AMKO')
  const [rows, setRows] = useState<any[]>([])
  const [date, setDate] = useState('2025-07-23')
  const [time, setTime] = useState('17:00:00') // TH time

  const hour = Number(time.split(':')[0])
  const sec = Number(time.split(':')[2])

  const suffix = hourToSuffix(hour)
  const bucket = secondToBucket(sec)

  // คำนวณ day of year จาก date
  const dayOfYear = useMemo(() => {
    const d = new Date(date)
    const start = new Date(d.getFullYear(), 0, 0)
    const diff = d.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }, [date])

  // file path logic ตามระบบจริง
  const station = { MARKER_NAM: prefix }
  const fileSuffix = `${dayOfYear}${suffix}`
  const filePath = `/204/${station.MARKER_NAM}${fileSuffix}.csv`

  // load CSV จริงตาม filePath และช่วงเวลา
  useEffect(() => {
    fetch(filePath)
      .then(res => {
        if (!res.ok) throw new Error(`File not found: ${filePath}`)
        return res.text()
      })
      .then(csvText => {
        const parsed = Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        })

        const filtered = (parsed.data as any[]).filter(r => {
          const s = Number(r.sec ?? r.SEC ?? r.second)
          return s >= bucket.start && s <= bucket.end
        })

        setRows(filtered)
      })
      .catch(err => {
        console.error('CSV load error', err)
        setRows([])
      })
  }, [filePath, bucket])

  // ✅ FIX: useMemo ถูกต้อง ไม่มีการเรียกซ้อน
  const chartData = useMemo(() => transformRows(rows), [rows])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <input
              type="text"
              className="border px-2 py-1 w-24"
              value={prefix}
              onChange={e => setPrefix(e.target.value.toUpperCase())}
              placeholder="AMKO"
            />
            <input type="time" step={1} value={time} onChange={e => setTime(e.target.value)} />
            <Button>{filePath}</Button>
          </div>
          <div className="text-sm text-muted-foreground">
            แสดงช่วงวินาที {bucket.start} – {bucket.end}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
